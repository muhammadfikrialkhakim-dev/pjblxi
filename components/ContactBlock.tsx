import { getLocale } from "@/lib/i18n/locale";
import { getPageStrings } from "@/lib/i18n/pages";

export default function ContactBlock({ email, whatsapp }: { email: string | null; whatsapp: string | null }) {
  const t = getPageStrings(getLocale()).info;

  if (!email && !whatsapp) {
    return <p>{t.contactNone}</p>;
  }
  return (
    <ul className="space-y-1">
      {email && (
        <li>
          {t.email}:{" "}
          <a href={`mailto:${email}`} className="text-forest-700 hover:underline">{email}</a>
        </li>
      )}
      {whatsapp && (
        <li>
          {t.whatsapp}:{" "}
          <a
            href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-forest-700 hover:underline"
          >
            {whatsapp}
          </a>
        </li>
      )}
    </ul>
  );
}
