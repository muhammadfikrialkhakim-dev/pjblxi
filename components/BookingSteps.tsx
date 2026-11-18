import { Check, X } from "lucide-react";

const STEPS = ["Detail pemesanan", "Pembayaran", "E-tiket"] as const;

/**
 * Indikator langkah pemesanan, dipakai di halaman booking dan halaman pesanan.
 * `current` = langkah yang sedang aktif (1–3); langkah sebelumnya ditandai selesai.
 * `failed` menandai langkah aktif sebagai gagal (pesanan dibatalkan/kedaluwarsa).
 */
export default function BookingSteps({ current, failed = false }: { current: 1 | 2 | 3; failed?: boolean }) {
  return (
    <nav aria-label="Langkah pemesanan" className="no-print border-b border-forest-100 bg-white">
      <ol className="container-page flex items-center py-4 text-sm font-semibold sm:text-base">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < current || (n === 3 && current === 3);
          const active = n === current && !done;
          const isFailed = failed && active;
          return (
            <li key={label} className="flex flex-1 items-center last:flex-none" aria-current={active ? "step" : undefined}>
              <span className="flex items-center gap-2.5">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm ${
                    isFailed
                      ? "bg-red-100 text-red-700"
                      : done
                      ? "bg-forest-500 text-white"
                      : active
                      ? "bg-clay-500 text-white"
                      : "bg-forest-100 text-forest-700"
                  }`}
                >
                  {isFailed ? <X className="h-4 w-4" aria-hidden /> : done ? <Check className="h-4 w-4" aria-hidden /> : n}
                </span>
                <span
                  className={`${active || done ? "text-forest-900" : "text-ink/45"} ${
                    active ? "" : "hidden sm:inline"
                  }`}
                >
                  {label}
                </span>
              </span>
              {n < STEPS.length && (
                <span aria-hidden className={`mx-3 h-px flex-1 sm:mx-4 ${n < current ? "bg-forest-400" : "bg-forest-200"}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
