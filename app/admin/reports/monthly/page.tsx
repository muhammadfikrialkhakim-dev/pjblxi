import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/types";
import MonthYearFields, { BULAN } from "@/components/MonthYearFields";
import PrintButton from "@/components/PrintButton";
import AutoPrint from "@/components/AutoPrint";

// Server berjalan di UTC, pengguna di WIB (UTC+7). Batas bulan dan
// pengelompokan harian memakai WIB supaya transaksi malam hari tidak
// "bergeser" ke hari/bulan lain.
const WIB = 7 * 60 * 60 * 1000;
const dayKey = (d: Date) => new Date(d.getTime() + WIB).toISOString().slice(0, 10);

type SearchParams = { bulan?: string; tahun?: string; cetak?: string };

function parsePeriod(sp: SearchParams) {
  const nowWib = new Date(Date.now() + WIB);
  const curYear = nowWib.getUTCFullYear();
  const curMonth = nowWib.getUTCMonth() + 1;
  const m = parseInt(sp.bulan ?? "", 10);
  const y = parseInt(sp.tahun ?? "", 10);
  const month = m >= 1 && m <= 12 ? m : curMonth;
  const year = y >= 2000 && y <= curYear + 1 ? y : curYear;
  return { month, year, curYear };
}

// Judul halaman dipakai browser sebagai nama file bawaan saat "Simpan sebagai PDF".
export function generateMetadata({ searchParams }: { searchParams: SearchParams }) {
  const { month, year } = parsePeriod(searchParams);
  return { title: `Laporan Bulanan ${BULAN[month - 1]} ${year} — Explore Malang` };
}

const STATUS_LABEL: Record<string, string> = {
  paid: "Lunas",
  pending: "Menunggu",
  failed: "Gagal",
  expired: "Kedaluwarsa",
  refunded: "Refund",
};

function delta(current: number, previous: number): string {
  if (previous === 0) return current === 0 ? "Belum ada data bulan lalu" : "Tidak ada data bulan lalu";
  const pct = ((current - previous) / previous) * 100;
  return `${pct >= 0 ? "▲ +" : "▼ "}${pct.toFixed(0)}% dari bulan lalu`;
}

const shortDate = (key: string) =>
  new Date(`${key}T00:00:00Z`).toLocaleDateString("id-ID", { weekday: "short", day: "2-digit", month: "short", timeZone: "UTC" });

export default async function MonthlyReportPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user?.id).single();
  const isSuperAdmin = profile?.role === "super_admin";
  const isWisataAdmin = profile?.role === "admin_wisata";
  if (!isSuperAdmin && !isWisataAdmin) redirect("/admin");

  const { month, year, curYear } = parsePeriod(searchParams);
  const periodLabel = `${BULAN[month - 1]} ${year}`;

  // Admin Wisata hanya boleh melihat wisatanya sendiri. Sama seperti halaman
  // Laporan & Transaksi: jangan andalkan RLS saja, paksa filter query lewat
  // daftar tiket_id milik wisatanya.
  let wisataName = "Semua Wisata";
  let ownTiketIds: string[] | null = null;
  if (isWisataAdmin) {
    const { data: own } = await supabase.from("wisata").select("id, name").eq("admin_id", user?.id).maybeSingle();
    if (!own) {
      return (
        <div className="py-16 text-center text-sm text-ink/60">
          Akun Anda belum ditugaskan ke wisata mana pun, jadi belum ada laporan yang bisa dibuat.
        </div>
      );
    }
    wisataName = own.name;
    const { data: tiket } = await supabase.from("tiket").select("id").eq("wisata_id", own.id);
    ownTiketIds = (tiket ?? []).map((t) => t.id);
  }

  const start = new Date(Date.UTC(year, month - 1, 1) - WIB);
  const end = new Date(Date.UTC(year, month, 1) - WIB);
  const prevStart = new Date(Date.UTC(year, month - 2, 1) - WIB);

  // Satu query untuk bulan ini + bulan sebelumnya (untuk perbandingan).
  let query = supabase
    .from("orders")
    .select(
      "id, order_code, customer_name, visit_date, ticket_quantity, total_price, payment_status, created_at, tiket(id, name)"
    )
    .gte("created_at", prevStart.toISOString())
    .lt("created_at", end.toISOString())
    .order("created_at", { ascending: true });
  if (ownTiketIds) {
    query = query.in("tiket_id", ownTiketIds.length ? ownTiketIds : ["00000000-0000-0000-0000-000000000000"]);
  }
  const { data: raw } = await query;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all = (raw ?? []) as any[];
  const cur = all.filter((o) => new Date(o.created_at) >= start);
  const prev = all.filter((o) => new Date(o.created_at) < start);

  const paidCur = cur.filter((o) => o.payment_status === "paid");
  const paidPrev = prev.filter((o) => o.payment_status === "paid");
  const sumRev = (l: typeof all) => l.reduce((s, o) => s + Number(o.total_price), 0);
  const sumQty = (l: typeof all) => l.reduce((s, o) => s + Number(o.ticket_quantity ?? 0), 0);

  const revenue = sumRev(paidCur);
  const tickets = sumQty(paidCur);
  const avgOrder = paidCur.length ? revenue / paidCur.length : 0;
  const successRate = cur.length ? Math.round((paidCur.length / cur.length) * 100) : 0;

  // Per paket tiket
  const byTiket = new Map<string, { name: string; tickets: number; revenue: number }>();
  paidCur.forEach((o) => {
    const t = Array.isArray(o.tiket) ? o.tiket[0] : o.tiket;
    const key = t?.id ?? "-";
    const row = byTiket.get(key) ?? { name: t?.name ?? "Tidak diketahui", tickets: 0, revenue: 0 };
    row.tickets += Number(o.ticket_quantity ?? 0);
    row.revenue += Number(o.total_price);
    byTiket.set(key, row);
  });
  const tiketRows = Array.from(byTiket.values()).sort((a, b) => b.revenue - a.revenue);

  // Per hari (hanya hari yang ada transaksi lunas)
  const byDay = new Map<string, { orders: number; tickets: number; revenue: number }>();
  paidCur.forEach((o) => {
    const k = dayKey(new Date(o.created_at));
    const row = byDay.get(k) ?? { orders: 0, tickets: 0, revenue: 0 };
    row.orders += 1;
    row.tickets += Number(o.ticket_quantity ?? 0);
    row.revenue += Number(o.total_price);
    byDay.set(k, row);
  });
  const dayRows = Array.from(byDay.entries()).sort(([a], [b]) => a.localeCompare(b));

  const printedAt = new Date().toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });

  const th = "border-b border-ink/30 px-2 py-1.5 text-left font-semibold";
  const td = "border-b border-ink/10 px-2 py-1.5";

  return (
    <div>
      {searchParams.cetak === "1" && <AutoPrint />}

      {/* Toolbar — tidak ikut tercetak */}
      <div className="no-print mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin" className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Dashboard
          </Link>
          <form method="get" className="flex flex-wrap items-center gap-2">
            <MonthYearFields month={month} year={year} currentYear={curYear} />
            <button type="submit" className="btn-secondary">
              Tampilkan
            </button>
          </form>
        </div>
        <div className="text-right">
          <PrintButton />
          <p className="mt-1.5 text-xs text-ink/50">Pilih tujuan “Simpan sebagai PDF” pada dialog cetak.</p>
        </div>
      </div>

      {/* Lembar laporan */}
      <article className="report-sheet mx-auto max-w-[820px] rounded-lg border border-forest-100 bg-white p-8 text-[13px] leading-relaxed text-ink shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="border-b-2 border-forest-700 pb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-forest-700">Explore Malang</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-forest-900">Laporan Penjualan Bulanan</h1>
          <dl className="mt-3 grid grid-cols-[110px_1fr] gap-y-0.5">
            <dt className="text-ink/60">Wisata</dt>
            <dd className="font-medium">{wisataName}</dd>
            <dt className="text-ink/60">Periode</dt>
            <dd className="font-medium">{periodLabel}</dd>
          </dl>
        </header>

        <section className="mt-5">
          <h2 className="mb-2 text-sm font-semibold text-forest-900">Ringkasan</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Pendapatan", value: formatIDR(revenue), note: delta(revenue, sumRev(paidPrev)) },
              { label: "Tiket terjual", value: String(tickets), note: delta(tickets, sumQty(paidPrev)) },
              { label: "Pesanan lunas", value: String(paidCur.length), note: delta(paidCur.length, paidPrev.length) },
              { label: "Rata-rata / pesanan", value: formatIDR(avgOrder), note: `${successRate}% pembayaran berhasil` },
            ].map((c) => (
              <div key={c.label} className="break-inside-avoid rounded border border-ink/20 p-3">
                <p className="text-[11px] text-ink/60">{c.label}</p>
                <p className="mt-0.5 text-base font-semibold text-forest-900">{c.value}</p>
                <p className="mt-0.5 text-[10.5px] text-ink/50">{c.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-forest-900">Penjualan per Paket Tiket</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>Paket</th>
                <th className={`${th} text-right`}>Tiket</th>
                <th className={`${th} text-right`}>Pendapatan</th>
                <th className={`${th} text-right`}>Kontribusi</th>
              </tr>
            </thead>
            <tbody>
              {tiketRows.map((r) => (
                <tr key={r.name}>
                  <td className={td}>{r.name}</td>
                  <td className={`${td} text-right tabular-nums`}>{r.tickets}</td>
                  <td className={`${td} text-right tabular-nums`}>{formatIDR(r.revenue)}</td>
                  <td className={`${td} text-right tabular-nums`}>{revenue ? Math.round((r.revenue / revenue) * 100) : 0}%</td>
                </tr>
              ))}
              {!tiketRows.length && (
                <tr>
                  <td colSpan={4} className={`${td} py-4 text-center text-ink/50`}>
                    Belum ada penjualan lunas pada bulan ini.
                  </td>
                </tr>
              )}
            </tbody>
            {tiketRows.length > 0 && (
              <tfoot>
                <tr className="font-semibold">
                  <td className="px-2 py-1.5">Total</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{tickets}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{formatIDR(revenue)}</td>
                  <td className="px-2 py-1.5 text-right">100%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </section>

        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-forest-900">Pendapatan Harian</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>Tanggal</th>
                <th className={`${th} text-right`}>Pesanan</th>
                <th className={`${th} text-right`}>Tiket</th>
                <th className={`${th} text-right`}>Pendapatan</th>
              </tr>
            </thead>
            <tbody>
              {dayRows.map(([k, r]) => (
                <tr key={k}>
                  <td className={td}>{shortDate(k)}</td>
                  <td className={`${td} text-right tabular-nums`}>{r.orders}</td>
                  <td className={`${td} text-right tabular-nums`}>{r.tickets}</td>
                  <td className={`${td} text-right tabular-nums`}>{formatIDR(r.revenue)}</td>
                </tr>
              ))}
              {!dayRows.length && (
                <tr>
                  <td colSpan={4} className={`${td} py-4 text-center text-ink/50`}>
                    Tidak ada transaksi lunas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="mt-6 break-inside-avoid">
          <h2 className="mb-2 text-sm font-semibold text-forest-900">Status Pesanan</h2>
          <table className="w-full max-w-sm border-collapse">
            <tbody>
              {Object.entries(STATUS_LABEL).map(([key, label]) => (
                <tr key={key}>
                  <td className={td}>{label}</td>
                  <td className={`${td} text-right tabular-nums`}>{cur.filter((o) => o.payment_status === key).length}</td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="px-2 py-1.5">Total pesanan</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{cur.length}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-forest-900">Rincian Transaksi Lunas</h2>
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                <th className={th}>No.</th>
                <th className={th}>Kode</th>
                <th className={th}>Dipesan</th>
                <th className={th}>Pembeli</th>
                <th className={th}>Paket</th>
                <th className={th}>Kunjungan</th>
                <th className={`${th} text-right`}>Qty</th>
                <th className={`${th} text-right`}>Total</th>
              </tr>
            </thead>
            <tbody>
              {paidCur.map((o, i) => {
                const t = Array.isArray(o.tiket) ? o.tiket[0] : o.tiket;
                return (
                  <tr key={o.id}>
                    <td className={`${td} tabular-nums text-ink/50`}>{i + 1}</td>
                    <td className={`${td} whitespace-nowrap`}>{o.order_code}</td>
                    <td className={`${td} whitespace-nowrap`}>
                      {new Date(o.created_at).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Jakarta",
                      })}
                    </td>
                    <td className={td}>{o.customer_name}</td>
                    <td className={td}>{t?.name ?? "-"}</td>
                    <td className={`${td} whitespace-nowrap`}>
                      {new Date(`${o.visit_date}T00:00:00Z`).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        timeZone: "UTC",
                      })}
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{o.ticket_quantity}</td>
                    <td className={`${td} text-right tabular-nums`}>{formatIDR(o.total_price)}</td>
                  </tr>
                );
              })}
              {!paidCur.length && (
                <tr>
                  <td colSpan={8} className={`${td} py-4 text-center text-ink/50`}>
                    Tidak ada transaksi lunas pada bulan ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <footer className="mt-8 border-t border-ink/20 pt-3 text-[11px] text-ink/55">
          <p>
            Pendapatan dihitung dari pesanan berstatus <strong>Lunas</strong> menurut tanggal pemesanan (WIB). Perbandingan
            dibuat terhadap bulan sebelumnya.
          </p>
          <p className="mt-1">
            Dicetak pada {printedAt} WIB oleh {profile?.full_name ?? "Admin"}.
          </p>
        </footer>
      </article>
    </div>
  );
}
