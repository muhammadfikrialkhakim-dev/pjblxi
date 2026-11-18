"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, UserRound, Ticket, Receipt, Wallet, Heart, Bell, LayoutDashboard } from "lucide-react";

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const CUSTOMER_GROUPS: Item[][] = [
  [{ href: "/profile", label: "Profil Saya", icon: UserRound }],
  [
    { href: "/profile/bookings", label: "Pesanan Saya", icon: Ticket },
    { href: "/profile/purchases", label: "Daftar Pembelian", icon: Receipt },
    { href: "/profile/payments", label: "Pembayaran & Refund", icon: Wallet },
    { href: "/wishlist", label: "Wishlist", icon: Heart },
  ],
  [
    { href: "/profile/notifications", label: "Pengaturan Notifikasi", icon: Bell },
  ],
];

const STAFF_GROUPS: Item[][] = [
  [
    { href: "/profile", label: "Profil Saya", icon: UserRound },
    { href: "/admin", label: "Panel Admin", icon: LayoutDashboard },
  ],
  [{ href: "/profile/notifications", label: "Pengaturan Notifikasi", icon: Bell }],
];

export default function ProfileSidebar({
  name,
  avatarUrl,
  initials,
  providerLabel,
  roleText,
  isStaff,
}: {
  name: string;
  avatarUrl?: string;
  initials: string;
  providerLabel: string;
  roleText: string;
  isStaff: boolean;
}) {
  const pathname = usePathname();
  const groups = isStaff ? STAFF_GROUPS : CUSTOMER_GROUPS;

  return (
    <aside className="card overflow-hidden lg:sticky lg:top-24">
      <div className="flex items-center gap-4 p-5">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={name}
            referrerPolicy="no-referrer"
            className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-forest-100"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-forest-100 font-display text-xl font-semibold text-forest-800 ring-2 ring-forest-50">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-semibold text-forest-900" title={name}>
            {name || "Pengguna"}
          </p>
          <p className="text-xs text-ink/50">{providerLabel}</p>
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="flex items-center gap-2 rounded-lg bg-clay-50 px-3.5 py-2.5 text-sm font-medium text-clay-700">
          <ShieldCheck className="h-4 w-4" />
          {roleText}
        </div>
      </div>

      <nav aria-label="Menu profil">
        {groups.map((group, gi) => (
          <div key={gi} className="border-t border-forest-100 p-3">
            {group.map(({ href, label, icon: Icon }) => {
              const active = href === "/profile" ? pathname === "/profile" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active ? "bg-forest-50 text-forest-900" : "text-forest-800 hover:bg-forest-50/70"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-clay-600" : "text-forest-600"}`} />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
