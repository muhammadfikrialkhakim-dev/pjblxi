/**
 * Pembantu pencarian + pengurutan + paginasi tabel admin yang berbasis URL
 * (?q=…&sort=…&dir=…&page=…&per=…). Dipakai bersama komponen TableSearch,
 * SortableTh, dan Pagination — semuanya server component, tanpa JS di browser.
 */

export type TableParams = {
  q: string;
  sort: string;
  dir: "asc" | "desc";
  page: number;
  per: number;
  /** Nilai filter terpilih; "" = semua. */
  filter: string;
};

export type RawParams = { q?: string; sort?: string; dir?: string; page?: string; per?: string; filter?: string };

export const PER_PAGE_OPTIONS = [10, 25, 50] as const;

export function parseTableParams(
  raw: RawParams,
  opts: { sortKeys: readonly string[]; defaultSort: string; defaultDir?: "asc" | "desc"; filterKeys?: readonly string[] }
): TableParams {
  const per = Number(raw.per);
  const page = Math.floor(Number(raw.page));
  return {
    q: (raw.q ?? "").trim().slice(0, 100),
    sort: opts.sortKeys.includes(raw.sort ?? "") ? (raw.sort as string) : opts.defaultSort,
    dir: raw.dir === "asc" || raw.dir === "desc" ? raw.dir : (opts.defaultDir ?? "asc"),
    page: Number.isFinite(page) && page > 0 ? page : 1,
    per: (PER_PAGE_OPTIONS as readonly number[]).includes(per) ? per : PER_PAGE_OPTIONS[0],
    filter: (opts.filterKeys ?? []).includes(raw.filter ?? "") ? (raw.filter as string) : "",
  };
}

/** Bangun URL dengan parameter saat ini + perubahan (nilai kosong dibuang). */
export function tableHref(basePath: string, p: TableParams, change: Partial<Record<keyof TableParams, string | number>> = {}) {
  const next: Record<string, string> = {
    q: p.q,
    sort: p.sort,
    dir: p.dir,
    page: String(p.page),
    per: String(p.per),
    filter: p.filter,
  };
  for (const [k, v] of Object.entries(change)) next[k] = String(v);
  // basePath boleh sudah membawa query (mis. "/admin/tiket?wisata=…"); parameternya dipertahankan.
  const [path, existing = ""] = basePath.split("?");
  const qs = new URLSearchParams(existing);
  for (const [k, v] of Object.entries(next)) {
    if (v !== "" && !(k === "page" && v === "1")) qs.set(k, v);
    else qs.delete(k);
  }
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

/** Potong data ke halaman yang diminta; halaman otomatis dibatasi ke rentang valid. */
export function paginate<T>(rows: T[], p: TableParams) {
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / p.per));
  const page = Math.min(p.page, pages);
  const offset = (page - 1) * p.per;
  return { rows: rows.slice(offset, offset + p.per), total, pages, page, offset };
}
