"use client";

import { usePathname } from "next/navigation";

/**
 * - Menyembunyikan Navbar & Footer publik di halaman /admin/*, karena
 *   dashboard admin sudah punya sidebar navigasinya sendiri (lihat
 *   app/admin/layout.tsx). Navbar & Footer tetap dirender di server
 *   (lewat props) — komponen ini cuma memutuskan tampil/tidaknya di client
 *   berdasarkan URL saat ini.
 * - Memberi animasi fade-in halus pada konten setiap kali berpindah
 *   halaman (berlaku untuk semua halaman, publik maupun admin), lewat
 *   `key={pathname}` yang memaksa remount + class ".page-enter" di
 *   globals.css.
 */
export default function SiteChrome({
  navbar,
  footer,
  children,
}: {
  navbar: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const content = (
    <div key={pathname} className="page-enter flex flex-1 flex-col">
      {children}
    </div>
  );

  if (isAdmin) return <>{content}</>;

  return (
    <>
      {navbar}
      {content}
      {footer}
    </>
  );
}
