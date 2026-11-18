import Link from "next/link";
import { Search, X } from "lucide-react";
import { tableHref, type TableParams } from "@/lib/table-query";

/** Kotak cari (form GET) — mempertahankan urutan & jumlah per halaman, kembali ke halaman 1. */
export default function TableSearch({
  basePath,
  params,
  placeholder = "Cari…",
  hidden,
}: {
  basePath: string;
  params: TableParams;
  placeholder?: string;
  /** Parameter URL tambahan yang harus ikut terkirim saat mencari (mis. wisata). */
  hidden?: Record<string, string>;
}) {
  return (
    <form action={basePath.split("?")[0]} method="get" role="search" className="flex w-full max-w-md items-center gap-2">
      <input type="hidden" name="sort" value={params.sort} />
      <input type="hidden" name="dir" value={params.dir} />
      <input type="hidden" name="per" value={params.per} />
      {params.filter && <input type="hidden" name="filter" value={params.filter} />}
      {Object.entries(hidden ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden />
        <input
          name="q"
          defaultValue={params.q}
          placeholder={placeholder}
          aria-label={placeholder}
          className="input-field !pl-9"
          autoComplete="off"
        />
      </div>
      <button type="submit" className="btn-primary px-4 py-2.5">
        Cari
      </button>
      {params.q && (
        <Link
          href={tableHref(basePath, params, { q: "", page: 1 })}
          className="inline-flex items-center gap-1 rounded px-2 py-2 text-sm text-ink/60 hover:text-clay-600"
        >
          <X className="h-4 w-4" aria-hidden /> Reset
        </Link>
      )}
    </form>
  );
}
