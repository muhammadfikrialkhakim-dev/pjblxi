import { Locale } from "@/lib/i18n/dictionary";

/**
 * Ikon bendera bulat, digambar pakai SVG murni (bukan emoji Unicode
 * 🇮🇩/🇬🇧) — emoji bendera sering tidak tampil sebagai gambar di
 * Windows + Chrome (cuma muncul teks kode negara). SVG dibungkus
 * lingkaran (rounded-full + overflow-hidden) supaya bentuknya bulat.
 */
export default function FlagIcon({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-black/10 ${
        className ?? "h-5 w-5"
      }`}
    >
      <svg viewBox="0 0 60 60" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
        {locale === "en" ? (
          <>
            <rect width="60" height="60" fill="#012169" />
            <path d="M0,0 L60,60 M60,0 L0,60" stroke="#fff" strokeWidth="10" />
            <path d="M0,0 L60,60 M60,0 L0,60" stroke="#C8102E" strokeWidth="4" />
            <path d="M30,0 V60 M0,30 H60" stroke="#fff" strokeWidth="16" />
            <path d="M30,0 V60 M0,30 H60" stroke="#C8102E" strokeWidth="9" />
          </>
        ) : (
          <>
            <rect width="60" height="30" fill="#CE1126" />
            <rect y="30" width="60" height="30" fill="#ffffff" />
          </>
        )}
      </svg>
    </span>
  );
}
