import Link from "next/link";
import {
  Wallet,
  Receipt,
  MapPinned,
  Users,
  Plus,
  Ticket,
  FileBarChart,
  ShieldAlert,
  ArrowRight,
  Pencil,
  TrendingUp,
  TrendingDown,
  Trophy,
  PieChart,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Order, formatIDR } from "@/lib/types";
import { syncPendingOrdersWithMidtrans } from "@/lib/midtrans";
import RevenueChart, { RevenuePoint } from "@/components/RevenueChart";

// Server berjalan di UTC, sedangkan pengguna di WIB (UTC+7). Semua pengelompokan
// per hari memakai kunci tanggal WIB supaya transaksi malam hari tidak
// "bergeser" ke hari lain.
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const dayKey = (d: Date) => new Date(d.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
const labelFromKey = (key: string) =>
  new Date(`${key}T00:00:00Z`).toLocaleDateString("id-ID", { day: "2-digit", month: "short", timeZone: "UTC" });

const RANGES = [7, 14, 30] as const;

const STATUS_META: Record<string, { label: string; badge: string; bar: string }> = {
  paid: { label: "Lunas", badge: "bg-forest-100 text-forest-800", bar: "bg-forest-500" },
  pending: { label: "Menunggu", badge: "bg-amber-100 text-amber-700", bar: "bg-amber-400" },
  failed: { label: "Gagal", badge: "bg-red-100 text-red-700", bar: "bg-red-400" },
  expired: { label: "Kedaluwarsa", badge: "bg-gray-100 text-gray-600", bar: "bg-gray-300" },
  refunded: { label: "Refund", badge: "bg-blue-100 text-blue-700", bar: "bg-blue-400" },
};

function Trend({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <span className="text-xs text-ink/40">— belum ada data</span>;
  if (previous === 0) return <span className="text-xs font-medium text-forest-700">Baru periode ini</span>;
  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${up ? "text-forest-700" : "text-red-600"}`}>
      <Icon className="h-3.5 w-3.5" />
      {up ? "+" : ""}
      {pct.toFixed(0)}% <span className="font-normal text-ink/45">vs periode lalu</span>
    </span>
  );
}

const statusLabelWisata: Record<string, string> = {
  published: "Published",
  draft: "Draft",
  archived: "Archived",
};

export default async function AdminDashboardPage({ searchParams }: { searchParams: { range?: string } }) {
  const requestedRange = Number(searchParams.range);
  const range = (RANGES as readonly number[]).includes(requestedRange) ? requestedRange : 14;
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user?.id)
    .single();

  const isSuperAdmin = profile?.role === "super_admin";
  const isWisataAdmin = profile?.role === "admin_wisata";
  const firstName = profile?.full_name?.split(" ")[0] ?? "Admin";

  // Admin Wisata cuma boleh lihat ringkasan dari SATU wisata yang
  // ditugaskan padanya — jangan andalkan RLS saja (kolom SELECT tiket
  // punya policy publik yang ikut ter-OR-kan), paksa filter query lewat
  // daftar tiket_id milik wisatanya sendiri, sama seperti halaman
  // Transaksi & Laporan.
  let ownWisata: { id: string; name: string; status: string } | null = null;
  let ownTiketIds: string[] | null = null;
  let ownTiketActiveCount = 0;
  if (isWisataAdmin) {
    const { data } = await supabase.from("wisata").select("id, name, status").eq("admin_id", user?.id).maybeSingle();
    ownWisata = data ?? null;
    if (ownWisata) {
      const { data: ownTiket } = await supabase.from("tiket").select("id, is_active").eq("wisata_id", ownWisata.id);
      ownTiketIds = (ownTiket ?? []).map((t) => t.id);
      ownTiketActiveCount = (ownTiket ?? []).filter((t) => t.is_active).length;
    } else {
      ownTiketIds = [];
    }
  }
  const scopeIds = ownTiketIds && ownTiketIds.length ? ownTiketIds : ["00000000-0000-0000-0000-000000000000"];

  // Sebelum menghitung statistik & daftar "Perlu Diverifikasi", tanya
  // langsung ke Midtrans status TERKINI transaksi yang masih 'pending' —
  // lihat penjelasan lengkap di lib/midtrans.ts (syncPendingOrdersWithMidtrans).
  let dashPendingQuery = supabase
    .from("orders")
    .select("id, midtrans_order_id, total_price, payment_method")
    .eq("payment_status", "pending");
  if (isWisataAdmin) dashPendingQuery = dashPendingQuery.in("tiket_id", scopeIds);
  const { data: dashStillPending } = await dashPendingQuery;
  await syncPendingOrdersWithMidtrans(supabase, dashStillPending ?? []);

  let recentOrdersQuery = supabase
    .from("orders")
    .select("*, tiket(name, wisata(name))")
    .order("created_at", { ascending: false })
    .limit(8);
  let pendingOrdersQuery = supabase
    .from("orders")
    .select("*, tiket(name, wisata(name))")
    .eq("payment_status", "pending")
    .order("created_at", { ascending: true })
    .limit(5);
  let allOrdersQuery = supabase
    .from("orders")
    .select("total_price, payment_status, created_at, ticket_quantity, tiket(id, name, wisata(id, name))");
  if (isWisataAdmin) {
    recentOrdersQuery = recentOrdersQuery.in("tiket_id", scopeIds);
    pendingOrdersQuery = pendingOrdersQuery.in("tiket_id", scopeIds);
    allOrdersQuery = allOrdersQuery.in("tiket_id", scopeIds);
  }

  const [{ data: recentOrders }, { data: pendingOrders }, { count: wisataCount }, { count: memberCount }] =
    await Promise.all([
      recentOrdersQuery,
      pendingOrdersQuery,
      supabase.from("wisata").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer"),
    ]);

  const { data: allOrdersRaw } = await allOrdersQuery;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allOrders = (allOrdersRaw ?? []) as any[];

  // ---- Perhitungan per periode (range hari terakhir vs periode sebelumnya) ----
  const now = new Date();
  const currentKeys: string[] = [];
  const previousKeys = new Set<string>();
  for (let i = range - 1; i >= 0; i--) currentKeys.push(dayKey(new Date(now.getTime() - i * DAY_MS)));
  for (let i = 2 * range - 1; i >= range; i--) previousKeys.add(dayKey(new Date(now.getTime() - i * DAY_MS)));
  const currentSet = new Set(currentKeys);
  const todayKey = dayKey(now);

  const orderKey = (o: { created_at: string }) => dayKey(new Date(o.created_at));
  const paidAll = allOrders.filter((o) => o.payment_status === "paid");
  const revenueAllTime = paidAll.reduce((sum, o) => sum + Number(o.total_price), 0);

  const inCurrent = allOrders.filter((o) => currentSet.has(orderKey(o)));
  const inPrevious = allOrders.filter((o) => previousKeys.has(orderKey(o)));
  const paidCurrent = inCurrent.filter((o) => o.payment_status === "paid");
  const paidPrevious = inPrevious.filter((o) => o.payment_status === "paid");

  const sumRevenue = (list: typeof allOrders) => list.reduce((sum, o) => sum + Number(o.total_price), 0);
  const sumTickets = (list: typeof allOrders) => list.reduce((sum, o) => sum + Number(o.ticket_quantity ?? 0), 0);

  const revenueCurrent = sumRevenue(paidCurrent);
  const revenuePrevious = sumRevenue(paidPrevious);
  const ticketsCurrent = sumTickets(paidCurrent);
  const ticketsPrevious = sumTickets(paidPrevious);

  const pendingCount = allOrders.filter((o) => o.payment_status === "pending").length;

  const todayOrders = allOrders.filter((o) => orderKey(o) === todayKey);
  const todayRevenue = sumRevenue(todayOrders.filter((o) => o.payment_status === "paid"));

  // Grafik pendapatan
  const revenueByDay = new Map<string, number>();
  paidCurrent.forEach((o) => revenueByDay.set(orderKey(o), (revenueByDay.get(orderKey(o)) ?? 0) + Number(o.total_price)));
  const days: RevenuePoint[] = currentKeys.map((key) => ({ label: labelFromKey(key), revenue: revenueByDay.get(key) ?? 0 }));

  // Peringkat: Super Admin = wisata terlaris, Admin Wisata = paket tiket terlaris
  const rankMap = new Map<string, { name: string; revenue: number; tickets: number }>();
  paidCurrent.forEach((o) => {
    const t = Array.isArray(o.tiket) ? o.tiket[0] : o.tiket;
    const w = Array.isArray(t?.wisata) ? t?.wisata[0] : t?.wisata;
    const id = isWisataAdmin ? t?.id : w?.id;
    const name = isWisataAdmin ? t?.name : w?.name;
    if (!id || !name) return;
    const row = rankMap.get(id) ?? { name, revenue: 0, tickets: 0 };
    row.revenue += Number(o.total_price);
    row.tickets += Number(o.ticket_quantity ?? 0);
    rankMap.set(id, row);
  });
  // "Terlaris" = paling banyak TIKET terjual (bukan pendapatan). Kalau jumlah
  // tiketnya sama, yang pendapatannya lebih besar di atas.
  const ranking = Array.from(rankMap.values())
    .sort((a, b) => b.tickets - a.tickets || b.revenue - a.revenue)
    .slice(0, 5);
  const maxRankTickets = ranking[0]?.tickets ?? 0;

  // Rincian status pesanan pada periode ini
  const statusCounts = Object.keys(STATUS_META).map((key) => ({
    key,
    count: inCurrent.filter((o) => o.payment_status === key).length,
  }));
  const maxStatusCount = Math.max(1, ...statusCounts.map((s) => s.count));

  // Admin Wisata belum ditugaskan ke wisata mana pun — arahkan ke halaman
  // penjelasan yang sama seperti menu Kelola Wisata, jangan tampilkan
  // dashboard kosong yang membingungkan.
  if (isWisataAdmin && !ownWisata) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <MapPinned className="h-10 w-10 text-ink/30" />
        <h1 className="mt-4 font-display text-xl font-semibold text-forest-900">
          Belum Ada Wisata yang Ditugaskan
        </h1>
        <p className="mt-2 max-w-sm text-sm text-ink/60">
          Akun Anda berperan sebagai Admin Wisata, tapi belum ditugaskan mengelola wisata mana pun.
          Hubungi Super Admin untuk menugaskan Anda ke sebuah wisata.
        </p>
      </div>
    );
  }

  const stats = [
    {
      label: `Pendapatan (${range} hari)`,
      value: formatIDR(revenueCurrent),
      icon: Wallet,
      tone: "bg-clay-50 text-clay-600",
      footer: <Trend current={revenueCurrent} previous={revenuePrevious} />,
      hint: `Total keseluruhan ${formatIDR(revenueAllTime)}`,
    },
    {
      label: `Pesanan (${range} hari)`,
      value: inCurrent.length,
      icon: Receipt,
      tone: "bg-blue-50 text-blue-600",
      footer: <Trend current={inCurrent.length} previous={inPrevious.length} />,
      hint: `${todayOrders.length} pesanan hari ini`,
    },
    {
      label: `Tiket Terjual (${range} hari)`,
      value: ticketsCurrent,
      icon: Ticket,
      tone: "bg-forest-100 text-forest-700",
      footer: <Trend current={ticketsCurrent} previous={ticketsPrevious} />,
      hint: "Dari pesanan yang sudah lunas",
    },
    isWisataAdmin && ownWisata
      ? {
          label: "Paket Tiket Aktif",
          value: ownTiketActiveCount,
          icon: MapPinned,
          tone: "bg-amber-50 text-amber-600",
          footer: (
            <span className="text-xs text-ink/50">
              Status wisata: <span className="font-medium text-forest-800">{statusLabelWisata[ownWisata.status] ?? ownWisata.status}</span>
            </span>
          ),
          hint: ownWisata.name,
        }
      : {
          label: "Wisata Aktif",
          value: wisataCount ?? 0,
          icon: Users,
          tone: "bg-amber-50 text-amber-600",
          footer: <span className="text-xs text-ink/50">{memberCount ?? 0} member terdaftar</span>,
          hint: "Wisata berstatus published",
        },
  ];

  const quickActions =
    isWisataAdmin && ownWisata
      ? [
          { href: `/admin/tiket/new?wisata=${ownWisata.id}`, label: "Tambah Paket Tiket", icon: Ticket },
          { href: `/admin/spots/${ownWisata.id}`, label: "Kelola Data Wisata", icon: Pencil },
          { href: "/admin/transactions?status=pending", label: "Verifikasi Pembayaran", icon: ShieldAlert },
          { href: "/admin/reports", label: "Lihat Laporan Lengkap", icon: FileBarChart },
        ]
      : [
          { href: "/admin/spots/new", label: "Tambah Wisata", icon: Plus },
          { href: "/admin/tiket", label: "Kelola Paket Tiket", icon: Ticket },
          { href: "/admin/transactions?status=pending", label: "Verifikasi Pembayaran", icon: ShieldAlert },
          { href: "/admin/reports", label: "Lihat Laporan Lengkap", icon: FileBarChart },
        ];

  const todayLabel = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });

  return (
    <div className="space-y-6">
      {/* Banner sambutan */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-forest-900 via-forest-800 to-forest-700 p-6 text-white shadow-lg shadow-forest-900/10 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-clay-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-forest-300/20 blur-3xl" />
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 w-full opacity-30"
          viewBox="0 0 600 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 80V45l60-25 70 22 80-34 90 38 70-22 90 30 70-20 70 24v40z" fill="#0d1e13" />
        </svg>

        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-xl">
            <p className="text-xs font-medium uppercase tracking-widest text-forest-200/80">{todayLabel}</p>
            <h1 className="mt-2 font-display !text-[2rem] font-semibold leading-tight text-white">Halo, {firstName} 👋</h1>
            <p className="mt-2 text-sm text-forest-100/85">
              {isWisataAdmin && ownWisata
                ? `Ringkasan aktivitas wisata ${ownWisata.name}.`
                : isSuperAdmin
                  ? "Ringkasan operasional Explore Malang."
                  : "Ringkasan aktivitas."}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="rounded-lg bg-white/10 px-3 py-1.5 text-sm backdrop-blur-sm">
                <span className="font-semibold text-white">{todayOrders.length}</span>{" "}
                <span className="text-forest-100/80">pesanan hari ini</span>
              </span>
              <span className="rounded-lg bg-white/10 px-3 py-1.5 text-sm backdrop-blur-sm">
                <span className="font-semibold text-white">{formatIDR(todayRevenue)}</span>{" "}
                <span className="text-forest-100/80">lunas hari ini</span>
              </span>
            </div>
          </div>

          {/* Pilihan periode */}
          <div className="flex rounded-xl bg-white/10 p-1 backdrop-blur-sm">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={r === 14 ? "/admin" : `/admin?range=${r}`}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  r === range ? "bg-white text-forest-900 shadow" : "text-forest-100 hover:bg-white/10"
                }`}
              >
                {r} hari
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Peringatan transaksi menunggu */}
      {pendingCount > 0 && (
        <Link
          href="/admin/transactions?status=pending"
          className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 transition-colors hover:bg-amber-100"
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Ada <strong>{pendingCount} transaksi</strong> menunggu verifikasi pembayaran.
          </span>
          <span className="flex shrink-0 items-center gap-1 font-medium">
            Tinjau <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      )}

      {/* Kartu statistik */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone, footer, hint }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-ink/50">{label}</p>
                <p className="mt-2 truncate font-display text-2xl font-semibold text-forest-900">{value}</p>
              </div>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
                <Icon className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-3">{footer}</div>
            <p className="mt-1 truncate text-xs text-ink/40">{hint}</p>
          </div>
        ))}
      </div>

      {/* Aksi cepat */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {quickActions.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="card flex items-center gap-2.5 p-4 text-sm font-medium text-forest-800 transition-colors hover:bg-forest-50"
          >
            <Icon className="h-4 w-4 shrink-0 text-clay-500" /> {label}
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tren pendapatan */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-medium text-forest-900">Tren Pendapatan ({range} Hari Terakhir)</h2>
            <p className="text-sm text-ink/60">
              Total <span className="font-semibold text-forest-900">{formatIDR(revenueCurrent)}</span>
            </p>
          </div>
          <div className="mt-4">
            <RevenueChart
              data={days}
              emptyLabel={
                revenueAllTime > 0
                  ? `Belum ada transaksi lunas dalam ${range} hari terakhir. Coba periode yang lebih panjang.`
                  : "Belum ada transaksi lunas."
              }
            />
          </div>
        </div>

        {/* Perlu verifikasi */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-forest-900">Perlu Diverifikasi</h2>
            {pendingCount > 0 && (
              <span className="rounded-full bg-clay-100 px-2 py-0.5 text-xs font-medium text-clay-700">
                {pendingCount}
              </span>
            )}
          </div>
          <div className="mt-3 space-y-3">
            {(pendingOrders as Order[] | null)?.map((o) => (
              <Link
                key={o.id}
                href="/admin/transactions?status=pending"
                className="block rounded border border-forest-100 p-3 text-sm hover:border-forest-300"
              >
                <p className="font-medium text-forest-900">{o.order_code}</p>
                <p className="truncate text-xs text-ink/60">
                  {o.tiket?.wisata?.name} · {o.tiket?.name}
                </p>
                <p className="mt-1 text-xs font-medium text-clay-600">{formatIDR(o.total_price)}</p>
              </Link>
            ))}
            {!pendingOrders?.length && (
              <p className="py-10 text-center text-sm text-ink/40">Tidak ada yang menunggu verifikasi 🎉</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Peringkat */}
        <div className="card p-5">
          <h2 className="flex items-center gap-2 font-medium text-forest-900">
            <Trophy className="h-4 w-4 text-clay-500" />
            {isWisataAdmin ? "Paket Tiket Terlaris" : "Wisata Terlaris"}
            <span className="text-xs font-normal text-ink/40">({range} hari)</span>
          </h2>
          <ol className="mt-4 space-y-4">
            {ranking.map((r, i) => (
              <li key={r.name}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-100 text-[11px] font-semibold text-forest-800">
                      {i + 1}
                    </span>
                    <span className="truncate font-medium text-forest-900">{r.name}</span>
                  </span>
                  <span className="shrink-0 text-xs text-ink/60">
                    <span className="font-semibold text-forest-900">{r.tickets} tiket</span> · {formatIDR(r.revenue)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-forest-50">
                  <div
                    className="h-full rounded-full bg-clay-400"
                    style={{ width: `${maxRankTickets ? Math.max(4, (r.tickets / maxRankTickets) * 100) : 0}%` }}
                  />
                </div>
              </li>
            ))}
            {!ranking.length && (
              <p className="py-8 text-center text-sm text-ink/40">Belum ada penjualan lunas pada periode ini.</p>
            )}
          </ol>
        </div>

        {/* Status pesanan */}
        <div className="card p-5">
          <h2 className="flex items-center gap-2 font-medium text-forest-900">
            <PieChart className="h-4 w-4 text-clay-500" /> Status Pesanan
            <span className="text-xs font-normal text-ink/40">({range} hari)</span>
          </h2>
          <ul className="mt-4 space-y-3.5">
            {statusCounts.map(({ key, count }) => (
              <li key={key} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 text-ink/70">{STATUS_META[key].label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-forest-50">
                  <div
                    className={`h-full rounded-full ${STATUS_META[key].bar}`}
                    style={{ width: `${count ? Math.max(4, (count / maxStatusCount) * 100) : 0}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right font-semibold text-forest-900">{count}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-ink/45">
            Tingkat pembayaran berhasil:{" "}
            <span className="font-semibold text-forest-800">
              {inCurrent.length ? Math.round((paidCurrent.length / inCurrent.length) * 100) : 0}%
            </span>{" "}
            dari {inCurrent.length} pesanan.
          </p>
        </div>
      </div>

      {/* Transaksi terbaru */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-forest-900">Transaksi Terbaru</h2>
          <Link href="/admin/transactions" className="flex items-center gap-1 text-sm font-medium text-clay-600 hover:underline">
            Lihat semua <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-forest-100 text-ink/50">
                <th className="pb-2 font-medium">Kode</th>
                <th className="pb-2 font-medium">Pembeli</th>
                <th className="pb-2 font-medium">Destinasi</th>
                <th className="pb-2 font-medium">Waktu</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {(recentOrders as Order[] | null)?.map((o) => {
                const meta = STATUS_META[o.payment_status] ?? { label: o.payment_status, badge: "bg-gray-100 text-gray-600" };
                return (
                  <tr key={o.id} className="border-b border-forest-50">
                    <td className="py-2.5 font-medium text-forest-900">{o.order_code}</td>
                    <td className="py-2.5">{o.customer_name}</td>
                    <td className="py-2.5">
                      {o.tiket?.wisata?.name} <span className="text-ink/40">· {o.tiket?.name}</span>
                    </td>
                    <td className="whitespace-nowrap py-2.5 text-ink/60">
                      {new Date(o.created_at).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Jakarta",
                      })}
                    </td>
                    <td className="py-2.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.badge}`}>{meta.label}</span>
                    </td>
                    <td className="py-2.5 text-right font-medium">{formatIDR(o.total_price)}</td>
                  </tr>
                );
              })}
              {!recentOrders?.length && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-ink/50">
                    Belum ada transaksi.
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
