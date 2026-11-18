import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  MapPinned,
  Ticket,
  Tag,
  Percent,
  Receipt,
  FileBarChart,
  ShieldCheck,
  UserCog,
  Settings,
  Compass,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/logout/actions";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import AdminNavLink from "@/components/AdminNavLink";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/spots", label: "Kelola Wisata", icon: MapPinned },
  { href: "/admin/tiket", label: "Kelola Tiket", icon: Ticket },
  { href: "/admin/categories", label: "Kelola Kategori", icon: Tag },
  { href: "/admin/promos", label: "Kelola Promo", icon: Percent },
  { href: "/admin/transactions", label: "Transaksi", icon: Receipt },
  { href: "/admin/reports", label: "Laporan", icon: FileBarChart },
];

// Admin Wisata hanya mengelola SATU wisata yang ditugaskan padanya, jadi
// sidebar-nya jauh lebih ringkas — tidak ada Kelola Kategori, Kelola
// Member, maupun Pengaturan. Dashboard-nya sendiri (di /admin) sudah
// dipersempit datanya cuma untuk wisata miliknya sendiri.
const wisataAdminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/spots", label: "Kelola Wisata", icon: MapPinned },
  { href: "/admin/tiket", label: "Kelola Tiket", icon: Ticket },
  { href: "/admin/promos", label: "Kelola Promo", icon: Percent },
  { href: "/admin/transactions", label: "Transaksi", icon: Receipt },
  { href: "/admin/reports", label: "Laporan", icon: FileBarChart },
];

const superAdminNavItems = [
  { href: "/admin/super/admins", label: "Kelola Data Admin", icon: ShieldCheck },
  { href: "/admin/super/users", label: "Kelola Data User", icon: UserCog },
  { href: "/admin/settings", label: "Pengaturan Situs", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/admin");

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  const isSuperAdmin = profile?.role === "super_admin";
  const isWisataAdmin = profile?.role === "admin_wisata";

  // Role 'admin' (biasa, bukan Super Admin ataupun Admin Wisata) TIDAK lagi
  // punya menu apa pun di panel ini — semua fitur yang sebelumnya dibagi
  // (Kelola Wisata, Kelola Tiket, Kelola Kategori, Kelola Member, Transaksi,
  // Laporan, dst) sekarang eksklusif Super Admin. Role 'admin' sengaja
  // TIDAK dihapus dari sistem (akun & datanya tetap ada), cuma akses ke
  // panel admin ini yang dicabut total. Middleware juga menutup jalur URL
  // langsungnya (lihat middleware.ts); redirect di sini sebagai jaga-jaga
  // kedua kalau ada yang lolos dari middleware.
  if (profile?.role === "admin") redirect("/");

  // Kalau Admin Wisata, ambil nama wisata yang ditugaskan padanya supaya
  // label di sidebar jelas menyebut wisata mana yang dia pegang (mis.
  // "Admin Wisata Agro Wisata"), bukan cuma "Admin Wisata" generik yang
  // tidak menunjukkan wisata siapa yang sedang dikelola.
  let ownWisataName: string | null = null;
  if (isWisataAdmin) {
    const { data: ownWisata } = await supabase.from("wisata").select("name").eq("admin_id", user.id).maybeSingle();
    ownWisataName = ownWisata?.name ?? null;
  }

  const roleLabel = isSuperAdmin ? "Super Admin" : "Admin Wisata";
  const items = isWisataAdmin ? wisataAdminNavItems : navItems;
  const allItems = [...items, ...(isSuperAdmin ? superAdminNavItems : [])];

  const displayName = profile?.full_name ?? user.email ?? "Admin";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex min-h-screen bg-sand print:block print:min-h-0 print:bg-white">
      {/* Sidebar gelap — hanya desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between overflow-y-auto bg-gradient-to-b from-forest-950 via-forest-900 to-forest-950 px-4 py-6 text-forest-100 md:flex print:!hidden">
        <div>
          <Link href="/admin" className="mb-8 flex items-center gap-3 px-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-clay-500 shadow-lg shadow-clay-500/30">
              <Compass className="h-5 w-5 text-white" strokeWidth={2.2} />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-lg font-semibold text-white">Explore Malang</span>
              <span className="block text-[11px] uppercase tracking-widest text-forest-300/70">Admin Panel</span>
            </span>
          </Link>

          <nav className="space-y-1">
            {allItems.map(({ href, label, icon: Icon }) => (
              <AdminNavLink key={href} href={href}>
                <Icon className="h-[18px] w-[18px]" /> {label}
              </AdminNavLink>
            ))}
          </nav>
        </div>

        {/* Kartu akun */}
        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-clay-500 text-sm font-semibold text-white">
              {initials || "A"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white" title={displayName}>
                {displayName}
              </p>
              <p className="truncate text-xs text-forest-300/80" title={ownWisataName ?? roleLabel}>
                {isWisataAdmin && ownWisataName ? ownWisataName : roleLabel}
              </p>
            </div>
          </div>
          <form action={logout} className="mt-3">
            <ConfirmSubmitButton
              icon="question"
              danger={false}
              dialogTitle="Keluar dari akun?"
              message="Anda akan keluar dari panel admin. Anda bisa masuk kembali kapan saja."
              confirmText="Ya, keluar"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500/80"
            >
              <LogOut className="h-4 w-4" /> Keluar
            </ConfirmSubmitButton>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Bilah atas desktop */}
        <header className="sticky top-0 z-30 hidden items-center justify-between border-b border-forest-100 bg-white/80 px-8 py-3.5 backdrop-blur md:flex print:!hidden">
          <div className="flex items-center gap-2 text-sm text-ink/60">
            <span className="rounded-full bg-clay-50 px-2.5 py-1 text-xs font-semibold text-clay-700">{roleLabel}</span>
            {isWisataAdmin && ownWisataName && <span className="font-medium text-forest-900">{ownWisataName}</span>}
          </div>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 rounded-lg border border-forest-200 px-3.5 py-2 text-sm font-medium text-forest-800 transition-colors hover:bg-forest-50"
          >
            <ExternalLink className="h-4 w-4" /> Lihat Situs
          </Link>
        </header>

        {/* Bilah navigasi untuk HP/tablet — sidebar disembunyikan di bawah md */}
        <div className="sticky top-0 z-30 border-b border-forest-100 bg-white md:hidden print:!hidden">
          <div className="flex items-center justify-between px-4 pt-3">
            <Link href="/admin" className="flex items-center gap-2 font-display text-base font-semibold text-forest-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-clay-500">
                <Compass className="h-4 w-4 text-white" />
              </span>
              Admin Panel
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/" target="_blank" className="text-xs font-medium text-forest-800">
                Lihat Situs
              </Link>
              <form action={logout}>
                <ConfirmSubmitButton
                  icon="question"
                  danger={false}
                  dialogTitle="Keluar dari akun?"
                  message="Anda akan keluar dari panel admin. Anda bisa masuk kembali kapan saja."
                  confirmText="Ya, keluar"
                  className="flex items-center gap-1.5 text-xs font-medium text-red-600"
                >
                  <LogOut className="h-3.5 w-3.5" /> Keluar
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto px-4 py-3">
            {allItems.map(({ href, label, icon: Icon }) => (
              <AdminNavLink key={href} href={href} variant="pill">
                <Icon className="h-3.5 w-3.5" /> {label}
              </AdminNavLink>
            ))}
          </div>
        </div>

        <main className="admin-content mx-auto w-full max-w-[1400px] flex-1 px-5 py-6 md:px-8 md:py-8 print:!max-w-none print:!p-0">{children}</main>
      </div>
    </div>
  );
}
