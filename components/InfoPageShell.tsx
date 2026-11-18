import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getLocale } from "@/lib/i18n/locale";
import { getPageStrings } from "@/lib/i18n/pages";

/** Kerangka halaman informasi statis (Pusat Bantuan, Syarat & Ketentuan, Kebijakan Privasi). */
export default function InfoPageShell({
  title,
  intro,
  updatedAt,
  children,
}: {
  title: string;
  intro?: string;
  updatedAt?: string;
  children: React.ReactNode;
}) {
  const t = getPageStrings(getLocale());

  return (
    <div className="container-page py-10">
      <nav className="flex items-center gap-1.5 text-xs text-ink/50">
        <Link href="/" className="hover:text-forest-700">{t.common.home}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-ink/70">{title}</span>
      </nav>

      <div className="mx-auto mt-6 max-w-3xl">
        <h1 className="font-display text-3xl font-semibold text-forest-900">{title}</h1>
        {intro && <p className="mt-3 text-sm leading-relaxed text-ink/70">{intro}</p>}
        {updatedAt && <p className="mt-2 text-xs text-ink/40">{t.info.lastUpdated}: {updatedAt}</p>}
        <div className="mt-8 space-y-8">{children}</div>
      </div>
    </div>
  );
}

export function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-forest-900">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-ink/80">{children}</div>
    </section>
  );
}
