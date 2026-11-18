import { format, isValid, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";

/** "2026-10-19" → "Senin, 19 Oktober 2026". Kalau formatnya tak dikenali, dikembalikan apa adanya. */
export function formatVisitDate(iso: string): string {
  const d = parseISO(iso);
  return isValid(d) ? format(d, "EEEE, d MMMM yyyy", { locale: idLocale }) : iso;
}

/** Waktu pesanan dibuat, selalu dalam WIB supaya tidak bergantung zona waktu server. */
export function formatOrderTime(iso: string): string {
  try {
    return (
      new Intl.DateTimeFormat("id-ID", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Asia/Jakarta",
      }).format(new Date(iso)) + " WIB"
    );
  } catch {
    return iso;
  }
}
