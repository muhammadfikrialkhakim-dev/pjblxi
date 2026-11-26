import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Pencil, Trash2, Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import TableSearch from "@/components/TableSearch";
import SortableTh from "@/components/SortableTh";
import Pagination from "@/components/Pagination";
import TableFilter from "@/components/TableFilter";
import TableSelect from "@/components/TableSelect";
import { paginate, parseTableParams, tableHref, type RawParams } from "@/lib/table-query";
import { deleteWisata } from "./actions";

// Semua kondisi tabel (cari, filter, urutan, halaman) disimpan di URL, jadi
// bisa di-bookmark/dibagikan dan tombol Back browser tetap bekerja. Logikanya
// memakai pembantu bersama (lib/table-query + komponen Table*), sama seperti
// halaman Kelola Tiket / Kategori / Promo.
const SORT_KEYS = ["created", "name", "location", "category", "tiket", "status"] as const;
const FILTER_KEYS = ["published", "draft", "archived"] as const;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

function sortValue(r: Row, key: (typeof SORT_KEYS)[number]): string | number {
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

export default async function AdminSpotsPage({
  searchParams,
}: {
  searchParams: RawParams & { kategori?: string };
}) {
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

  const params = parseTableParams(searchParams, {
    sortKeys: SORT_KEYS,
    defaultSort: "created",
    defaultDir: "desc",
    filterKeys: FILTER_KEYS,
  });
  const kategori = UUID_RE.test(searchParams.kategori ?? "") ? (searchParams.kategori as string) : "";
  // Kategori terpilih dibawa terus lewat basePath saat cari/urut/pindah halaman.
  const baseFor = (kat: string) => (kat ? `/admin/spots?kategori=${kat}` : "/admin/spots");
  const BASE = baseFor(kategori);

  // Cari & kategori dikerjakan database; filter status & urutan di bawah
  // (supaya jumlah per status bisa ditampilkan di pil filter).
  let query = supabase
    .from("wisata")
    .select("id, name, location, status, created_at, category:categories(name), tiket(id)")
    .order("created_at", { ascending: false });

  // Karakter khusus filter PostgREST dibuang supaya input tidak bisa
  // menyisipkan kondisi tambahan ke dalam .or().
  const safeQ = params.q.replace(/[%,()*\\]/g, " ").replace(/\s+/g, " ").trim();
  if (safeQ) query = query.or(`name.ilike.%${safeQ}%,location.ilike.%${safeQ}%`);
  if (kategori) query = query.eq("category_id", kategori);

  const [{ data: rawRows }, { data: categories }] = await Promise.all([
    query,
    supabase.from("categories").select("id, name").order("name"),
  ]);

  const searched = (rawRows ?? []) as unknown as Row[];
  const countOf = (s: string) => searched.filter((r) => r.status === s).length;
  const filtered = searched.filter((r) => (params.filter ? r.status === params.filter : true));

  // Diurutkan di sini (bukan di database) karena "Paket Tiket" adalah hasil
  // hitungan relasi. Jumlah wisata kecil, jadi ini murah.
  const dirMul = params.dir === "asc" ? 1 : -1;
  const sortKey = params.sort as (typeof SORT_KEYS)[number];
  filtered.sort((a, b) => {
    const va = sortValue(a, sortKey);
    const vb = sortValue(b, sortKey);
    let cmp: number;
    if (typeof va === "number" && typeof vb === "number") cmp = va - vb;
    else {
      // Nilai kosong selalu di paling bawah, apa pun arah urutannya.
      if (va === "" && vb !== "") return 1;
      if (vb === "" && va !== "") return -1;
      cmp = collator.compare(String(va), String(vb));
    }
    if (cmp === 0) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return cmp * dirMul;
  });

  const { rows, total, pages, page, offset } = paginate(filtered, params);
  const filtering = Boolean(params.q || params.filter || kategori);

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

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
        <TableSearch
          basePath={BASE}
          params={params}
          placeholder="Cari nama atau lokasi wisata…"
          hidden={kategori ? { kategori } : undefined}
        />
        <TableFilter
          basePath={BASE}
          params={params}
          label="Status"
          options={[
            { value: "", label: "Semua", count: searched.length },
            { value: "published", label: "Published", count: countOf("published") },
            { value: "draft", label: "Draft", count: countOf("draft") },
            { value: "archived", label: "Archived", count: countOf("archived") },
          ]}
        />
        {/* Filter kategori: dropdown, mempertahankan cari/status/urutan. */}
        {!!categories?.length && (
          <TableSelect
            label="Kategori"
            value={kategori}
            options={[{ id: "", name: "Semua" }, ...categories].map((c) => ({
              value: c.id,
              label: c.name,
              href: tableHref(baseFor(c.id), params, { page: 1 }),
            }))}
          />
        )}
      </div>

      <div className="card mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-forest-50 text-ink/60">
              <tr>
                <th className="w-14 px-4 py-3 font-medium">No.</th>
                <SortableTh basePath={BASE} params={params} sortKey="name">Nama</SortableTh>
                <SortableTh basePath={BASE} params={params} sortKey="location">Lokasi</SortableTh>
                <SortableTh basePath={BASE} params={params} sortKey="category">Kategori</SortableTh>
                <SortableTh basePath={BASE} params={params} sortKey="tiket">Paket Tiket</SortableTh>
                <SortableTh basePath={BASE} params={params} sortKey="status">Status</SortableTh>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w, i) => (
                <tr key={w.id} className="border-t border-forest-50">
                  <td className="px-4 py-3 tabular-nums text-ink/50">{offset + i + 1}</td>
                  <td className="px-4 py-3 font-medium text-forest-900">{w.name}</td>
                  <td className="px-4 py-3 text-ink/70">{w.location || "-"}</td>
                  <td className="px-4 py-3 text-ink/70">{w.category?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-ink/70">{w.tiket?.length ?? 0} paket</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ${
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
              {!rows.length && (
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
        <Pagination basePath={BASE} params={params} total={total} pages={pages} page={page} offset={offset} shown={rows.length} />
      </div>
    </div>
  );
}
