"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Selama status masih 'awaiting_payment', refresh halaman berkala supaya
 * status berubah OTOMATIS begitu pembayaran masuk — tanpa pengunjung perlu
 * reload. Tiap refresh, server menanyakan status terkini ke Midtrans (lihat
 * halaman pesanan), jadi ini bekerja juga di localhost tanpa webhook.
 *
 * - 5 detik sekali selama 2 menit pertama, lalu 15 detik sekali sampai total
 *   ±10 menit (cukup untuk transfer lewat aplikasi bank). Setelah itu
 *   pengunjung masih bisa menekan "Cek status sekarang".
 * - Begitu tab kembali terlihat (mis. pulang dari aplikasi bank/e-wallet),
 *   langsung refresh tanpa menunggu giliran berikutnya.
 * - Berhenti sendiri begitu status berubah (isPending jadi false).
 */
const FAST_ATTEMPTS = 24; // 24 x 5 dtk = 2 menit
const SLOW_ATTEMPTS = 32; // 32 x 15 dtk = 8 menit

export default function OrderStatusPoller({ isPending }: { isPending: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!isPending) return;

    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const delay = attempts < FAST_ATTEMPTS ? 5000 : 15000;
      timer = setTimeout(() => {
        attempts += 1;
        // Tab yang sedang tersembunyi tidak perlu di-refresh; handler
        // visibilitychange di bawah yang menyusul begitu tab dibuka lagi.
        if (document.visibilityState === "visible") router.refresh();
        if (attempts < FAST_ATTEMPTS + SLOW_ATTEMPTS) schedule();
      }, delay);
    };
    schedule();

    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isPending, router]);

  return null;
}
