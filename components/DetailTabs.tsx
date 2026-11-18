"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUp, Link2 } from "lucide-react";

export interface DetailTab {
  id: string;
  label: string;
}

/**
 * Bilah tab yang menempel di bawah navbar pada halaman detail destinasi.
 * - Tab menandai bagian yang sedang terlihat (scroll-spy) dan mengantar
 *   ke bagian terkait saat diklik.
 * - Di kanan: Salin tautan, tombol simpan (children = WishlistButton), dan Ke atas.
 */
export default function DetailTabs({
  tabs,
  saveSlot,
  saveLabel,
}: {
  tabs: DetailTab[];
  saveSlot: React.ReactNode;
  saveLabel: string;
}) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Bagian aktif = bagian terakhir yang tepi atasnya sudah melewati garis
      // di bawah navbar + bilah tab (sekitar 140px dari atas layar).
      let current = tabs[0]?.id ?? "";
      for (const t of tabs) {
        const el = document.getElementById(t.id);
        if (el && el.getBoundingClientRect().top <= 160) current = t.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [tabs]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard bisa diblokir browser; abaikan saja.
    }
  }

  return (
    <div className="sticky top-16 z-40 mt-6 border-b border-forest-100 bg-white/95 shadow-sm backdrop-blur">
      <div className="container-page flex items-center justify-between gap-4">
        <nav className="-mb-px -ml-4 flex overflow-x-auto" aria-label="Bagian halaman">
          {tabs.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className={`shrink-0 border-b-[3px] px-4 py-4 text-sm font-semibold transition-colors ${
                active === t.id
                  ? "border-clay-500 text-forest-900"
                  : "border-transparent text-ink/55 hover:text-forest-800"
              }`}
            >
              {t.label}
            </a>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-5 text-sm font-semibold text-clay-600 md:flex">
          <button type="button" onClick={copyLink} className="flex items-center gap-1.5 hover:text-clay-700">
            {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
            {copied ? "Tersalin!" : "Salin tautan"}
          </button>
          <span className="flex items-center gap-1.5">
            {saveSlot} {saveLabel}
          </span>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-1.5 hover:text-clay-700"
          >
            <ChevronsUp className="h-4 w-4" /> Ke atas
          </button>
        </div>
      </div>
    </div>
  );
}
