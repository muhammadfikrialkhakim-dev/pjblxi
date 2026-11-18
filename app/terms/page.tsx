import type { Metadata } from "next";
import InfoPageShell from "@/components/InfoPageShell";
import LegalSections from "@/components/LegalSections";
import { getSiteContact } from "@/lib/siteContact";
import { getLocale } from "@/lib/i18n/locale";
import { getPageStrings } from "@/lib/i18n/pages";
import { getLegalContent } from "@/lib/i18n/legal";

export const revalidate = 60;

export function generateMetadata(): Metadata {
  return { title: getPageStrings(getLocale()).meta.terms };
}

export default async function TermsPage() {
  const { siteName, email, whatsapp } = await getSiteContact();
  const c = getLegalContent(getLocale()).terms;

  return (
    <InfoPageShell title={c.title} intro={c.intro(siteName)} updatedAt={c.updatedAt}>
      <LegalSections sections={c.sections(siteName)} email={email} whatsapp={whatsapp} />
    </InfoPageShell>
  );
}
