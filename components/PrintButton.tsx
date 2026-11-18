"use client";

import { Printer } from "lucide-react";

/** Membuka dialog cetak browser — dari sana e-tiket bisa dicetak atau disimpan sebagai PDF. */
export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-secondary no-print">
      <Printer className="h-4 w-4" aria-hidden /> Cetak / Simpan PDF
    </button>
  );
}
