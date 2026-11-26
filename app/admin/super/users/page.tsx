import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/lib/types";
import AccountRowActions from "@/components/AccountRowActions";
import TableSearch from "@/components/TableSearch";
import TableFilter from "@/components/TableFilter";
import SortableTh from "@/components/SortableTh";
import Pagination from "@/components/Pagination";
import { parseTableParams, type RawParams } from "@/lib/table-query";

const BASE = "/admin/super/users";
// key tampilan -> kolom di database
const SORT_COLUMNS = { name: "full_name", role: "role", created: "created_at" } as const;
const FILTER_KEYS = ["customer", "agent"] as const;

const roleLabel: Record<string, string> = {
  customer: "Customer",
  agent: "Agent",
};

export default async function AdminUsersPage({ searchParams }: { searchParams: RawParams }) {
  const params = parseTableParams(searchParams, {
    sortKeys: Object.keys(SORT_COLUMNS),
    defaultSort: "created",
    defaultDir: "desc",
    filterKeys: FILTER_KEYS,
  });

  const supabase = createClient();

  // Data user bisa ribuan, jadi cari/filter/urut/potong dikerjakan di database
  // (bukan ditarik semua lalu disaring di server).
  // Karakter khusus sintaks filter PostgREST dibuang dari kata kunci.
  const needle = params.q.replace(/[,()%*\\]/g, " ").trim();
  const applySearch = <T extends { or: (f: string) => T }>(qb: T): T =>
    needle ? qb.or(`full_name.ilike.%${needle}%,phone.ilike.%${needle}%,agency_name.ilike.%${needle}%`) : qb;

  const countRole = async (role: string) => {
    const { count } = await applySearch(
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", role)
    );
    return count ?? 0;
  };
  const [nCustomer, nAgent] = await Promise.all([countRole("customer"), countRole("agent")]);
  const total = params.filter === "customer" ? nCustomer : params.filter === "agent" ? nAgent : nCustomer + nAgent;

  const pages = Math.max(1, Math.ceil(total / params.per));
  const page = Math.min(params.page, pages);
  const offset = (page - 1) * params.per;

  let users: Profile[] = [];
  if (total > 0) {
    const col = SORT_COLUMNS[params.sort as keyof typeof SORT_COLUMNS];
    let qb = applySearch(
      supabase
        .from("profiles")
        .select("*")
        .in("role", params.filter ? [params.filter] : ["customer", "agent"])
    ).order(col, { ascending: params.dir === "asc", nullsFirst: false });
    // urutan kedua yang stabil supaya baris tidak tertukar antar halaman
    if (col !== "created_at") qb = qb.order("created_at", { ascending: false });
    const { data } = await qb.range(offset, offset + params.per - 1);
    users = (data ?? []) as Profile[];
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-forest-900">Kelola Data User</h1>
      <p className="mt-1 text-sm text-ink/60">Akun pengguna (customer & agen). Akun admin dikelola di halaman Kelola Data Admin.</p>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
        <TableSearch basePath={BASE} params={params} placeholder="Cari nama, telepon, atau agensi…" />
        <TableFilter
          basePath={BASE}
          params={params}
          label="Role"
          options={[
            { value: "", label: "Semua", count: nCustomer + nAgent },
            { value: "customer", label: "Customer", count: nCustomer },
            { value: "agent", label: "Agent", count: nAgent },
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
                <SortableTh basePath={BASE} params={params} sortKey="created">Terdaftar</SortableTh>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className="border-t border-forest-50">
                  <td className="px-4 py-3 tabular-nums text-ink/50">{offset + i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-forest-900">{u.full_name ?? "-"}</p>
                    {(u.phone || u.agency_name) && (
                      <p className="text-xs text-ink/50">{[u.agency_name, u.phone].filter(Boolean).join(" · ")}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-forest-50 px-2.5 py-0.5 text-xs font-medium text-forest-800">
                      {roleLabel[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{new Date(u.created_at).toLocaleDateString("id-ID")}</td>
                  <td className="px-4 py-3">
                    <AccountRowActions profile={u} roleOptions={["customer", "agent", "admin", "admin_wisata"]} />
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink/50">
                    {params.q || params.filter ? "Tidak ada user yang cocok dengan pencarian/filter ini." : "Belum ada user."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination basePath={BASE} params={params} total={total} pages={pages} page={page} offset={offset} shown={users.length} />
      </div>
    </div>
  );
}
