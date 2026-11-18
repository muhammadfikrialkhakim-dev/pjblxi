import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, Locale } from "./dictionary";

/**
 * Membaca bahasa aktif dari cookie (di-set oleh <LanguageSwitcher />).
 * Dipakai di Server Component mana pun yang butuh menampilkan teks
 * terjemahan, tanpa perlu prop-drilling atau React Context (yang tidak
 * bisa dipakai di Server Component).
 */
export function getLocale(): Locale {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  return value === "en" ? "en" : DEFAULT_LOCALE;
}
