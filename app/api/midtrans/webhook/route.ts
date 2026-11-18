import crypto from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyMidtransStatus } from "@/lib/midtrans";

/**
 * Endpoint Payment Notification Midtrans.
 * Set URL ini di Midtrans Dashboard → Settings → Configuration →
 * Payment Notification URL, contoh:
 *   https://domainanda.com/api/midtrans/webhook
 *
 * Midtrans akan mengirim POST setiap ada perubahan status transaksi.
 * Kita TIDAK pernah mempercayai status dari client — hanya dari sini,
 * setelah signature diverifikasi. Aturan perubahan status ada di
 * applyMidtransStatus (lib/midtrans.ts), dipakai bersama dengan sinkronisasi
 * otomatis di halaman pesanan.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const { order_id, status_code, gross_amount, signature_key, transaction_status } = body ?? {};

  if (!order_id || !status_code || !gross_amount || !signature_key || !transaction_status) {
    return NextResponse.json({ message: "Payload tidak lengkap" }, { status: 400 });
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    console.error("MIDTRANS_SERVER_KEY belum diset di server.");
    return NextResponse.json({ message: "Server belum dikonfigurasi" }, { status: 500 });
  }

  // Verifikasi signature sesuai dokumentasi Midtrans:
  // SHA512(order_id + status_code + gross_amount + server_key)
  const expectedSignature = crypto
    .createHash("sha512")
    .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
    .digest("hex");

  const a = Buffer.from(String(signature_key));
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    console.warn("Midtrans webhook: signature tidak valid untuk order", order_id);
    return NextResponse.json({ message: "Signature tidak valid" }, { status: 403 });
  }

  const supabase = createAdminClient();
  const cols = "id, total_price, payment_status, midtrans_order_id";

  // Cocokkan notifikasi ke pesanan:
  // 1) midtrans_order_id (percobaan bayar saat ini),
  // 2) order_code persis (transaksi lama sebelum midtrans_order_id dipakai),
  // 3) order_code yang diturunkan dari "<order_code>-<timestamp>" — untuk
  //    notifikasi dari percobaan bayar LAMA yang sudah digantikan percobaan
  //    baru. Tanpa ini, pembayaran yang masuk lewat percobaan lama akan hilang.
  let { data: order } = await supabase.from("orders").select(cols).eq("midtrans_order_id", order_id).maybeSingle();
  if (!order) {
    ({ data: order } = await supabase.from("orders").select(cols).eq("order_code", order_id).maybeSingle());
  }
  if (!order) {
    const baseCode = String(order_id).replace(/-\d{10,}$/, "");
    if (baseCode !== order_id) {
      ({ data: order } = await supabase.from("orders").select(cols).eq("order_code", baseCode).maybeSingle());
    }
  }

  if (!order) {
    console.error("Midtrans webhook: order tidak ditemukan", order_id);
    return NextResponse.json({ message: "Order tidak ditemukan" }, { status: 404 });
  }

  try {
    await applyMidtransStatus(supabase, order, String(order_id), body);
  } catch (err) {
    console.error("Midtrans webhook: gagal update order", err);
    return NextResponse.json({ message: "Gagal update order" }, { status: 500 }); // Midtrans akan retry
  }

  return NextResponse.json({ message: "OK" });
}
