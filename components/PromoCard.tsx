import Link from "next/link";
import { CalendarClock, Flame, MapPin, ShoppingBag } from "lucide-react";
import { formatIDR } from "@/lib/types";
import { describeDiscount, discountBadge, formatPromoDate, type Promo } from "@/lib/promo";
import CopyCodeButton from "@/components/CopyCodeButton";

/** Sisa hari sampai promo berakhir (null kalau tanpa batas waktu). */
function daysLeft(endsAt: string | null): number | null {
  if (!endsAt) return null;
  return Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86_400_000);
}

/** Kartu voucher bergaya tiket. `action` = tombol di kanan bawah (Klaim, dll). */
export default function PromoCard({
  promo,
  action,
  remaining,
  dimmed,
}: {
  promo: Promo;
  action?: React.ReactNode;
  /** Sisa kuota klaim; undefined/null = tanpa batas / tidak diketahui. */
  remaining?: number | null;
  dimmed?: boolean;
}) {
  const left = daysLeft(promo.ends_at);
  const endingSoon = left !== null && left <= 7;
  const quotaPct =
    promo.claim_quota && remaining != null
      ? Math.round(((promo.claim_quota - remaining) / promo.claim_quota) * 100)
      : null;
  const almostGone = remaining != null && remaining > 0 && promo.claim_quota ? remaining / promo.claim_quota <= 0.2 : false;

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-forest-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-forest-900/10 sm:flex-row ${
        dimmed ? "opacity-65 saturate-50" : ""
      }`}
    >
      {/* Sisi diskon */}
      <div className="relative flex shrink-0 items-center justify-between gap-3 overflow-hidden bg-gradient-to-br from-clay-500 via-clay-500 to-clay-700 px-5 py-4 text-white sm:w-40 sm:flex-col sm:justify-center sm:px-4 sm:py-6 sm:text-center">
        <span aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
        <span aria-hidden className="pointer-events-none absolute -bottom-8 -left-6 h-20 w-20 rounded-full bg-black/10" />
        <div className="relative">
          <span className="block text-[11px] font-semibold uppercase tracking-widest text-white/85">
            {promo.discount_type === "percent" ? "Diskon" : "Potongan"}
          </span>
          <span className="block font-display text-4xl font-bold leading-none sm:mt-1 sm:text-[2.6rem]">
            {discountBadge(promo)}
          </span>
        </div>
        {promo.max_discount && promo.discount_type === "percent" ? (
          <span className="relative rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm sm:mt-3">
            maks. {formatIDR(Number(promo.max_discount))}
          </span>
        ) : null}

        {/* Lekuk sobekan tiket */}
        <span aria-hidden className="absolute -right-2 -top-2 hidden h-4 w-4 rounded-full bg-sand sm:block" />
        <span aria-hidden className="absolute -bottom-2 -right-2 hidden h-4 w-4 rounded-full bg-sand sm:block" />
        <span aria-hidden className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full bg-sand sm:hidden" />
        <span aria-hidden className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full bg-sand sm:hidden" />
      </div>

      {/* Garis putus-putus pemisah */}
      <div
        aria-hidden
        className="mx-5 border-t-2 border-dashed border-forest-100 sm:mx-0 sm:my-5 sm:border-l-2 sm:border-t-0"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-semibold leading-snug text-forest-900">{promo.title}</h3>
            {endingSoon && !dimmed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                <Flame className="h-3 w-3" aria-hidden />
                {left! <= 0 ? "Hari terakhir" : `${left} hari lagi`}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm font-medium text-clay-700">{describeDiscount(promo)}</p>
          {promo.description && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink/65">{promo.description}</p>}
        </div>

        <ul className="space-y-1.5 text-xs text-ink/65">
          <li className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-forest-500" aria-hidden />
            {promo.wisata ? (
              promo.wisata.slug ? (
                <Link href={`/destinations/${promo.wisata.slug}`} className="font-medium text-forest-800 hover:underline">
                  Khusus {promo.wisata.name}
                </Link>
              ) : (
                <>Khusus {promo.wisata.name}</>
              )
            ) : (
              "Berlaku di semua destinasi"
            )}
          </li>
          {Number(promo.min_purchase) > 0 && (
            <li className="flex items-center gap-2">
              <ShoppingBag className="h-3.5 w-3.5 shrink-0 text-forest-500" aria-hidden /> Min. belanja{" "}
              {formatIDR(Number(promo.min_purchase))}
            </li>
          )}
          <li className="flex items-center gap-2">
            <CalendarClock className="h-3.5 w-3.5 shrink-0 text-forest-500" aria-hidden />
            {promo.ends_at ? `Berlaku sampai ${formatPromoDate(promo.ends_at)}` : "Tanpa batas waktu"}
          </li>
        </ul>

        {quotaPct !== null && (
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className={almostGone ? "font-semibold text-red-600" : "text-ink/55"}>
                {remaining! > 0 ? (almostGone ? `Tinggal ${remaining} voucher!` : `Sisa ${remaining} voucher`) : "Kuota habis"}
              </span>
              <span className="text-ink/40">{quotaPct}% terklaim</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-forest-100" role="progressbar" aria-valuenow={quotaPct} aria-valuemin={0} aria-valuemax={100} aria-label="Kuota terklaim">
              <div
                className={`h-full rounded-full transition-all ${almostGone || remaining === 0 ? "bg-red-500" : "bg-clay-500"}`}
                style={{ width: `${quotaPct}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-forest-50 pt-3">
          <CopyCodeButton code={promo.code} />
          {action}
        </div>
      </div>
    </article>
  );
}
