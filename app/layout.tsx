import type { Metadata } from "next";
import { Suspense } from "react";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SiteChrome from "@/components/SiteChrome";
import FlashAlert from "@/components/FlashAlert";
import { getLocale } from "@/lib/i18n/locale";

// Font dimuat lewat next/font (self-hosted, di-bundle saat build) alih-alih
// @import ke Google Fonts di CSS. Sebelumnya font eksternal itu artinya:
// (1) ada request jaringan tambahan ke fonts.googleapis.com yang bisa
// lambat/gagal dan bikin teks sempat tampil pakai font fallback yang jelek
// (flash of unstyled text), dan (2) tidak reliable kalau koneksi ke Google
// Fonts diblokir. next/font meng-host filenya sendiri dari domain yang sama,
// jadi selalu tampil konsisten dan lebih cepat.
//
// Fraunces (serif ekspresif) dipertahankan untuk judul/heading karena sudah
// pas untuk kesan "premium & hangat" ala brand travel/wisata. Body font
// diganti dari Inter (sudah sangat umum dipakai di mana-mana, terkesan
// generik) ke Plus Jakarta Sans — sama-sama sangat mudah dibaca, tapi
// bentuk hurufnya sedikit lebih hangat & khas, lebih pas untuk situs
// pemesanan tiket wisata yang ingin terasa ramah, bukan situs korporat.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Explore Malang — Pemesanan Tiket Wisata",
  description:
    "Platform pemesanan tiket wisata untuk region Malang Raya. Dibangun untuk agen travel dan wisatawan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  return (
    <html lang={locale} className={`${fraunces.variable} ${plusJakarta.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <SiteChrome navbar={<Navbar />} footer={<Footer />}>
          <main className="flex-1">{children}</main>
        </SiteChrome>
        {/* Dialog hasil aksi (?flash=…) untuk seluruh situs, publik maupun admin. */}
        <Suspense fallback={null}>
          <FlashAlert />
        </Suspense>
      </body>
    </html>
  );
}
