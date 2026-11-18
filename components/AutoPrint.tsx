"use client";

import { useEffect, useRef } from "react";

/**
 * Membuka dialog cetak browser otomatis begitu halaman laporan tampil
 * (dipakai tombol "Export PDF" di dashboard). Pilih "Simpan sebagai PDF"
 * pada dialog tersebut untuk mendapatkan file PDF-nya.
 */
export default function AutoPrint() {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    // Jeda singkat supaya font & tata letak selesai dimuat sebelum dicetak.
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, []);

  return null;
}
