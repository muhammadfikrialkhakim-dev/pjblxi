"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  applyMidtransStatus,
  getCoreApiClient,
  getSnapClient,
  mapMidtransStatus,
  PAYMENT_METHOD_CHANNELS,
  type MidtransTxStatus,
} from "@/lib/midtrans";
import { Order } from "@/lib/types";

export type SnapTokenResult = { token: string; redirectUrl: string } | { error: string };

/** Error dengan pesan yang aman & jelas untuk ditampilkan ke pengunjung. */
class UserFacingError extends Error {}

/**
 * Membuat transaksi Midtrans Snap untuk sebuah order yang sudah ada, lalu
 * mengembalikan snap token ke client untuk membuka popup pembayaran.
 *
 * Total & data order diambil dari database (bukan dari input client) supaya
 * tidak bisa dimanipulasi. Status pembayaran yang sesungguhnya HANYA diupdate
 * dari Midtrans (webhook + sinkronisasi di halaman pesanan), bukan dari sini.
 *
 * Mengembalikan { error } (bukan melempar) agar pesannya sampai ke pengunjung:
 * di production, Next menyamarkan pesan error dari server action.
 */
export async function createSnapToken(orderId: string, method: string): Promise<SnapTokenResult> {
  try {
    const supabase = createClient();

    const { data: order, error } = await supabase
      .from("orders")
      .select("*, tiket(*, wisata(*))")
      .eq("id", orderId)
      .single();

    if (error || !order) throw new UserFacingError("Pesanan tidak ditemukan.");
    const o = order as Order;

    if (o.payment_status === "paid") throw new UserFacingError("Pesanan ini sudah dibayar.");
    if (o.order_status === "cancelled") {
      throw new UserFacingError("Pesanan ini sudah dibatalkan atau kedaluwarsa. Silakan buat pesanan baru.");
    }

    const admin = createAdminClient();

    // Sebelum membuat percobaan bayar baru, periksa percobaan sebelumnya:
    // - kalau ternyata SUDAH DIBAYAR, jangan buat transaksi baru (cegah bayar
    //   dua kali) — statusnya langsung diperbarui;
    // - kalau masih menunggu (mis. VA yang belum ditransfer), batalkan supaya
    //   tidak ada dua tagihan yang sama-sama bisa dibayar.
    if (o.midtrans_order_id) {
      let previous: MidtransTxStatus | null = null;
      try {
        const core = getCoreApiClient();
        previous = (await core.transaction.status(o.midtrans_order_id)) as MidtransTxStatus;
        await applyMidtransStatus(admin, o, o.midtrans_order_id, previous);
        const mapped = mapMidtransStatus(previous.transaction_status, previous.fraud_status);
        if (mapped.payment_status === "pending") {
          await core.transaction.cancel(o.midtrans_order_id).catch(() => undefined);
        }
      } catch {
        // Percobaan sebelumnya belum pernah dipakai bayar (belum ada di
        // Midtrans) atau Midtrans sedang error — lanjutkan saja.
      }

      if (previous) {
        const mapped = mapMidtransStatus(previous.transaction_status, previous.fraud_status);
        if (mapped.payment_status === "paid") throw new UserFacingError("Pembayaran untuk pesanan ini sudah kami terima.");
        if (mapped.payment_status === "failed" || mapped.payment_status === "expired") {
          throw new UserFacingError("Pesanan ini sudah dibatalkan atau kedaluwarsa. Silakan buat pesanan baru.");
        }
      }
    }

    const snap = getSnapClient();

    // PENTING: order_id yang dikirim ke Midtrans HARUS unik setiap kali
    // sebuah transaksi baru dibuat — Midtrans menolak (400, "order_id sudah
    // digunakan") kalau order_id yang sama dikirim dua kali, walaupun untuk
    // order internal yang sama. Ini terjadi tiap kali pengunjung mencoba
    // bayar lagi: ganti metode, reload halaman, atau tutup popup lalu klik
    // "Bayar Sekarang" lagi.
    //
    // Jadi jangan pakai o.order_code apa adanya — buat id baru per percobaan
    // (order_code + timestamp), simpan ke orders.midtrans_order_id supaya
    // webhook & sinkronisasi bisa mencocokkan balik ke order aslinya.
    const midtransOrderId = `${o.order_code}-${Date.now()}`;

    const parameter = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: Math.round(o.total_price),
      },
      enabled_payments: PAYMENT_METHOD_CHANNELS[method] ?? undefined,
      customer_details: {
        first_name: o.customer_name,
        email: o.customer_email,
        phone: o.customer_phone ?? undefined,
      },
      // Midtrans mewajibkan jumlah semua item = gross_amount. Kalau ada diskon,
      // tambahkan baris bernilai negatif supaya totalnya tetap cocok.
      item_details: [
        {
          id: o.tiket_id,
          price: Math.round(o.unit_price),
          quantity: o.ticket_quantity,
          name: `${o.tiket?.wisata?.name ?? "Tiket"} - ${o.tiket?.name ?? ""}`.slice(0, 50),
        },
        ...(Number(o.discount_amount) > 0
          ? [
              {
                id: `PROMO-${o.promo_code ?? "DISKON"}`.slice(0, 50),
                price: -Math.round(Number(o.discount_amount)),
                quantity: 1,
                name: `Diskon ${o.promo_code ?? ""}`.trim().slice(0, 50),
              },
            ]
          : []),
      ],
      // Masa bayar 60 menit — sama dengan lama kursi "ditahan" oleh kuota
      // (lihat supabase/migration_add_ticket_quota.sql). Lewat dari itu
      // transaksi kedaluwarsa dan kuota kembali ke pembeli lain.
      expiry: { unit: "minutes" as const, duration: 60 },
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/orders/${o.id}?justPaid=1`,
      },
    };

    const transaction = await snap.createTransaction(parameter);

    // Simpan order_id unik yang baru dipakai & metode yang dipilih (statusnya
    // tetap 'pending' sampai Midtrans mengonfirmasi).
    //
    // Ditulis lewat client service-role: RLS tabel orders hanya mengizinkan
    // admin meng-update, jadi kalau memakai client milik pengunjung, update
    // ini diam-diam GAGAL — midtrans_order_id tidak tersimpan, sehingga
    // webhook dan sinkronisasi tidak pernah bisa mencocokkan transaksi ke
    // pesanannya. Kepemilikan pesanan sudah dipastikan query RLS di atas.
    const { error: saveError } = await admin
      .from("orders")
      .update({ payment_method: method, midtrans_order_id: midtransOrderId })
      .eq("id", orderId);
    if (saveError) throw new Error(`Gagal menyimpan data pembayaran: ${saveError.message}`);

    return { token: transaction.token as string, redirectUrl: transaction.redirect_url as string };
  } catch (err) {
    if (err instanceof UserFacingError) return { error: err.message };
    console.error("[createSnapToken]", err);
    const base = "Pembayaran belum bisa dibuat. Silakan coba lagi sebentar lagi.";
    return { error: process.env.NODE_ENV !== "production" && err instanceof Error ? `${base} (${err.message})` : base };
  }
}
