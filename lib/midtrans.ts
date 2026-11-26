import midtransClient from "midtrans-client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendOrderStatusEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

function isProduction() {
  return process.env.MIDTRANS_IS_PRODUCTION === "true";
}

/**
 * Instance Snap API (server-side only) untuk membuat transaksi & snap token.
 * Butuh MIDTRANS_SERVER_KEY di environment.
 */
export function getSnapClient() {
  if (!process.env.MIDTRANS_SERVER_KEY) {
    throw new Error(
      "MIDTRANS_SERVER_KEY belum diset. Tambahkan di .env.local sesuai .env.local.example."
    );
  }

  return new midtransClient.Snap({
    isProduction: isProduction(),
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
  });
}

/**
 * Instance Core API, dipakai untuk mengecek status transaksi langsung ke
 * Midtrans (dipakai webhook sebagai verifikasi tambahan selain signature key).
 */
export function getCoreApiClient() {
  if (!process.env.MIDTRANS_SERVER_KEY) {
    throw new Error(
      "MIDTRANS_SERVER_KEY belum diset. Tambahkan di .env.local sesuai .env.local.example."
    );
  }

  return new midtransClient.CoreApi({
    isProduction: isProduction(),
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
  });
}

/**
 * Mapping metode pembayaran di UI kita -> daftar channel Snap Midtrans
 * yang diaktifkan (enabled_payments). Ini membuat popup Snap langsung
 * menampilkan opsi yang relevan sesuai pilihan pengunjung.
 */
export const PAYMENT_METHOD_CHANNELS: Record<string, string[]> = {
  bank_transfer: ["bca_va", "bni_va", "bri_va", "permata_va", "other_va"],
  e_wallet: ["gopay", "shopeepay"],
  credit_card: ["credit_card"],
  qris: ["other_qris", "gopay"],
};

/** Status Midtrans (transaction_status) -> status internal aplikasi kita. */
export function mapMidtransStatus(transactionStatus: string, fraudStatus?: string) {
  switch (transactionStatus) {
    case "capture":
      if (fraudStatus === "challenge") {
        return { payment_status: "pending", order_status: "awaiting_payment" } as const;
      }
      return { payment_status: "paid", order_status: "completed" } as const;
    case "settlement":
      return { payment_status: "paid", order_status: "completed" } as const;
    case "pending":
      return { payment_status: "pending", order_status: "awaiting_payment" } as const;
    case "deny":
    case "failure":
      return { payment_status: "failed", order_status: "cancelled" } as const;
    case "cancel":
      return { payment_status: "failed", order_status: "cancelled" } as const;
    case "expire":
      return { payment_status: "expired", order_status: "cancelled" } as const;
    case "refund":
    case "partial_refund":
      return { payment_status: "refunded", order_status: "cancelled" } as const;
    default:
      return { payment_status: "pending", order_status: "awaiting_payment" } as const;
  }
}

export type MidtransTxStatus = {
  transaction_status: string;
  fraud_status?: string;
  transaction_id?: string;
};

/**
 * Terapkan status dari Midtrans ke sebuah pesanan. Dipakai BERSAMA oleh
 * webhook dan sinkronisasi (polling halaman), jadi aturannya satu tempat:
 *
 * - Perubahan hanya terjadi kalau status lama cocok (kondisi `.eq` di
 *   database), jadi kalau webhook & polling datang bersamaan, hanya satu
 *   yang menang — email & catatan pembayaran tidak ganda.
 * - LUNAS dari percobaan bayar mana pun diterima, termasuk percobaan lama
 *   (uang sudah masuk, jadi tidak boleh hilang walau pengunjung sempat
 *   ganti metode). Midtrans order_id yang membayar disimpan sebagai yang
 *   terkini.
 * - GAGAL/KEDALUWARSA hanya dianggap kalau datang dari percobaan SAAT INI.
 *   Percobaan lama yang dibatalkan/kedaluwarsa tidak boleh membatalkan
 *   pesanan yang sedang dibayar lewat percobaan baru.
 * - REFUND hanya berlaku untuk pesanan yang sudah lunas.
 *
 * Mengembalikan true kalau status pesanan benar-benar berubah.
 */
export async function applyMidtransStatus(
  supabase: SupabaseClient,
  order: { id: string; total_price: number; payment_status: string; midtrans_order_id?: string | null },
  midtransOrderId: string,
  tx: MidtransTxStatus
): Promise<boolean> {
  // Transaksi kedaluwarsa / dibatalkan karena pengunjung tidak jadi membayar
  // (QR atau VA sudah keluar tetapi tidak dibayar): pesanan TIDAK dibatalkan,
  // melainkan disimpan sebagai DRAF supaya bisa dilanjutkan. Hanya percobaan
  // bayar SAAT INI yang dihitung; percobaan lama diabaikan.
  if (tx.transaction_status === "expire" || tx.transaction_status === "cancel") {
    const isCurrentAttempt = !order.midtrans_order_id || order.midtrans_order_id === midtransOrderId;
    if (!isCurrentAttempt || order.payment_status !== "pending") return false;
    const { data: drafted } = await supabase
      .from("orders")
      .update({ order_status: "draft" })
      .eq("id", order.id)
      .eq("payment_status", "pending")
      .eq("order_status", "awaiting_payment")
      .select("id");
    if (!drafted?.length) return false;
    await sendOrderStatusEmail(supabase, order.id, "expired");
    return true;
  }

  const mapped = mapMidtransStatus(tx.transaction_status, tx.fraud_status);
  if (mapped.payment_status === "pending" || mapped.payment_status === order.payment_status) return false;

  // Transaksi lama (sebelum midtrans_order_id dipakai) dianggap percobaan saat ini.
  const isCurrent = !order.midtrans_order_id || order.midtrans_order_id === midtransOrderId;

  let from: string;
  if (mapped.payment_status === "paid") from = "pending";
  else if (mapped.payment_status === "refunded") from = "paid";
  else {
    if (!isCurrent) return false;
    from = "pending";
  }
  if (order.payment_status !== from) return false;

  const update: Record<string, unknown> = { payment_status: mapped.payment_status, order_status: mapped.order_status };
  if (mapped.payment_status === "paid") update.midtrans_order_id = midtransOrderId;

  const { data: updated } = await supabase
    .from("orders")
    .update(update)
    .eq("id", order.id)
    .eq("payment_status", from)
    .select("id");
  if (!updated?.length) return false;

  await sendOrderStatusEmail(supabase, order.id, mapped.payment_status);

  // Pesanan batal/kedaluwarsa = voucher yang dipakainya dikembalikan supaya bisa dipakai lagi.
  if (mapped.payment_status === "failed" || mapped.payment_status === "expired") {
    await supabase.from("user_promos").update({ used_at: null, order_id: null }).eq("order_id", order.id);
  }

  if (mapped.payment_status !== "refunded") {
    await supabase.from("payments").insert({
      order_id: order.id,
      provider: "midtrans",
      provider_reference: tx.transaction_id ?? null,
      amount: order.total_price,
      status: mapped.payment_status === "paid" ? "success" : "failed",
      paid_at: mapped.payment_status === "paid" ? new Date().toISOString() : null,
    });
  }
  return true;
}

/**
 * Cek status ASLI ke Midtrans untuk order-order yang masih 'pending', lalu
 * update database kalau ternyata sudah lunas/gagal di sisi Midtrans.
 *
 * Ini jaring pengaman selain webhook (app/api/midtrans/webhook/route.ts):
 * webhook adalah jalur utama, tapi perlu URL publik yang bisa dipanggil
 * Midtrans dari internet — tidak akan sampai kalau aplikasi masih jalan di
 * localhost tanpa tunnel (ngrok, dst). Dengan fungsi ini, setiap kali
 * halaman pesanan/Transaksi/Dashboard dibuka (atau di-refresh otomatis oleh
 * OrderStatusPoller), kita AKTIF bertanya ke Midtrans "order ini sekarang
 * statusnya apa?".
 *
 * Sengaja "best effort": kalau satu order gagal dicek (mis. belum pernah
 * ada transaksi Midtrans untuk order itu), dilewati saja tanpa membuat
 * seluruh halaman gagal dimuat.
 */
export async function syncPendingOrdersWithMidtrans(
  supabase: SupabaseClient,
  pendingOrders: { id: string; midtrans_order_id: string | null; total_price: number; payment_method?: string | null }[]
) {
  const toCheck = pendingOrders.filter((o) => o.midtrans_order_id);
  if (!toCheck.length) return;

  let core: ReturnType<typeof getCoreApiClient>;
  try {
    core = getCoreApiClient();
  } catch {
    return; // MIDTRANS_SERVER_KEY belum diset — lewati saja, biarkan tetap pending.
  }

  await Promise.all(
    toCheck.map(async (o) => {
      try {
        const status = (await core.transaction.status(o.midtrans_order_id as string)) as MidtransTxStatus;
        await applyMidtransStatus(
          supabase,
          { id: o.id, total_price: o.total_price, payment_status: "pending", midtrans_order_id: o.midtrans_order_id },
          o.midtrans_order_id as string,
          status
        );
      } catch {
        // Order ini belum punya transaksi di sisi Midtrans, atau API sedang
        // error — biarkan saja tetap 'pending', tidak menggagalkan halaman.
      }
    })
  );
}

/**
 * Pesanan yang sudah lewat 60 menit tanpa pernah membuat transaksi pembayaran
 * (pengunjung masuk halaman pembayaran lalu pergi) dijadikan DRAF — bukan
 * dibatalkan. Pesanan yang sudah punya transaksi Midtrans ditangani lewat
 * status 'expire' dari Midtrans (lihat applyMidtransStatus). Best effort.
 */
export async function draftStaleOrders() {
  try {
    const admin = createAdminClient();
    await admin
      .from("orders")
      .update({ order_status: "draft" })
      .eq("order_status", "awaiting_payment")
      .eq("payment_status", "pending")
      .is("midtrans_order_id", null)
      .lt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
  } catch {
    // SUPABASE_SERVICE_ROLE_KEY belum diset / migrasi belum dijalankan — lewati.
  }
}
