"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Pembungkus <header> navbar.
 * - Selalu menempel di atas layar saat halaman di-scroll (sticky/fixed).
 * - Di homepage ("/"): navbar transparan & mengambang di atas gambar hero
 *   (teks putih), lalu berubah jadi putih solid + bayangan begitu pengguna
 *   scroll ke bawah. Di halaman lain: langsung putih solid.
 * Warna anak-anaknya mengikuti lewat `group-data-[transparent=true]:...`.
 */
export default function NavbarShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  const transparent = isHome && !scrolled;

  return (
    <header
      data-transparent={transparent}
      className={`nav-slide-in group z-50 w-full print:hidden transition-[background-color,box-shadow,border-color] duration-300 ${
        isHome ? "fixed inset-x-0 top-0" : "sticky top-0"
      } ${
        transparent
          ? "border-b border-transparent bg-transparent"
          : "border-b border-forest-100 bg-white/95 shadow-sm backdrop-blur"
      }`}
    >
      {children}
    </header>
  );
}
