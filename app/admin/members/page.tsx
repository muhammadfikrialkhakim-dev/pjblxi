import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/lib/types";

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = createClient();

  let query = supabase.from("profiles").select("*").eq("role", "customer").order("created_at", { ascending: false });
  if (searchParams.q) query = query.ilike("full_name", `%${searchParams.q}%`);
  const { data: members } = await query;

  // Hitung jumlah transaksi per member (query terpisah, ringan untuk skala kecil-menengah)
  const { data: orderCounts } = await supabase.from("orders").select("customer_id");
  const countMap = new Map<string, number>();
  orderCounts?.forEach((o) => {
    if (!o.customer_id) return;
    countMap.set(o.customer_id, (countMap.get(o.customer_id) ?? 0) + 1);
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-forest-900">Kelola Data Member</h1>

      <form className="mt-4 max-w-xs">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Cari nama member..."
          className="input-field"
        />
      </form>

      <div className="card mt-6 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-forest-50 text-ink/60">
            <tr>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Telepon</th>
              <th className="px-4 py-3 font-medium">Terdaftar</th>
              <th className="px-4 py-3 font-medium text-right">Jumlah Transaksi</th>
            </tr>
          </thead>
          <tbody>
            {(members as Profile[] | null)?.map((m) => (
              <tr key={m.id} className="border-t border-forest-50">
                <td className="px-4 py-3 font-medium text-forest-900">{m.full_name ?? "-"}</td>
                <td className="px-4 py-3 text-ink/70">{m.phone ?? "-"}</td>
                <td className="px-4 py-3 text-ink/70">{new Date(m.created_at).toLocaleDateString("id-ID")}</td>
                <td className="px-4 py-3 text-right text-ink/70">{countMap.get(m.id) ?? 0}</td>
              </tr>
            ))}
            {!members?.length && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink/50">Belum ada member.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
