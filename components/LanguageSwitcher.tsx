"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { LOCALE_COOKIE, LOCALES, Locale } from "@/lib/i18n/dictionary";
import FlagIcon from "@/components/FlagIcon";

export default function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LOCALES.find((l) => l.code === currentLocale) ?? LOCALES[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function changeLocale(code: Locale) {
    // Cookie berlaku 1 tahun & bisa dibaca Server Component lewat next/headers.
    document.cookie = `${LOCALE_COOKIE}=${code}; path=/; max-age=31536000; SameSite=Lax`;
    setOpen(false);
    router.refresh();
  }

  return (
    <div ref={ref} className="relative z-[70]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded border border-forest-200 px-2.5 py-1.5 text-sm font-medium text-forest-800 hover:bg-forest-50 group-data-[transparent=true]:border-white/50 group-data-[transparent=true]:text-white group-data-[transparent=true]:hover:bg-white/15"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
      >
        <FlagIcon locale={current.code} />
        <span className="hidden sm:inline">{current.code.toUpperCase()}</span>
        <ChevronDown className="h-3.5 w-3.5 text-ink/50 group-data-[transparent=true]:text-white/80" />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-[70] mt-1.5 w-40 overflow-hidden rounded border border-forest-100 bg-white py-1 shadow-lg"
        >
          {LOCALES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                onClick={() => changeLocale(l.code)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-forest-50 ${
                  l.code === currentLocale ? "font-semibold text-forest-900" : "text-ink/80"
                }`}
                role="option"
                aria-selected={l.code === currentLocale}
              >
                <FlagIcon locale={l.code} />
                {l.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
