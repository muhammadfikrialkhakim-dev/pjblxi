import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Category } from "@/lib/types";
import { deleteCategory } from "./actions";
import TableSearch from "@/components/TableSearch";
import SortableTh from "@/components/SortableTh";
import Pagination from "@/components/Pagination";
import TableFilter from "@/components/TableFilter";
import { paginate, parseTableParams, type RawParams } from "@/lib/table-query";

const BASE = "/admin/categories";
const SORT_KEYS = ["name", "slug", "count"] as const;
const FILTER_KEYS = ["terisi", "kosong"] as const;

type Row = Category & { wisata: { id: string }[] };

export default async function AdminCategoriesPage({ searchParams }: { searchParams: RawParams }) {
  const params = parseTableParams(searchParams, { sortKeys: SORT_KEYS, defaultSort: "name", filterKeys: FILTER_KEYS });

  const supabase = createClient();
  const { data } = await supabase.from("categories").select("*, wisata(id)");
  const all = ((data ?? []) as Row[]).map((c) => ({ ...c, count: c.wisata?.length ?? 0 }));

  // Cari (nama / slug) → filter (terisi / kosong) → urutkan → potong per halaman.
  // Jumlah kategori kecil, jadi aman dikerjakan di server tanpa query tambahan.
  const needle = params.q.toLowerCase();
  const searched = needle
    ? all.filter((c) => c.name.toLowerCase().includes(needle) || c.slug.toLowerCase().includes(needle))
    : all;
  // Hitungan di tiap pil mengikuti pencarian aktif, jadi angkanya cocok dengan isi tabel.
  const countTerisi = searched.filter((c) => c.count > 0).length;
  const filtered = searched.filter((c) =>
    params.filter === "terisi" ? c.count > 0 : params.filter === "kosong" ? c.count === 0 : true
  );
  const dirMul = params.dir === "asc" ? 1 : -1;
  filtered.sort((a, b) => {
    const cmp =
      params.sort === "count"
        ? a.count - b.count
        : String(a[params.sort as "name" | "slug"]).localeCompare(String(b[params.sort as "name" | "slug"]), "id", {
            sensitivity: "base",
          });
    return (cmp || a.name.localeCompare(b.name, "id")) * dirMul;
  });
  const { rows, total, pages, page, offset } = paginate(filtered, params);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-forest-900">Kelola Kategori Wisata</h1>
        <Link href="/admin/categories/new" className="btn-primary">
          <Plus className="h-4 w-4" /> Tambah Kategori
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <TableSearch basePath={BASE} params={params} placeholder="Cari nama atau slug kategori…" />
        <TableFilter
          basePath={BASE}
          params={params}
          label="Wisata"
          options={[
            { value: "", label: "Semua", count: searched.length },
            { value: "terisi", label: "Ada wisata", count: countTerisi },
            { value: "kosong", label: "Kosong", count: searched.length - countTerisi },
          ]}
        />
      </div>

      <div className="card mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-forest-50 text-ink/60">
              <tr>
                <th className="w-16 px-4 py-3 font-medium">No</th>
                <SortableTh basePath={BASE} params={params} sortKey="name">Nama Kategori</SortableTh>
                <SortableTh basePath={BASE} params={params} sortKey="slug">Slug</SortableTh>
                <SortableTh basePath={BASE} params={params} sortKey="count">Jumlah Wisata</SortableTh>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c, i) => (
                <tr key={c.id} className="border-t border-forest-50">
                  <td className="px-4 py-3 tabular-nums text-ink/50">{offset + i + 1}</td>
                  <td className="px-4 py-3 font-medium text-forest-900">{c.name}</td>
                  <td className="px-4 py-3 text-ink/70">{c.slug}</td>
                  <td className="px-4 py-3 text-ink/70">{c.count} wisata</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/categories/${c.id}`} className="rounded p-1.5 text-forest-700 hover:bg-forest-50" aria-label={`Ubah ${c.name}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <form action={deleteCategory.bind(null, c.id)}>
                        <button className="rounded p-1.5 text-red-600 hover:bg-red-50" aria-label={`Hapus ${c.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink/50">
                    {params.q || params.filter ? "Tidak ada kategori yang cocok dengan pencarian/filter ini." : "Belum ada kategori."}
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
