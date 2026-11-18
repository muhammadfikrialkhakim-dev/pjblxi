import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PER_PAGE_OPTIONS, tableHref, type TableParams } from "@/lib/table-query";

/** Nomor halaman dengan elipsis: 1 … 4 5 [6] 7 8 … 20 */
function pageList(current: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set([1, pages, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((n) => set.add(n));
  if (current >= pages - 2) [pages - 1, pages - 2, pages - 3].forEach((n) => set.add(n));
  const nums = Array.from(set).filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

export default function Pagination({
  basePath,
  params,
  total,
  pages,
  page,
  offset,
  shown,
}: {
  basePath: string;
  params: TableParams;
  total: number;
  pages: number;
  page: number;
  offset: number;
  shown: number;
}) {
  const cell = "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors";
  const href = (n: number) => tableHref(basePath, params, { page: n });

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-forest-100 px-4 py-3 text-sm sm:flex-row">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-ink/60">
        <p>
          {total === 0 ? "Tidak ada data" : `Menampilkan ${offset + 1}–${offset + shown} dari ${total}`}
        </p>
        <p className="flex items-center gap-1.5">
          <span>Per halaman:</span>
          {PER_PAGE_OPTIONS.map((n) => (
            <Link
              key={n}
              href={tableHref(basePath, params, { per: n, page: 1 })}
              className={`rounded px-2 py-0.5 ${n === params.per ? "bg-forest-100 font-semibold text-forest-900" : "hover:bg-forest-50"}`}
            >
              {n}
            </Link>
          ))}
        </p>
      </div>

      {pages > 1 && (
        <nav aria-label="Halaman" className="flex items-center gap-1">
          {page > 1 ? (
            <Link href={href(page - 1)} className={`${cell} text-forest-800 hover:bg-forest-50`} aria-label="Sebelumnya">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          ) : (
            <span className={`${cell} cursor-not-allowed text-ink/25`} aria-hidden>
              <ChevronLeft className="h-4 w-4" />
            </span>
          )}
          {pageList(page, pages).map((n, i) =>
            n === "…" ? (
              <span key={`e${i}`} className="px-1 text-ink/40">
                …
              </span>
            ) : n === page ? (
              <span key={n} aria-current="page" className={`${cell} bg-clay-500 text-white shadow-sm`}>
                {n}
              </span>
            ) : (
              <Link key={n} href={href(n)} className={`${cell} text-forest-800 hover:bg-forest-50`}>
                {n}
              </Link>
            )
          )}
          {page < pages ? (
            <Link href={href(page + 1)} className={`${cell} text-forest-800 hover:bg-forest-50`} aria-label="Berikutnya">
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className={`${cell} cursor-not-allowed text-ink/25`} aria-hidden>
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
