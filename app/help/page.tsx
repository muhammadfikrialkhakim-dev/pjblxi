import type { Metadata } from "next";
import InfoPageShell, { InfoSection } from "@/components/InfoPageShell";
import ContactBlock from "@/components/ContactBlock";
import { getSiteContact } from "@/lib/siteContact";
import { getLocale } from "@/lib/i18n/locale";
import { getPageStrings } from "@/lib/i18n/pages";
import { getLegalContent } from "@/lib/i18n/legal";

export const revalidate = 60;

export function generateMetadata(): Metadata {
  return { title: getPageStrings(getLocale()).meta.help };
}

export default async function HelpPage() {
  const { siteName, email, whatsapp } = await getSiteContact();
  const c = getLegalContent(getLocale()).help;

  return (
    <InfoPageShell title={c.title} intro={c.intro(siteName)}>
      <div className="space-y-3">
        {c.faqs.map((f) => (
          <details key={f.q} className="group card p-4">
            <summary className="cursor-pointer list-none text-sm font-medium text-forest-900 marker:hidden">
              <span className="flex items-center justify-between gap-3">
                {f.q}
                <span className="text-clay-600 transition-transform group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink/75">{f.a}</p>
          </details>
        ))}
      </div>

      <InfoSection title={c.stillNeedHelp}>
        <p>{c.includeCode}</p>
        <ContactBlock email={email} whatsapp={whatsapp} />
      </InfoSection>
    </InfoPageShell>
  );
}
