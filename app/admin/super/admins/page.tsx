import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/lib/types";
import AccountRowActions from "@/components/AccountRowActions";
import TableSearch from "@/components/TableSearch";
import TableFilter from "@/components/TableFilter";
import SortableTh from "@/components/SortableTh";
import Pagination from "@/components/Pagination";
import { paginate, parseTableParams, type RawParams } from "@/lib/table-query";

const BASE = "/admin/super/admins";
const SORT_KEYS = ["name", "role", "wisata", "created"] as const;
const FILTER_KEYS = ["super_admin", "admin_wisata", "admin", "belum"] as const;
const ROLE_ORDER: Record<string, number> = { super_admin: 0, admin_wisata: 1, admin: 2 };

export default async function AdminAccountsPage({ searchParams }: { searchParams: RawParams }) {
  const params = parseTableParams(searchParams, {
    sortKeys: SORT_KEYS,
    defaultSort: "created",
    defaultDir: "desc",
    filterKeys: FILTER_KEYS,
  });

  const supabase = createClient();
  const { data: admins } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["admin", "admin_wisata", "super_admin"]);

  // Penugasan admin_wisata disimpan di wisata.admin_id (bukan di profiles),
  // jadi ambil terpisah lalu petakan id admin -> nama wisata untuk ditampilkan.
  const { data: assignedWisata } = await supabase.from("wisata").select("id, name, admin_id").not("admin_id", "is", null);
  const wisataNameByAdminId = new Map((assignedWisata ?? []).map((w) => [w.admin_id as string, w.name as string]));

  const all = ((admins ?? []) as Profile[]).map((a) => ({
    ...a,
    wisataName: a.role === "admin_wisata" ? (wisataNameByAdminId.get(a.id) ?? null) : null,
  }));

  // Cari (nama / wisata ditugaskan / telepon) → filter → urutkan → potong per halaman.
  const needle = params.q.toLowerCase();
  const searched = needle
    ? all.filter((a) =>
        [a.full_name, a.wisataName, a.phone].some((v) => (v ?? "").toLowerCase().includes(needle))
      )
    : all;
  const countOf = (f: string) =>
    searched.filter((a) => (f === "belum" ? a.role === "admin_wisata" && !a.wisataName : a.role === f)).length;
  const filtered = searched.filter((a) =>
    !params.filter
      ? true
      : params.filter === "belum"
        ? a.role === "admin_wisata" && !a.wisataName
        : a.role === params.filter
  );

  const m = params.dir === "asc" ? 1 : -1;
  const str = (v: string | null) => (v ?? "").toLocaleLowerCase("id");
  filtered.sort((a, b) => {
    let cmp = 0;
    if (params.sort === "name") cmp = str(a.full_name).localeCompare(str(b.full_name), "id");
    else if (params.sort === "role") cmp = ROLE_ORDER[a.role] - ROLE_ORDER[b.role];
    else if (params.sort === "wisata") {
      // yang belum punya wisata selalu di bawah, apa pun arah urutannya
      if (!a.wisataName !== !b.wisataName) return a.wisataName ? -1 : 1;
      cmp = str(a.wisataName).localeCompare(str(b.wisataName), "id");
    } else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return (cmp || str(a.full_name).localeCompare(str(b.full_name), "id")) * m;
  });
  const { rows, total, pages, page, offset } = paginate(filtered, params);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-forest-900">Kelola Data Admin</h1>
        <Link href="/admin/super/admins/new" className="btn-primary">
          Tambah Admin
        </Link>
      </div>
      <p className="mt-1 text-sm text-ink/60">
        Akun dengan akses ke panel admin. Super Admin punya akses tambahan mengelola akun & user.
      </p>

      <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <TableSearch basePath={BASE} params={params} placeholder="Cari nama, wisata, atau telepon…" />
        <TableFilter
          basePath={BASE}
          params={params}
          label="Role"
          options={[
            { value: "", label: "Semua", count: searched.length },
            { value: "super_admin", label: "Super Admin", count: countOf("super_admin") },
            { value: "admin_wisata", label: "Admin Wisata", count: countOf("admin_wisata") },
            { value: "admin", label: "Admin", count: countOf("admin") },
            { value: "belum", label: "Belum ditugaskan", count: countOf("belum") },
          ]}
        />
      </div>

      <div className="card mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-forest-50 text-ink/60">
              <tr>
                <th className="w-16 px-4 py-3 font-medium">No</th>
                <SortableTh basePath={BASE} params={params} sortKey="name">Nama</SortableTh>
                <SortableTh basePath={BASE} params={params} sortKey="role">Role</SortableTh>
                <SortableTh basePath={BASE} params={params} sortKey="wisata">Wisata</SortableTh>
                <SortableTh basePath={BASE} params={params} sortKey="created">Terdaftar</SortableTh>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a, i) => (
                <tr key={a.id} className="border-t border-forest-50">
                  <td className="px-4 py-3 tabular-nums text-ink/50">{offset + i + 1}</td>
                  <td className="px-4 py-3 font-medium text-forest-900">{a.full_name ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      a.role === "super_admin"
                        ? "bg-clay-100 text-clay-700"
                        : a.role === "admin_wisata"
                          ? "bg-forest-50 text-forest-700"
                          : "bg-forest-100 text-forest-800"
                    }`}>
                      {a.role === "super_admin" ? "Super Admin" : a.role === "admin_wisata" ? "Admin Wisata" : "Admin"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink/70">
                    {a.role === "admin_wisata" ? (
                      a.wisataName ?? <span className="text-ink/40">Belum ditugaskan</span>
                    ) : (
                      <span className="text-ink/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink/70">{new Date(a.created_at).toLocaleDateString("id-ID")}</td>
                  <td className="px-4 py-3">
                    <AccountRowActions profile={a} roleOptions={["admin", "admin_wisata", "super_admin"]} />
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink/50">
                    {params.q || params.filter ? "Tidak ada akun yang cocok dengan pencarian/filter ini." : "Belum ada akun admin."}
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
