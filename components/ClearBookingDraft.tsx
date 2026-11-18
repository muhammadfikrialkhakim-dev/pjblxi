"use client";

import { useEffect } from "react";

/**
 * Dipasang di halaman checkout — begitu halaman ini tampil, artinya
 * pesanan SUDAH berhasil dibuat di database. Baru di titik inilah aman
 * untuk menghapus draft form booking (nama/email/dll di BookingForm dan
 * pilihan tanggal/tiket di TiketPicker), supaya form booking berikutnya
 * mulai bersih. Kalau pembuatan pesanan gagal, halaman ini tidak pernah
 * tercapai, jadi draft tetap tersimpan dan tidak hilang sia-sia.
 */
export default function ClearBookingDraft({ wisataSlug }: { wisataSlug?: string }) {
  useEffect(() => {
    try {
      sessionStorage.removeItem("booking_draft_v1");
      if (wisataSlug) sessionStorage.removeItem(`tiket_picker_${wisataSlug}`);
    } catch {
      // sessionStorage tidak tersedia — abaikan saja.
    }
  }, [wisataSlug]);

  return null;
}
