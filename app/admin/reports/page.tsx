import { FileDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/types";
import MonthlyPdfExport, { MonthlyPdfRowButton } from "@/components/MonthlyPdfExport";

// Pengelompokan bulan memakai WIB (server berjalan di UTC), supaya angka per
// bulan di sini sama persis dengan isi PDF laporan bulanan.
const WIB = 7 * 60 * 60 * 1000;

export default async function AdminReportsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  const isWisataAdmin = profile?.role === "admin_wisata";

  // Admin Wisata cuma boleh lihat laporan dari wisata yang ditugaskan
  // padanya. Sama seperti halaman Kelola Tiket & Transaksi: jangan andalkan
  // RLS saja, paksa filter di query lewat daftar tiket_id milik wisatanya
  // sendiri, supaya tidak ikut menghitung pendapatan wisata orang lain.
  let ownWisataName: string | null = null;
  let ownTiketIds: string[] | null = null;
  if (isWisataAdmin) {
    const { data: ownWisata } = await supabase.from("wisata").select("id, name").eq("admin_id", user?.id).maybeSingle();
    if (ownWisata) {
      ownWisataName = ownWisata.name;
      const { data: ownTiket } = await supabase.from("tiket").select("id").eq("wisata_id", ownWisata.id);
      ownTiketIds = (ownTiket ?? []).map((t) => t.id);
    } else {
      ownTiketIds = [];
    }
  }

  let paidOrdersQuery = supabase
    .from("orders")
    .select("total_price, created_at, ticket_quantity, tiket(name, wisata(name))")
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false });
  if (isWisataAdmin) {
    paidOrdersQuery = paidOrdersQuery.in(
      "tiket_id",
      ownTiketIds && ownTiketIds.length ? ownTiketIds : ["00000000-0000-0000-0000-000000000000"]
    );
  }
  const { data: paidOrders } = await paidOrdersQuery;

  const monthly = new Map<string, { revenue: number; orders: number; month: number; year: number }>();
  const byWisata = new Map<string, { revenue: number; tickets: number }>();
  const byTiket = new Map<string, { revenue: number; tickets: number }>();

  paidOrders?.forEach((o: any) => {
    const wib = new Date(new Date(o.created_at).getTime() + WIB);
    const monthKey = wib.toLocaleDateString("id-ID", { month: "long", year: "numeric", timeZone: "UTC" });
    const m = monthly.get(monthKey) ?? { revenue: 0, orders: 0, month: wib.getUTCMonth() + 1, year: wib.getUTCFullYear() };
    m.revenue += Number(o.total_price);
    m.orders += 1;
    monthly.set(monthKey, m);

    const wisataName = o.tiket?.wisata?.name ?? "Tidak diketahui";
    const w = byWisata.get(wisataName) ?? { revenue: 0, tickets: 0 };
    w.revenue += Number(o.total_price);
    w.tickets += o.ticket_quantity;
    byWisata.set(wisataName, w);

    // Khusus Admin Wisata: pecah per PAKET TIKET, bukan per wisata (karena
    // wisatanya sudah pasti cuma 1, jadi tabel "Wisata Terlaris" tidak ada
    // gunanya untuk role ini — yang lebih berguna justru paket mana yang
    // paling laku di wisatanya sendiri).
    const tiketName = o.tiket?.name ?? "Tidak diketahui";
    const t = byTiket.get(tiketName) ?? { revenue: 0, tickets: 0 };
    t.revenue += Number(o.total_price);
    t.tickets += o.ticket_quantity;
    byTiket.set(tiketName, t);
  });

  const nowWib = new Date(Date.now() + WIB);
  const totalRevenue = paidOrders?.reduce((s, o) => s + Number(o.total_price), 0) ?? 0;
  const totalTransactions = paidOrders?.length ?? 0;

  // "Terlaris" = paling banyak tiket terjual; pendapatan hanya pemutus seri.
  const byBestSelling = (a: [string, { revenue: number; tickets: number }], b: [string, { revenue: number; tickets: number }]) =>
    b[1].tickets - a[1].tickets || b[1].revenue - a[1].revenue;
  const topWisata = Array.from(byWisata.entries()).sort(byBestSelling).slice(0, 8);
  const topTiket = Array.from(byTiket.entries()).sort(byBestSelling).slice(0, 8);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-forest-900">Laporan</h1>
      <p className="mt-1 text-sm text-ink/60">
        {isWisataAdmin
          ? `Ringkasan pendapatan wisata ${ownWisataName ?? "Anda"} dari transaksi yang sudah lunas.`
          : "Ringkasan pendapatan dari transaksi yang sudah lunas."}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="text-xs text-ink/50">Total Pendapatan (Lunas)</p>
          <p className="mt-2 font-display text-2xl font-semibold text-forest-900">{formatIDR(totalRevenue)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink/50">Total Transaksi Lunas</p>
          <p className="mt-2 font-display text-2xl font-semibold text-forest-900">{totalTransactions}</p>
        </div>
      </div>

      {/* Export laporan bulanan (PDF) — khusus Admin Wisata */}
      {isWisataAdmin && (
        <div className="card mt-6 p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-md">
              <h2 className="flex items-center gap-2 font-medium text-forest-900">
                <FileDown className="h-4 w-4 text-clay-500" /> Export Laporan Bulanan (PDF)
              </h2>
              <p className="mt-1 text-sm text-ink/60">
                Pilih bulan lalu export: ringkasan pendapatan, penjualan per paket tiket, pendapatan harian, dan rincian
                transaksi lunas. Dialog cetak akan terbuka di halaman ini — pilih tujuan “Simpan sebagai PDF”.
              </p>
            </div>
            <MonthlyPdfExport
              month={nowWib.getUTCMonth() + 1}
              year={nowWib.getUTCFullYear()}
              currentYear={nowWib.getUTCFullYear()}
            />
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-medium text-forest-900">Pendapatan per Bulan</h2>
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-forest-100 text-ink/50">
                <th className="pb-2 font-medium">Bulan</th>
                <th className="pb-2 font-medium text-center">Transaksi</th>
                <th className="pb-2 text-right font-medium">Pendapatan</th>
                {isWisataAdmin && <th className="pb-2 text-right font-medium">PDF</th>}
              </tr>
            </thead>
            <tbody>
              {Array.from(monthly.entries()).map(([label, v]) => (
                <tr key={label} className="border-b border-forest-50">
                  <td className="py-2.5">{label}</td>
                  <td className="py-2.5 text-center">{v.orders}</td>
                  <td className="py-2.5 text-right">{formatIDR(v.revenue)}</td>
                  {isWisataAdmin && (
                    <td className="py-2.5 text-right">
                      <MonthlyPdfRowButton month={v.month} year={v.year} label={label} />
                    </td>
                  )}
                </tr>
              ))}
              {!monthly.size && (
                <tr><td colSpan={isWisataAdmin ? 4 : 3} className="py-6 text-center text-ink/50">Belum ada transaksi lunas.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {isWisataAdmin ? (
          <div className="card p-5">
            <h2 className="font-medium text-forest-900">Paket Tiket Terlaris</h2>
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-forest-100 text-ink/50">
                  <th className="pb-2 font-medium">Paket Tiket</th>
                  <th className="pb-2 font-medium text-center">Tiket Terjual</th>
                  <th className="pb-2 text-right font-medium">Pendapatan</th>
                </tr>
              </thead>
              <tbody>
                {topTiket.map(([name, v]) => (
                  <tr key={name} className="border-b border-forest-50">
                    <td className="py-2.5">{name}</td>
                    <td className="py-2.5 text-center">{v.tickets}</td>
                    <td className="py-2.5 text-right">{formatIDR(v.revenue)}</td>
                  </tr>
                ))}
                {!topTiket.length && (
                  <tr><td colSpan={3} className="py-6 text-center text-ink/50">Belum ada data.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card p-5">
            <h2 className="font-medium text-forest-900">Wisata Terlaris</h2>
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-forest-100 text-ink/50">
                  <th className="pb-2 font-medium">Wisata</th>
                  <th className="pb-2 font-medium text-center">Tiket Terjual</th>
                  <th className="pb-2 text-right font-medium">Pendapatan</th>
                </tr>
              </thead>
              <tbody>
                {topWisata.map(([name, v]) => (
                  <tr key={name} className="border-b border-forest-50">
                    <td className="py-2.5">{name}</td>
                    <td className="py-2.5 text-center">{v.tickets}</td>
                    <td className="py-2.5 text-right">{formatIDR(v.revenue)}</td>
                  </tr>
                ))}
                {!topWisata.length && (
                  <tr><td colSpan={3} className="py-6 text-center text-ink/50">Belum ada data.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
