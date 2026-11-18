"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import MonthYearFields, { BULAN } from "@/components/MonthYearFields";

// Hanya satu export yang boleh berjalan pada satu waktu (dialog cetak bersifat global).
let exporting = false;

/**
 * Mengekspor laporan bulanan TANPA pindah halaman/tab: laporan
 * (/admin/reports/monthly) dimuat di iframe tersembunyi, lalu dialog cetak
 * browser dibuka untuk iframe itu. Pilih "Simpan sebagai PDF" pada dialog.
 */
function useExportPdf() {
  const [busy, setBusy] = useState(false);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    frameRef.current?.remove();
    frameRef.current = null;
    exporting = false;
    setBusy(false);
  }, []);

  // Bersihkan iframe kalau komponen dilepas di tengah proses.
  useEffect(() => () => cleanup(), [cleanup]);

  const run = useCallback(
    (month: number, year: number) => {
      if (exporting) return;
      exporting = true;
      setBusy(true);

      const prevTitle = document.title;
      const title = `Laporan Bulanan ${BULAN[month - 1]} ${year} — Explore Malang`;

      const iframe = document.createElement("iframe");
      iframe.setAttribute("aria-hidden", "true");
      iframe.tabIndex = -1;
      // Di luar layar tapi tetap "dirender" — iframe display:none tidak bisa dicetak di sebagian browser.
      Object.assign(iframe.style, {
        position: "fixed",
        left: "-10000px",
        top: "0",
        width: "900px",
        height: "700px",
        border: "0",
        opacity: "0",
        pointerEvents: "none",
      });
      iframe.src = `/admin/reports/monthly?bulan=${month}&tahun=${year}`;

      iframe.onload = () => {
        const win = iframe.contentWindow;
        if (!win) {
          cleanup();
          return;
        }
        const finish = () => {
          document.title = prevTitle;
          cleanup();
        };
        win.addEventListener("afterprint", finish, { once: true });

        // Judul dokumen jadi nama file bawaan saat "Simpan sebagai PDF".
        document.title = title;
        try {
          win.document.title = title;
        } catch {
          // abaikan
        }

        // Jeda singkat supaya tata letak & font selesai sebelum dicetak.
        setTimeout(() => {
          try {
            win.focus();
            win.print();
          } catch {
            finish();
          }
        }, 400);

        // Pengaman: kalau "afterprint" tidak pernah datang, buka kunci tombolnya.
        resetTimer.current = setTimeout(finish, 5 * 60 * 1000);
      };

      document.body.appendChild(iframe);
      frameRef.current = iframe;
    },
    [cleanup]
  );

  return { run, busy };
}

/** Pilih bulan + tahun lalu export. */
export default function MonthlyPdfExport({
  month,
  year,
  currentYear,
}: {
  month: number;
  year: number;
  currentYear: number;
}) {
  const { run, busy } = useExportPdf();

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        run(Number(f.get("bulan")), Number(f.get("tahun")));
      }}
    >
      <MonthYearFields month={month} year={year} currentYear={currentYear} />
      <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <FileDown className="h-4 w-4" aria-hidden />}
        {busy ? "Menyiapkan…" : "Export PDF"}
      </button>
    </form>
  );
}

/** Ikon kecil untuk satu baris bulan di tabel. */
export function MonthlyPdfRowButton({ month, year, label }: { month: number; year: number; label: string }) {
  const { run, busy } = useExportPdf();

  return (
    <button
      type="button"
      onClick={() => run(month, year)}
      disabled={busy}
      className="inline-flex items-center gap-1 rounded p-1.5 text-forest-700 hover:bg-forest-50 disabled:opacity-60"
      title={`Export laporan ${label} (PDF)`}
      aria-label={`Export laporan ${label} sebagai PDF`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <FileDown className="h-4 w-4" aria-hidden />}
    </button>
  );
}
