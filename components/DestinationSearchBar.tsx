import { Search } from "lucide-react";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

export default function DestinationSearchBar({ defaultValue }: { defaultValue?: string }) {
  const t = getDictionary(getLocale()).home;

  return (
    <form
      action="/destinations"
      className="flex w-full max-w-xl overflow-hidden rounded bg-white shadow-lg ring-1 ring-forest-100"
    >
      <div className="flex flex-1 items-center gap-2 px-4">
        <Search className="h-4 w-4 shrink-0 text-ink/40" />
        <input
          type="text"
          name="q"
          defaultValue={defaultValue}
          placeholder={t.searchPlaceholder}
          className="w-full py-3.5 text-sm text-ink outline-none"
        />
      </div>
      <button type="submit" className="bg-clay-500 px-6 text-sm font-medium text-white hover:bg-clay-600">
        {t.searchButton}
      </button>
    </form>
  );
}
