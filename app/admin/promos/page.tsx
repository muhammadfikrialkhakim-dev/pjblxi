import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { describeDiscount, formatPromoDate, promoStatus, type Promo, type PromoStatus } from "@/lib/promo";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { deletePromo, togglePromo } from "./actions";

const STATUS_UI: Record<PromoStatus, { label: string; cls: string }> = {
  active: { label: "Aktif", cls: "bg-forest-100 text-forest-800" },
  upcoming: { label: "Dijadwalkan", cls: "bg-clay-100 text-clay-700" },
  expired: { label: "Berakhir", cls: "bg-ink/10 text-ink/60" },
  inactive: { label: "Nonaktif", cls: "bg-red-100 text-red-700" },
};

export default async function AdminPromosPage({ searchParams }: { searchParams: { error?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  const isSuperAdmin = profile?.role === "super_admin";
  const isWisataAdmin = profile?.role === "admin_wisata";
  if (!isSuperAdmin && !isWisataAdmin) redirect("/admin");

  let query = supabase.from("promos").select("*, wisata:wisata(name)").order("created_at", { ascending: false });

  // RLS mengizinkan siapa pun membaca promo yang sedang aktif, jadi untuk
  // Admin Wisata batasi eksplisit ke wisatanya sendiri.
  let hasWisata = true;
  if (isWisataAdmin) {
    const { data: own } = await supabase.from("wisata").select("id").eq("admin_id", user?.id).maybeSingle();
    hasWisata = Boolean(own);
    query = query.eq("wisata_id", own?.id ?? "00000000-0000-0000-0000-000000000000");
  }

  const { data } = await query;
  const promos = (data ?? []) as unknown as Promo[];

  // Jumlah klaim & pemakaian per promo (tabel user_promos tidak terbaca Admin Wisata lewat RLS).
  const stats = new Map<string, { claimed: number; used: number }>();
  let statsOk = true;
  if (promos.length) {
    try {
      const { data: rows } = await createAdminClient()
        .from("user_promos")
        .select("promo_id, used_at")
        .in(
          "promo_id",
          promos.map((p) => p.id)
        );
      (rows ?? []).forEach((r: { promo_id: string; used_at: string | null }) => {
        const s = stats.get(r.promo_id) ?? { claimed: 0, used: 0 };
        s.claimed += 1;
        if (r.used_at) s.used += 1;
        stats.set(r.promo_id, s);
      });
    } catch {
      statsOk = false;
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-forest-900">Kelola Promo</h1>
        {hasWisata && (
          <Link href="/admin/promos/new" className="btn-primary">
            <Plus className="h-4 w-4" /> Tambah Promo
          </Link>
        )}
      </div>
      <p className="mt-1 text-sm text-ink/60">
        Promo yang bisa diklaim pengunjung di halaman <strong>/promo</strong>, lalu dipakai saat checkout.
        {isWisataAdmin && " Anda hanya mengelola promo untuk wisata Anda."}
      </p>

      {searchParams.error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{searchParams.error}</p>
      )}
      {!hasWisata && (
        <p className="mt-4 rounded-lg border border-clay-200 bg-clay-50 px-4 py-3 text-sm text-clay-700">
          Akun Anda belum ditugaskan ke wisata mana pun, jadi belum bisa membuat promo.
        </p>
      )}

      <div className="card mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-forest-50 text-ink/60">
              <tr>
                <th className="w-14 px-4 py-3 font-medium">No.</th>
                <th className="px-4 py-3 font-medium">Promo</th>
                <th className="px-4 py-3 font-medium">Cakupan</th>
                <th className="px-4 py-3 font-medium">Periode</th>
                <th className="px-4 py-3 font-medium">Klaim / Dipakai</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {promos.map((p, i) => {
                const st = STATUS_UI[promoStatus(p)];
                const s = stats.get(p.id) ?? { claimed: 0, used: 0 };
                return (
                  <tr key={p.id} className="border-t border-forest-50 align-top">
                    <td className="px-4 py-3 tabular-nums text-ink/50">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-forest-900">{p.title}</p>
                      <p className="text-xs text-ink/60">{describeDiscount(p)}</p>
                      <span className="mt-1 inline-block rounded border border-dashed border-forest-300 bg-forest-50 px-1.5 py-0.5 text-[11px] font-semibold tracking-wider text-forest-800">
                        {p.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink/70">{p.wisata?.name ?? "Semua destinasi"}</td>
                    <td className="px-4 py-3 text-ink/70">
                      {formatPromoDate(p.starts_at)} – {p.ends_at ? formatPromoDate(p.ends_at) : "tanpa batas"}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-ink/70">
                      {statsOk ? (
                        <>
                          {s.claimed}
                          {p.claim_quota ? ` / ${p.claim_quota}` : ""} · {s.used}
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <form action={togglePromo.bind(null, p.id, !p.is_active)}>
                          <button
                            className="rounded p-1.5 text-forest-700 hover:bg-forest-50"
                            title={p.is_active ? "Nonaktifkan" : "Aktifkan"}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        </form>
                        <Link href={`/admin/promos/${p.id}`} className="rounded p-1.5 text-forest-700 hover:bg-forest-50" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <form action={deletePromo.bind(null, p.id)}>
                          <ConfirmSubmitButton
                            message={`Hapus promo ${p.code}? Voucher yang sudah diklaim pengunjung ikut terhapus.`}
                            className="rounded p-1.5 text-red-600 hover:bg-red-50"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!promos.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-ink/50">
                    Belum ada promo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
