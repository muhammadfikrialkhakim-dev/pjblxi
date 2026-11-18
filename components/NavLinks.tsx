"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavLinkItem {
  href: string;
  label: string;
  /** "exact" = hanya persis path ini, "prefix" = path ini dan turunannya, "none" = tidak pernah ditandai aktif */
  match?: "exact" | "prefix" | "none";
}

/**
 * Menu utama navbar dengan animasi:
 *  - garis bawah yang meluncur dari kiri saat hover,
 *  - garis tetap terlihat pada halaman yang sedang aktif,
 *  - muncul berurutan (stagger) saat halaman dimuat.
 * Warna garis mengikuti mode navbar (putih saat transparan, oranye saat solid).
 */
export default function NavLinks({ items }: { items: NavLinkItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-8 text-sm font-medium text-ink/70 group-data-[transparent=true]:text-white/90 md:flex">
      {items.map((item, i) => {
        const match = item.match ?? "exact";
        const active =
          match === "exact" ? pathname === item.href : match === "prefix" ? pathname.startsWith(item.href) : false;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            style={{ animationDelay: `${250 + i * 90}ms` }}
            className={`nav-item-in group/link relative py-1.5 transition-colors ${
              active
                ? "text-forest-900 group-data-[transparent=true]:text-white"
                : "hover:text-forest-900 group-data-[transparent=true]:hover:text-white"
            }`}
          >
            {item.label}
            <span
              className={`absolute inset-x-0 -bottom-0.5 h-0.5 origin-left rounded-full bg-clay-500 transition-transform duration-300 ease-out group-data-[transparent=true]:bg-white group-hover/link:scale-x-100 ${
                active ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
