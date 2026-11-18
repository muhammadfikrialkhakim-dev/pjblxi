import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Ticket,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { deleteWisata } from "./actions";

// ─── Parameter URL ──────────────────────────────────────────────────────
// Semua kondisi tabel (cari, filter, urutan, halaman) disimpan di URL, jadi
// bisa di-bookmark/dibagikan dan tombol Back browser tetap bekerja.
const SORT_KEYS = ["created", "name", "location", "category", "tiket", "status"] as const;
type SortKey = (typeof SORT_KEYS)[number];
type Dir = "asc" | "desc";
const PAGE_SIZES = [10, 25, 50] as const;
const STATUSES = ["published", "draft", "archived"] as const;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SearchParams = {
  q?: string;
  status?: string;
  kategori?: string;
  sort?: string;
  dir?: string;
  per?: string;
  page?: string;
};

type Row = {
  id: string;
  name: string;
  location: string | null;
  status: string;
  created_at: string;
  category: { name: string } | null;
  tiket: { id: string }[] | null;
};

const collator = new Intl.Collator("id", { sensitivity: "base", numeric: true });

function sortValue(r: Row, key: SortKey): string | number {
  switch (key) {
    case "name":
      return r.name ?? "";
    case "location":
      return r.location ?? "";
    case "category":
      return r.category?.name ?? "";
    case "status":
      return r.status;
    case "tiket":
      return r.tiket?.length ?? 0;
    default:
      return new Date(r.created_at).getTime();
  }
}

/** Daftar nomor halaman dengan elipsis, mis. 1 … 4 5 6 … 12 */
function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

export default async function AdminSpotsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  const isSuperAdmin = profile?.role === "super_admin";

  // Admin Wisata cuma menangani SATU wisata yang ditugaskan padanya (mis.
  // admin Jatim Park cuma pegang Jatim Park) — jadi jangan tampilkan daftar
  // seperti admin biasa/super admin, langsung lempar ke halaman edit wisata
  // miliknya sendiri. RLS ("Wisata: public read published" + is_wisata_owner)
  // memastikan query di bawah cuma pernah mengembalikan wisata itu saja.
  if (profile?.role === "admin_wisata") {
    const { data: ownWisata } = await supabase.from("wisata").select("id").eq("admin_id", user?.id).maybeSingle();
    redirect(ownWisata ? `/admin/spots/${ownWisata.id}` : "/admin/spots/unassigned");
  }

  // ─── Baca & validasi parameter ────────────────────────────────────────
  const q = (searchParams.q ?? "").trim().slice(0, 100);
  const status = (STATUSES as readonly string[]).includes(searchParams.status ?? "") ? (searchParams.status as string) : "";
  const kategori = UUID_RE.test(searchParams.kategori ?? "") ? (searchParams.kategori as string) : "";
  const sort: SortKey = (SORT_KEYS as readonly string[]).includes(searchParams.sort ?? "")
    ? (searchParams.sort as SortKey)
    : "created";
  const dir: Dir = searchParams.dir === "asc" || searchParams.dir === "desc" ? searchParams.dir : sort === "created" ? "desc" : "asc";
  const per = (PAGE_SIZES as readonly number[]).includes(Number(searchParams.per)) ? Number(searchParams.per) : PAGE_SIZES[0];

  // ─── Ambil data (cari & filter dikerjakan database) ───────────────────
  let query = supabase
    .from("wisata")
    .select("id, name, location, status, created_at, category:categories(name), tiket(id)")
    .order("created_at", { ascending: false });

  // Karakter khusus filter PostgREST dibuang supaya input tidak bisa
  // menyisipkan kondisi tambahan ke dalam .or().
  const safeQ = q.replace(/[%,()*\\]/g, " ").replace(/\s+/g, " ").trim();
  if (safeQ) query = query.or(`name.ilike.%${safeQ}%,location.ilike.%${safeQ}%`);
  if (status) query = query.eq("status", status);
  if (kategori) query = query.eq("category_id", kategori);

  const [{ data: rawRows }, { data: categories }] = await Promise.all([
    query,
    supabase.from("categories").select("id, name").order("name"),
  ]);

  // ─── Urutkan & potong halaman ─────────────────────────────────────────
  // Diurutkan di sini (bukan di database) karena "Jumlah Paket Tiket" adalah
  // hasil hitungan relasi. Jumlah wisata kecil, jadi ini murah.
  const rows = [...((rawRows ?? []) as unknown as Row[])]
    .sort((a, b) => {
    const va = sortValue(a, sort);
    const vb = sortValue(b, sort);
    let cmp: number;
    if (typeof va === "number" && typeof vb === "number") cmp = va - vb;
    else {
      // Nilai kosong selalu di paling bawah, apa pun arah urutannya.
      if (va === "" && vb !== "") return 1;
      if (vb === "" && va !== "") return -1;
      cmp = collator.compare(String(va), String(vb));
    }
    if (cmp === 0) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return dir === "asc" ? cmp : -cmp;
  });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / per));
  const page = Math.min(Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1), totalPages);
  const offset = (page - 1) * per;
  const visible = rows.slice(offset, offset + per);

  // ─── Pembuat link: pertahankan parameter lain, buang yang bernilai bawaan ──
  function href(overrides: Partial<Record<keyof SearchParams, string | number>>) {
    const next: Record<string, string> = {
      q,
      status,
      kategori,
      sort: sort === "created" && dir === "desc" ? "" : sort,
      dir: sort === "created" && dir === "desc" ? "" : dir,
      per: per === PAGE_SIZES[0] ? "" : String(per),
      page: page === 1 ? "" : String(page),
    };
    for (const [k, v] of Object.entries(overrides)) next[k] = String(v ?? "");
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) qs.set(k, v);
    const s = qs.toString();
    return s ? `/admin/spots?${s}` : "/admin/spots";
  }

  function sortHref(key: SortKey) {
    const nextDir: Dir = sort === key ? (dir === "asc" ? "desc" : "asc") : key === "created" ? "desc" : "asc";
    return href({ sort: key, dir: nextDir, page: 1 });
  }

  function SortHeader({ label, k, className = "" }: { label: string; k: SortKey; className?: string }) {
    const active = sort === k;
    const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
    return (
      <th
        className={`px-4 py-3 font-medium ${className}`}
        aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      >
        <Link
          href={sortHref(k)}
          className={`inline-flex items-center gap-1.5 hover:text-forest-800 ${active ? "text-forest-800" : ""}`}
        >
          {label}
          <Icon className={`h-3.5 w-3.5 ${active ? "" : "opacity-40"}`} aria-hidden />
        </Link>
      </th>
    );
  }

  const filtering = Boolean(q || status || kategori);
  const firstShown = total ? offset + 1 : 0;
  const lastShown = offset + visible.length;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-forest-900">Kelola Wisata</h1>
        {isSuperAdmin && (
          <Link href="/admin/spots/new" className="btn-primary">
            <Plus className="h-4 w-4" /> Tambah Wisata
          </Link>
        )}
      </div>
      <p className="mt-1 text-sm text-ink/60">
        Data tempat wisata. Harga & paket tiket diatur terpisah di menu <strong>Kelola Tiket</strong>.
      </p>

      {/* 1 · Pencarian  2 · Filter */}
      <form action="/admin/spots" method="get" className="mt-6 flex flex-wrap items-end gap-3" role="search">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="q" className="sr-only">
            Cari wisata
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden />
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Cari nama atau lokasi wisata…"
              className="input-field !pl-10"
              maxLength={100}
            />
          </div>
        </div>
        <div>
          <label htmlFor="kategori" className="sr-only">
            Kategori
          </label>
          <select id="kategori" name="kategori" defaultValue={kategori} className="input-field">
            <option value="">Semua kategori</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="sr-only">
            Status
          </label>
          <select id="status" name="status" defaultValue={status} className="input-field">
            <option value="">Semua status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        {/* Urutan & ukuran halaman ikut terbawa saat mencari/memfilter. */}
        {sort !== "created" || dir !== "desc" ? (
          <>
            <input type="hidden" name="sort" value={sort} />
            <input type="hidden" name="dir" value={dir} />
          </>
        ) : null}
        {per !== PAGE_SIZES[0] && <input type="hidden" name="per" value={per} />}
        <button type="submit" className="btn-primary">
          Terapkan
        </button>
        {filtering && (
          <Link href={href({ q: "", status: "", kategori: "", page: 1 })} className="btn-secondary">
            Reset
          </Link>
        )}
      </form>

      <div className="card mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-forest-50 text-ink/60">
              <tr>
                {/* 5 · Penomoran baris */}
                <th className="w-14 px-4 py-3 font-medium">No.</th>
                {/* 3 · Pengurutan */}
                <SortHeader label="Nama" k="name" />
                <SortHeader label="Lokasi" k="location" />
                <SortHeader label="Kategori" k="category" />
                <SortHeader label="Paket Tiket" k="tiket" />
                <SortHeader label="Status" k="status" />
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((w, i) => (
                <tr key={w.id} className="border-t border-forest-50">
                  <td className="px-4 py-3 tabular-nums text-ink/50">{offset + i + 1}</td>
                  <td className="px-4 py-3 font-medium text-forest-900">{w.name}</td>
                  <td className="px-4 py-3 text-ink/70">{w.location || "-"}</td>
                  <td className="px-4 py-3 text-ink/70">{w.category?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-ink/70">{w.tiket?.length ?? 0} paket</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        w.status === "published" ? "bg-forest-100 text-forest-800" : "bg-ink/10 text-ink/60"
                      }`}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/tiket?wisata=${w.id}`} className="rounded p-1.5 text-forest-700 hover:bg-forest-50" title="Kelola tiket">
                        <Ticket className="h-4 w-4" />
                      </Link>
                      <Link href={`/admin/spots/${w.id}`} className="rounded p-1.5 text-forest-700 hover:bg-forest-50" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      {isSuperAdmin && (
                        <form action={deleteWisata.bind(null, w.id)}>
                          <ConfirmSubmitButton
                            dialogTitle="Hapus wisata ini?"
                            message={`Wisata “${w.name}” akan dihapus permanen beserta paket tiket dan gambarnya. Tindakan ini tidak bisa dibatalkan.`}
                            confirmText="Ya, hapus"
                            className="rounded p-1.5 text-red-600 hover:bg-red-50"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </ConfirmSubmitButton>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!visible.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-ink/50">
                    {filtering ? (
                      <>
                        Tidak ada wisata yang cocok dengan pencarian atau filter Anda.{" "}
                        <Link href="/admin/spots" className="font-semibold text-forest-700 hover:underline">
                          Reset
                        </Link>
                      </>
                    ) : (
                      "Belum ada data wisata."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4 · Penomoran halaman */}
        {total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-forest-50 px-4 py-3 text-sm text-ink/60">
            <p>
              Menampilkan <strong className="text-ink">{firstShown}–{lastShown}</strong> dari{" "}
              <strong className="text-ink">{total}</strong> wisata
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span>Per halaman</span>
                {PAGE_SIZES.map((n) => (
                  <Link
                    key={n}
                    href={href({ per: n === PAGE_SIZES[0] ? "" : n, page: 1 })}
                    aria-current={n === per ? "true" : undefined}
                    className={`rounded px-2 py-1 font-medium ${
                      n === per ? "bg-forest-600 text-white" : "text-forest-800 hover:bg-forest-50"
                    }`}
                  >
                    {n}
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <nav aria-label="Halaman" className="flex items-center gap-1">
                  {page > 1 ? (
                    <Link href={href({ page: page - 1 })} className="rounded p-1.5 text-forest-800 hover:bg-forest-50" aria-label="Halaman sebelumnya">
                      <ChevronLeft className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="rounded p-1.5 text-ink/25" aria-hidden>
                      <ChevronLeft className="h-4 w-4" />
                    </span>
                  )}

                  {pageList(page, totalPages).map((p, i) =>
                    p === "…" ? (
                      <span key={`gap-${i}`} className="px-1 text-ink/40">
                        …
                      </span>
                    ) : (
                      <Link
                        key={p}
                        href={href({ page: p })}
                        aria-current={p === page ? "page" : undefined}
                        className={`min-w-[2rem] rounded px-2 py-1 text-center font-medium tabular-nums ${
                          p === page ? "bg-forest-600 text-white" : "text-forest-800 hover:bg-forest-50"
                        }`}
                      >
                        {p}
                      </Link>
                    )
                  )}

                  {page < totalPages ? (
                    <Link href={href({ page: page + 1 })} className="rounded p-1.5 text-forest-800 hover:bg-forest-50" aria-label="Halaman berikutnya">
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="rounded p-1.5 text-ink/25" aria-hidden>
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </nav>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
