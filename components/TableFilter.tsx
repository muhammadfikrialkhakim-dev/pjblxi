import Link from "next/link";
import { tableHref, type TableParams } from "@/lib/table-query";

export type FilterOption = { value: string; label: string; count?: number };

/**
 * Filter berbentuk "pil" (Semua / Aktif / …). value "" = tanpa filter.
 * Memilih filter mengembalikan tabel ke halaman 1 dan mempertahankan
 * pencarian & urutan.
 */
export default function TableFilter({
  basePath,
  params,
  label,
  options,
}: {
  basePath: string;
  params: TableParams;
  label: string;
  options: FilterOption[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <span className="text-sm text-ink/60">{label}:</span>
      {options.map((o) => {
        const active = params.filter === o.value;
        return (
          <Link
            key={o.value || "all"}
            href={tableHref(basePath, params, { filter: o.value, page: 1 })}
            aria-current={active ? "true" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "border-forest-700 bg-forest-800 text-white"
                : "border-forest-200 bg-white text-forest-800 hover:border-forest-400 hover:bg-forest-50"
            }`}
          >
            {o.label}
            {o.count !== undefined && (
              <span
                className={`rounded-full px-1.5 text-xs tabular-nums ${active ? "bg-white/20 text-white" : "bg-forest-100 text-forest-700"}`}
              >
                {o.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
