import { InfoSection } from "@/components/InfoPageShell";
import ContactBlock from "@/components/ContactBlock";
import type { LegalSection } from "@/lib/i18n/legal";

export default function LegalSections({
  sections,
  email,
  whatsapp,
}: {
  sections: LegalSection[];
  email: string | null;
  whatsapp: string | null;
}) {
  return (
    <>
      {sections.map((s) => (
        <InfoSection key={s.title} title={s.title}>
          {s.body.map((b, i) =>
            typeof b === "string" ? (
              <p key={i}>{b}</p>
            ) : (
              <ul key={i} className="list-disc space-y-1 pl-5">
                {b.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )
          )}
          {s.contact && <ContactBlock email={email} whatsapp={whatsapp} />}
        </InfoSection>
      ))}
    </>
  );
}
