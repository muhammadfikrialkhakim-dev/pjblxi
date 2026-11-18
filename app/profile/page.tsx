import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ChevronRight, Heart, LayoutDashboard, LogOut, Receipt, ShieldCheck, UserCog } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "@/app/profile/actions";
import { logout } from "@/app/logout/actions";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import DomicileField from "@/components/DomicileField";
import PasswordForm from "@/components/PasswordForm";

export const dynamic = "force-dynamic";

const roleLabel: Record<string, string> = {
  customer: "Pelanggan",
  admin: "Admin",
  admin_wisata: "Admin Wisata",
  super_admin: "Super Admin",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { tab?: string; saved?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/profile");

  // select("*") supaya halaman tetap jalan walau kolom phone/city belum dimigrasi
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  const role: string = profile?.role ?? "customer";
  const isStaff = role === "admin" || role === "admin_wisata" || role === "super_admin";
  const fullName: string = profile?.full_name ?? user.email ?? "Pengguna";
  const initials =
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w: string) => w[0]?.toUpperCase())
      .join("") || "U";

  const provider = user.app_metadata?.provider === "google" ? "Google" : "Email";
  const memberSince = new Date(user.created_at).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const tab = searchParams.tab === "security" ? "security" : "account";

  const menu = [
    ...(!isStaff ? [{ href: "/account", label: "Pesanan Saya", Icon: Receipt }] : []),
    { href: "/wishlist", label: "Wishlist", Icon: Heart },
    { href: "/profile", label: "Pengaturan Akun", Icon: UserCog, active: true },
    ...(isStaff ? [{ href: "/admin", label: "Panel Admin", Icon: LayoutDashboard }] : []),
  ];

  const label = "mb-1.5 block text-sm font-medium text-ink/70";
  const field = "input-field rounded-lg py-3";

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="grid items-start gap-x-8 gap-y-6 lg:grid-cols-[300px_1fr]">
        {/* Kartu akun */}
        <aside className="card overflow-hidden lg:col-start-1 lg:row-start-2">
          <div className="p-5">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-forest-100 font-display text-xl font-semibold text-forest-800 ring-4 ring-white shadow">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-semibold text-forest-900" title={fullName}>
                  {fullName}
                </p>
                <p className="text-sm text-ink/55">{provider}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-gradient-to-r from-clay-500 to-clay-400 px-4 py-3 text-sm font-medium text-white">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> {roleLabel[role] ?? role} · sejak {memberSince}
              </span>
              <ChevronRight className="h-4 w-4 opacity-80" />
            </div>
          </div>

          <nav className="border-t border-forest-100 p-2">
            {menu.map(({ href, label: text, Icon, active }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium transition-colors ${
                  active ? "bg-forest-50 text-forest-900" : "text-ink/75 hover:bg-forest-50 hover:text-forest-900"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-clay-500" : "text-clay-500/80"}`} /> {text}
              </Link>
            ))}
          </nav>

          <form action={logout} className="border-t border-forest-100 p-2">
            <ConfirmSubmitButton
              icon="question"
              danger={false}
              dialogTitle="Keluar dari akun?"
              message="Anda akan keluar dari akun ini. Anda bisa masuk kembali kapan saja."
              confirmText="Ya, keluar"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" /> Keluar
            </ConfirmSubmitButton>
          </form>
        </aside>

        {/* Judul + tab: baris 1, mulai dari sisi kiri, supaya kartu akun (kiri) dan kartu
            konten (kanan) sama-sama mulai di baris 2 dan sejajar di atas. */}
        <div className="min-w-0 max-lg:order-first lg:col-span-2 lg:col-start-1 lg:row-start-1">
          <h1 className="font-display text-3xl font-semibold leading-none text-forest-900">Pengaturan</h1>

          <div className="mt-6 flex gap-8 border-b-2 border-forest-100">
            {[
              { key: "account", label: "Informasi Akun", href: "/profile" },
              { key: "security", label: "Kata Sandi & Keamanan", href: "/profile?tab=security" },
            ].map((t) => (
              <Link
                key={t.key}
                href={t.href}
                className={`-mb-0.5 border-b-[3px] px-0 py-3.5 text-[15px] font-semibold transition-colors ${
                  tab === t.key
                    ? "border-clay-500 text-clay-600"
                    : "border-transparent text-ink/55 hover:text-forest-800"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Kartu konten */}
        <div className="min-w-0 lg:col-start-2 lg:row-start-2">
          <div className="card overflow-hidden">
            <div className="border-b border-forest-100 px-6 py-5">
              <h2 className="font-display text-xl font-semibold text-forest-900">
                {tab === "account" ? "Data Pribadi" : "Ubah Kata Sandi"}
              </h2>
            </div>

            <div className="px-6 py-6">
              {tab === "account" ? (
                <form action={updateProfile} className="space-y-5">
                  {searchParams.saved && (
                    <p className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                      <CheckCircle2 className="h-4 w-4" /> Perubahan berhasil disimpan.
                    </p>
                  )}

                  <div>
                    <label className={label} htmlFor="full_name">Nama Lengkap</label>
                    <input id="full_name" name="full_name" required defaultValue={profile?.full_name ?? ""} className={field} />
                    <p className="mt-1.5 text-sm text-ink/50">Nama lengkap juga akan tampil sebagai nama profil Anda.</p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className={label} htmlFor="email">Email</label>
                      <input id="email" value={user.email ?? ""} disabled className={`${field} bg-forest-50/60 text-ink/60`} />
                      <p className="mt-1.5 text-sm text-ink/50">Email tidak dapat diubah.</p>
                    </div>
                    <div>
                      <label className={label} htmlFor="role">Peran</label>
                      <input id="role" value={roleLabel[role] ?? role} disabled className={`${field} bg-forest-50/60 text-ink/60`} />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className={label} htmlFor="phone">Nomor Telepon</label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        defaultValue={profile?.phone ?? ""}
                        placeholder="mis. 081234567890"
                        className={field}
                      />
                    </div>
                  </div>

                  <DomicileField defaultValue={profile?.city ?? null} labelClass={label} fieldClass={field} />

                  <div className="flex justify-end pt-2">
                    <button type="submit" className="btn-primary rounded-lg px-10">
                      Simpan
                    </button>
                  </div>
                </form>
              ) : (
                <div className="max-w-xl">
                  {provider === "Google" && (
                    <p className="mb-5 rounded-lg bg-forest-50 px-4 py-3 text-sm text-forest-800">
                      Akun ini masuk dengan Google. Anda tetap bisa menyetel kata sandi di bawah agar juga bisa masuk
                      dengan email.
                    </p>
                  )}
                  <PasswordForm />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
