import { getLocale } from "@/lib/i18n/locale";
import { infoPages, type InfoPageKey } from "@/lib/i18n/info-pages";

/** Halaman info publik (tanpa login) — dipakai Bantuan, Syarat, dan Privasi. */
export default function InfoPage({ pageKey }: { pageKey: InfoPageKey }) {
  const page = infoPages[getLocale()][pageKey];
  return (
    <div className="container-page py-12">
      <article className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-semibold text-forest-900 sm:text-4xl">{page.title}</h1>
        <p className="mt-3 text-base leading-relaxed text-forest-800/80">{page.intro}</p>
        <div className="mt-8 space-y-8">
          {page.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="font-display text-xl font-semibold text-forest-900">{s.heading}</h2>
              {s.paragraphs?.map((p) => (
                <p key={p} className="mt-2 text-sm leading-relaxed text-forest-900/80">
                  {p}
                </p>
              ))}
              {s.bullets && (
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-forest-900/80">
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
