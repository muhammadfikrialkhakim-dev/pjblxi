"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Link navigasi admin yang menandai halaman yang sedang aktif.
 * variant "side" = item sidebar (desktop), "pill" = tombol geser di bilah atas (HP).
 */
export default function AdminNavLink({
  href,
  variant = "side",
  children,
}: {
  href: string;
  variant?: "side" | "pill";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

  if (variant === "pill") {
    return (
      <Link
        href={href}
        className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
          active ? "bg-clay-500 text-white" : "bg-forest-50 text-forest-800"
        }`}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-white/10 font-semibold text-white shadow-inner"
          : "text-forest-100/70 hover:bg-white/5 hover:text-white"
      }`}
    >
      {active && <span className="absolute inset-y-2 -left-4 w-1 rounded-r bg-clay-400" />}
      {children}
    </Link>
  );
}
