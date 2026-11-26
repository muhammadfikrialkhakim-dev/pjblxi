import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Notifikasi email status pesanan lewat Resend (https://resend.com).
 * Butuh env: RESEND_API_KEY dan (opsional) EMAIL_FROM.
 * Kalau RESEND_API_KEY belum diset, email dilewati (tidak menggagalkan
 * pembayaran/webhook) dan hanya dicatat di log server.
 */

type Status = "paid" | "failed" | "expired" | "refunded";

const COPY: Record<Status, { subject: (c: string) => string; title: string; body: string }> = {
  paid: {
    subject: (c) => `Pembayaran berhasil — pesanan ${c}`,
    title: "Pembayaran berhasil 🎉",
    body: "Terima kasih! Pembayaran Anda sudah kami terima dan pesanan terkonfirmasi. Tunjukkan e-tiket dari halaman Pesanan Saya di lokasi wisata.",
  },
  failed: {
    subject: (c) => `Pembayaran gagal — pesanan ${c}`,
    title: "Pembayaran gagal",
    body: "Pembayaran untuk pesanan ini gagal atau dibatalkan, sehingga pesanan dibatalkan. Silakan buat pesanan baru jika masih ingin berkunjung.",
  },
  expired: {
    subject: (c) => `Pesanan ${c} disimpan sebagai draf`,
    title: "Pesanan disimpan sebagai draf",
    body: "Pembayaran belum diselesaikan dan batas waktunya sudah lewat, tetapi pesanan Anda tidak dibatalkan — pesanan disimpan sebagai draf. Buka halaman Pesanan Saya dan pilih Lanjutkan Pembayaran selama kuota tanggal kunjungan masih tersedia.",
  },
  refunded: {
    subject: (c) => `Pesanan ${c} direfund`,
    title: "Pesanan direfund",
    body: "Pembayaran pesanan ini sudah direfund. Dana akan kembali sesuai ketentuan metode pembayaran Anda.",
  },
};

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Kirim email status pesanan. Best effort — tidak pernah melempar error. */
export async function sendOrderStatusEmail(supabase: SupabaseClient, orderId: string, status: string) {
  try {
    if (!(status in COPY)) return;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY belum diset — email notifikasi dilewati.");
      return;
    }

    const { data: o } = await supabase
      .from("orders")
      .select("order_code, customer_name, customer_email, visit_date, ticket_quantity, total_price, tiket(name, wisata(name))")
      .eq("id", orderId)
      .single();
    if (!o?.customer_email) return;

    const tiket = (Array.isArray(o.tiket) ? o.tiket[0] : o.tiket) as { name?: string; wisata?: { name?: string } | { name?: string }[] } | null;
    const wisataObj = Array.isArray(tiket?.wisata) ? tiket?.wisata[0] : tiket?.wisata;
    const wisataName = wisataObj?.name ?? "Wisata";
    const copy = COPY[status as Status];
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const total = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(o.total_price));

    const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#1a3624">
  <h2 style="margin-bottom:4px">${copy.title}</h2>
  <p>Halo ${esc(o.customer_name)},</p>
  <p>${copy.body}</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
    <tr><td style="padding:6px 0;color:#666">Kode pesanan</td><td><b>${esc(o.order_code)}</b></td></tr>
    <tr><td style="padding:6px 0;color:#666">Wisata</td><td>${esc(wisataName)}${tiket?.name ? " — " + esc(tiket.name) : ""}</td></tr>
    <tr><td style="padding:6px 0;color:#666">Tanggal kunjungan</td><td>${esc(String(o.visit_date))}</td></tr>
    <tr><td style="padding:6px 0;color:#666">Jumlah tiket</td><td>${o.ticket_quantity}</td></tr>
    <tr><td style="padding:6px 0;color:#666">Total</td><td>${total}</td></tr>
  </table>
  <p><a href="${site}/account" style="background:#d9622b;color:#fff;padding:10px 18px;border-radius:4px;text-decoration:none">Lihat Pesanan Saya</a></p>
  <p style="color:#888;font-size:12px">Explore Malang — Pemesanan Tiket Wisata Malang Raya</p>
</div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "Explore Malang <onboarding@resend.dev>",
        to: [o.customer_email],
        subject: copy.subject(o.order_code),
        html,
      }),
    });
    if (!res.ok) console.error("Gagal kirim email:", res.status, await res.text());
  } catch (err) {
    console.error("Gagal kirim email notifikasi:", err);
  }
}
