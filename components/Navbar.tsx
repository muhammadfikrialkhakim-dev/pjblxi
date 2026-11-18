import Link from "next/link";
import { Compass, LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/logout/actions";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import UserMenu from "@/components/UserMenu";
import NavbarShell from "@/components/NavbarShell";
import NavLinks from "@/components/NavLinks";

export default async function Navbar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { full_name: string | null; role: string } | null = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
    profile = data;
  }

  const isStaff = profile?.role === "admin" || profile?.role === "admin_wisata" || profile?.role === "super_admin";
  const locale = getLocale();
  const t = getDictionary(locale).nav;

  return (
    <NavbarShell>
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="group/logo flex items-center gap-2 font-display text-lg font-semibold text-forest-900 group-data-[transparent=true]:text-white">
          <Compass className="h-5 w-5 text-clay-500 transition-transform duration-700 ease-out group-hover/logo:rotate-[360deg]" strokeWidth={2.2} />
          Explore Malang
        </Link>
        <NavLinks
          items={[
            { href: "/", label: t.home, match: "exact" },
            { href: "/categories", label: t.categories, match: "prefix" },
            { href: "/destinations", label: t.destinations, match: "prefix" },
            { href: "/promo", label: t.promos, match: "prefix" },
          ]}
        />

        <div className="flex items-center gap-3">
          {!user && (
            <Link href="/login" className="rounded-full px-4 py-1.5 text-sm font-semibold text-forest-800 ring-1 ring-forest-200 transition-all duration-300 hover:bg-forest-800 hover:text-white hover:ring-forest-800 group-data-[transparent=true]:text-white group-data-[transparent=true]:ring-white/50 group-data-[transparent=true]:hover:bg-white group-data-[transparent=true]:hover:text-forest-900">
              {t.login}
            </Link>
          )}

          {user && (
            <>
              {isStaff && (
                <Link
                  href="/admin"
                  className="hidden items-center gap-1.5 text-sm font-medium text-forest-800 hover:underline sm:flex group-data-[transparent=true]:text-white"
                >
                  <LayoutDashboard className="h-4 w-4" /> {t.adminPanel}
                </Link>
              )}
              <UserMenu
                name={profile?.full_name ?? user.email ?? ""}
                isStaff={isStaff}
                labels={{
                  profile: t.profile,
                  myOrders: t.myOrders,
                  wishlist: t.wishlist,
                  adminPanel: t.adminPanel,
                  logout: t.logout,
                  logoutConfirm: {
                    title: t.logoutConfirmTitle,
                    text: t.logoutConfirmText,
                    yes: t.logoutConfirmYes,
                    cancel: t.logoutCancel,
                  },
                }}
                logoutAction={logout}
              />
            </>
          )}

          <LanguageSwitcher currentLocale={locale} />
        </div>
      </div>
    </NavbarShell>
  );
}
