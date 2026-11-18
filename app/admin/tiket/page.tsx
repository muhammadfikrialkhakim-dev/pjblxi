import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Tiket, formatIDR } from "@/lib/types";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { deleteTiket } from "./actions";
import TableSearch from "@/components/TableSearch";
import SortableTh from "@/components/SortableTh";
import Pagination from "@/components/Pagination";
import TableFilter from "@/components/TableFilter";
import { paginate, parseTableParams, type RawParams } from "@/lib/table-query";

const SORT_KEYS = ["name", "wisata", "price", "quota", "status", "date"] as const;
const FILTER_KEYS = ["aktif", "nonaktif", "habis"] as const;

export default async function AdminTiketPage({
  searchParams,
}: {
  searchParams: RawParams & { wisata?: string; error?: string; notice?: string };
}) {
  const params = parseTableParams(searchParams, {
    sortKeys: SORT_KEYS,
    defaultSort: "date",
    defaultDir: "desc",
    filterKeys: FILTER_KEYS,
  });
  // Filter wisata (dari halaman Kelola Wisata) dibawa terus saat cari/urut/pindah halaman.
  const BASE = searchParams.wisata ? `/admin/tiket?wisata=${encodeURIComponent(searchParams.wisata)}` : "/admin/tiket";
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  const isWisataAdmin = profile?.role === "admin_wisata";

  // PENTING: kolom SELECT tiket punya policy publik "is_active = true" yang
  // otomatis meng-OR dengan policy kepemilikan admin_wisata — artinya query
  // tanpa filter di sini akan ikut menampilkan paket tiket AKTIF milik
  // wisata orang lain juga (RLS tidak benar-benar membatasinya, walau
  // komentar lama di halaman ini bilang begitu). Jadi untuk admin_wisata,
  // paksa filter ke wisata miliknya sendiri di query, jangan andalkan RLS.
  let ownWisataId: string | null = null;
  if (isWisataAdmin) {
    const { data: ownWisata } = await supabase.from("wisata").select("id").eq("admin_id", user?.id).maybeSingle();
    ownWisataId = ownWisata?.id ?? null;
  }

  let query = supabase.from("tiket").select("*, wisata(name)");
  if (isWisataAdmin) {
    query = query.eq("wisata_id", ownWisataId ?? "00000000-0000-0000-0000-000000000000");
  } else if (searchParams.wisata) {
    query = query.eq("wisata_id", searchParams.wisata);
  }
  const { data } = await query;
  const all = (data ?? []) as (Tiket & { wisata: { name: string } })[];

  // Sisa kuota HARI INI per paket (dihitung di database dari pesanan yang
  // sudah dibayar / sedang menahan kursi), ditampilkan di samping kuota/hari.
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }); // YYYY-MM-DD
  const remainingToday = new Map<string, number>();
  await Promise.all(
    all.map(async (t) => {
      const { data } = await supabase.rpc("tiket_remaining", { p_tiket: t.id, p_date: today });
      if (typeof data === "number") remainingToday.set(t.id, data);
    })
  );

  // Cari (paket / wisata) → filter (aktif / nonaktif / kuota habis hari ini) → urutkan → potong per halaman.
  const needle = params.q.toLowerCase();
  const searched = needle
    ? all.filter((t) => t.name.toLowerCase().includes(needle) || (t.wisata?.name ?? "").toLowerCase().includes(needle))
    : all;
  const isHabis = (t: Tiket) => t.is_active && remainingToday.get(t.id) === 0;
  const countAktif = searched.filter((t) => t.is_active).length;
  const countHabis = searched.filter(isHabis).length;
  const filtered = searched.filter((t) =>
    params.filter === "aktif" ? t.is_active
    : params.filter === "nonaktif" ? !t.is_active
    : params.filter === "habis" ? isHabis(t)
    : true
  );
  const dirMul = params.dir === "asc" ? 1 : -1;
  const collator = new Intl.Collator("id", { sensitivity: "base" });
  filtered.sort((a, b) => {
    let cmp = 0;
    switch (params.sort) {
      case "name": cmp = collator.compare(a.name, b.name); break;
      case "wisata": cmp = collator.compare(a.wisata?.name ?? "", b.wisata?.name ?? ""); break;
      case "price": cmp = Number(a.price) - Number(b.price); break;
      case "quota": cmp = a.quota_per_day - b.quota_per_day; break;
      case "status": cmp = Number(a.is_active) - Number(b.is_active); break;
      default: cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return (cmp || collator.compare(a.name, b.name)) * dirMul;
  });
  const { rows, total, pages, page, offset } = paginate(filtered, params);

  const newHref = isWisataAdmin
    ? `/admin/tiket/new?wisata=${ownWisataId ?? ""}`
    : searchParams.wisata
      ? `/admin/tiket/new?wisata=${searchParams.wisata}`
      : "/admin/tiket/new";

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-forest-900">Kelola Tiket</h1>
        {/* Super Admin & Admin Wisata sama-sama boleh menambah paket tiket
            baru. Untuk Admin Wisata otomatis diarahkan ke wisata miliknya
            sendiri; untuk Super Admin, wisata dipilih lewat dropdown di
            halaman Tambah Paket Tiket. */}
        <Link href={newHref} className="btn-primary">
          <Plus className="h-4 w-4" /> Tambah Paket Tiket
        </Link>
      </div>
      {searchParams.notice && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {searchParams.notice}
        </p>
      )}
      {searchParams.error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}
      {/* Admin Wisata cuma pegang 1 wisata (RLS sudah otomatis membatasi
          hasil query di atas), jadi catatan filter "lihat semua" di sini
          cuma relevan buat admin/super admin yang mengelola banyak wisata. */}
      {!isWisataAdmin && searchParams.wisata && (
        <p className="mt-1 text-sm text-ink/60">
          Menampilkan paket tiket untuk 1 wisata.{" "}
          <Link href="/admin/tiket" className="text-clay-600 hover:underline">Lihat semua</Link>
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <TableSearch
          basePath={BASE}
          params={params}
          placeholder="Cari paket tiket atau wisata…"
          hidden={searchParams.wisata ? { wisata: searchParams.wisata } : undefined}
        />
        <TableFilter
          basePath={BASE}
          params={params}
          label="Status"
          options={[
            { value: "", label: "Semua", count: searched.length },
            { value: "aktif", label: "Aktif", count: countAktif },
            { value: "nonaktif", label: "Nonaktif", count: searched.length - countAktif },
            { value: "habis", label: "Kuota habis hari ini", count: countHabis },
          ]}
        />
      </div>

      <div className="card mt-4 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-forest-50 text-ink/60">
            <tr>
              <th className="w-16 px-4 py-3 font-medium">No</th>
              <SortableTh basePath={BASE} params={params} sortKey="name">Paket Tiket</SortableTh>
              {!isWisataAdmin && <SortableTh basePath={BASE} params={params} sortKey="wisata">Wisata</SortableTh>}
              <SortableTh basePath={BASE} params={params} sortKey="price">Harga</SortableTh>
              <SortableTh basePath={BASE} params={params} sortKey="quota">Kuota/Hari</SortableTh>
              <SortableTh basePath={BASE} params={params} sortKey="status">Status</SortableTh>
              <th className="px-4 py-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t, i) => (
              <tr key={t.id} className="border-t border-forest-50">
                <td className="px-4 py-3 tabular-nums text-ink/50">{offset + i + 1}</td>
                <td className="px-4 py-3 font-medium text-forest-900">{t.name}</td>
                {!isWisataAdmin && <td className="px-4 py-3 text-ink/70">{t.wisata?.name}</td>}
                <td className="px-4 py-3 text-ink/70">{formatIDR(t.price)}</td>
                <td className="px-4 py-3 text-ink/70">
                  <span>{t.quota_per_day}</span>
                  {remainingToday.has(t.id) && (
                    <span
                      className={`mt-0.5 block text-xs ${
                        remainingToday.get(t.id) === 0 ? "font-medium text-red-600" : "text-ink/50"
                      }`}
                    >
                      Sisa hari ini: {remainingToday.get(t.id)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    t.is_active ? "bg-forest-100 text-forest-800" : "bg-ink/10 text-ink/60"
                  }`}>
                    {t.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/tiket/${t.id}`} className="rounded p-1.5 text-forest-700 hover:bg-forest-50">
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <form action={deleteTiket.bind(null, t.id)}>
                      <ConfirmSubmitButton
                        title="Hapus paket tiket"
                        dialogTitle="Hapus paket tiket?"
                        message="Paket yang belum pernah dipesan akan dihapus permanen. Paket yang sudah pernah dipesan akan dinonaktifkan saja, supaya riwayat transaksi tetap aman."
                        className="rounded p-1.5 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={isWisataAdmin ? 6 : 7} className="px-4 py-10 text-center text-ink/50">
                  {params.q || params.filter ? "Tidak ada paket tiket yang cocok dengan pencarian/filter ini." : "Belum ada paket tiket."}
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
