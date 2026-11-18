"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkEligibility, type Promo } from "@/lib/promo";

/**
 * Membuat pesanan baru.
 *
 * Harga SELALU dihitung ulang di sini dari database — nilai harga yang
 * dikirim browser tidak dipakai sama sekali (form HTML bisa diubah lewat
 * devtools). Hal yang sama berlaku untuk voucher: kelayakan & besar diskon
 * dinilai ulang di server, dan voucher "dikunci" (ditandai terpakai) SEBELUM
 * pesanan dibuat supaya tidak bisa dipakai dua kali pada pesanan berbeda.
 * Kalau pesanan gagal dibuat, voucher dilepas lagi.
 */
export async function createOrder(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Pertahanan terakhir: kalau sesi login ternyata sudah habis tepat saat
  // submit (mis. tab dibiarkan lama terbuka), jangan buat order tanpa
  // pemilik — kembalikan ke halaman login dulu.
  if (!user) {
    redirect("/login?redirectTo=/account");
  }

  const tiket_id = String(formData.get("tiket_id") ?? "");
  const visit_date = String(formData.get("visit_date") ?? "");
  const quantity = Math.floor(Number(formData.get("quantity")));
  const customer_name = String(formData.get("customer_name") ?? "").trim();
  const customer_email = String(formData.get("customer_email") ?? "").trim();
  const customer_phone = String(formData.get("customer_phone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const userPromoId = String(formData.get("user_promo_id") ?? "");

  // Kembali ke form booking dengan pesan (data yang sudah diketik tetap
  // tersimpan di sessionStorage oleh BookingForm).
  function back(message: string): never {
    const qs = new URLSearchParams({
      tiket: tiket_id,
      date: visit_date,
      qty: String(Number.isFinite(quantity) && quantity > 0 ? quantity : 1),
      error: message,
    });
    redirect(`/booking?${qs.toString()}`);
  }

  if (!tiket_id || !/^\d{4}-\d{2}-\d{2}$/.test(visit_date) || !Number.isFinite(quantity) || quantity < 1 || quantity > 100) {
    back("Data pemesanan tidak valid. Silakan periksa kembali.");
  }
  if (!customer_name || !customer_email || !customer_phone) {
    back("Nama, email, dan nomor telepon wajib diisi.");
  }

  // Harga & wisata dari database (RLS: hanya paket tiket yang aktif yang terbaca).
  const { data: tiket } = await supabase.from("tiket").select("id, price, wisata_id").eq("id", tiket_id).maybeSingle();
  if (!tiket) back("Paket tiket tidak ditemukan atau sudah tidak tersedia.");

  const unit_price = Number(tiket.price);
  const subtotal = unit_price * quantity;

  // ─── Voucher (opsional) ────────────────────────────────────────────────
  let discount = 0;
  let promoId: string | null = null;
  let promoCode: string | null = null;
  let claimId: string | null = null;
  const admin = userPromoId ? createAdminClient() : null;

  if (userPromoId && admin) {
    const { data: claim } = await admin
      .from("user_promos")
      .select("id, used_at, promo:promos(*)")
      .eq("id", userPromoId)
      .eq("user_id", user.id) // voucher orang lain tidak boleh dipakai
      .maybeSingle();

    const promo = (claim?.promo ?? null) as Promo | null;
    if (!claim || !promo) back("Voucher tidak ditemukan.");
    if (claim.used_at) back("Voucher ini sudah dipakai.");

    const eligibility = checkEligibility(promo, { wisataId: tiket.wisata_id, subtotal });
    if (!eligibility.ok) back(`Voucher tidak bisa dipakai: ${eligibility.reason}.`);

    // Kunci voucher: update hanya berhasil kalau masih belum terpakai.
    const { data: reserved } = await admin
      .from("user_promos")
      .update({ used_at: new Date().toISOString() })
      .eq("id", claim.id)
      .is("used_at", null)
      .select("id");
    if (!reserved?.length) back("Voucher ini sudah dipakai.");

    discount = eligibility.discount;
    promoId = promo.id;
    promoCode = promo.code;
    claimId = claim.id;
  }

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      tiket_id,
      visit_date,
      ticket_quantity: quantity,
      unit_price,
      total_price: subtotal - discount,
      promo_id: promoId,
      promo_code: promoCode,
      discount_amount: discount,
      customer_name,
      customer_email,
      customer_phone,
      notes,
      customer_id: user.id,
    })
    .select()
    .single();

  if (error || !order) {
    // Pesanan gagal dibuat — lepaskan voucher yang sempat dikunci.
    if (claimId && admin) await admin.from("user_promos").update({ used_at: null }).eq("id", claimId);

    // Trigger database menolak kalau melebihi sisa kuota (pesan: "KUOTA_HABIS|<sisa>").
    if (error?.message?.includes("KUOTA_HABIS")) {
      const left = Number(error.message.split("KUOTA_HABIS|")[1]?.match(/^\d+/)?.[0] ?? 0);
      back(
        left > 0
          ? `Kuota tidak mencukupi. Sisa kuota untuk tanggal tersebut tinggal ${left} tiket.`
          : "Maaf, kuota tiket untuk tanggal tersebut sudah habis. Silakan pilih tanggal lain."
      );
    }
    back(`Gagal membuat pesanan. ${error?.message ?? ""}`.trim());
  }

  if (claimId && admin) await admin.from("user_promos").update({ order_id: order.id }).eq("id", claimId);

  redirect(`/orders/${order.id}`);
}
