"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronLeft, ChevronRight, LayoutGrid, X } from "lucide-react";

/**
 * Galeri foto gaya mosaik: 1 foto besar di kiri + sampai 6 foto kecil di kanan.
 * Klik foto mana pun membuka tampilan layar penuh (lightbox) dengan tombol
 * sebelumnya/berikutnya, panah keyboard, dan Esc untuk menutup.
 * Jumlah foto sedikit pun tetap rapi (1, 2, 3, … sampai 7+ foto).
 */

const MAX_SMALL = 6;

// Kelas Tailwind harus ditulis utuh (tidak boleh dirangkai) supaya ikut terbaca.
const GRID_COLS: Record<number, string> = { 1: "grid-cols-3", 2: "grid-cols-3", 3: "grid-cols-4", 4: "grid-cols-4", 5: "grid-cols-5", 6: "grid-cols-5" };
const SPAN2: Record<number, string> = { 1: "", 2: "col-span-2", 3: "col-span-3" };

export default function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [open, setOpen] = useState<number | null>(null);
  // Lightbox dirender lewat portal ke <body>. Pembungkus halaman (.page-enter)
  // memakai animasi transform, yang membuat `position: fixed` di dalamnya
  // menempel ke pembungkus itu — bukan ke layar — sehingga lightbox terpotong,
  // tertutup navbar, dan fotonya tidak tampil. Di <body> ia selalu layar penuh.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const total = images.length;

  const close = useCallback(() => setOpen(null), []);
  const prev = useCallback(() => setOpen((i) => (i === null ? i : i === 0 ? total - 1 : i - 1)), [total]);
  const next = useCallback(() => setOpen((i) => (i === null ? i : i === total - 1 ? 0 : i + 1)), [total]);

  // Keyboard + kunci scroll halaman selama lightbox terbuka.
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close, prev, next]);

  if (!total) return null;

  const small = images.slice(1, 1 + MAX_SMALL);
  const s = small.length;
  const smallCols = s <= 2 ? 1 : s <= 4 ? 2 : 3;
  const capacity = smallCols * 2;
  const hasMore = total > 1 + MAX_SMALL;

  // Kelas grid per foto kecil: foto terakhir melebar bila jumlahnya ganjil, supaya tidak ada petak kosong.
  function smallTileClass(i: number) {
    const isLast = i === s - 1;
    if (smallCols === 1 && s === 1) return "row-span-2";
    if (isLast && s < capacity) return SPAN2[capacity - s + 1] ?? "";
    return "";
  }

  const tile = "group relative overflow-hidden bg-forest-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-clay-500";

  return (
    <div className="mt-6">
      {/* Ponsel: satu foto besar + tombol "lihat semua" */}
      <button
        type="button"
        onClick={() => setOpen(0)}
        aria-label={`Buka galeri foto ${alt}`}
        className={`${tile} block h-[240px] w-full rounded-xl sm:hidden`}
      >
        <Image src={images[0]} alt={`${alt} — foto 1`} fill priority sizes="100vw" className="object-cover" />
        {total > 1 && (
          <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white">
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden /> Lihat {total} foto
          </span>
        )}
      </button>

      {/* Tablet & desktop: mosaik */}
      <div
        className={`hidden h-[300px] gap-2 overflow-hidden rounded-xl sm:grid md:h-[340px] lg:h-[380px] ${
          s === 0 ? "grid-cols-1" : GRID_COLS[s]
        } grid-rows-2`}
      >
        <button
          type="button"
          onClick={() => setOpen(0)}
          aria-label={`Perbesar foto 1 — ${alt}`}
          className={`${tile} row-span-2 ${s === 0 ? "" : "col-span-2"}`}
        >
          <Image
            src={images[0]}
            alt={`${alt} — foto 1`}
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 60vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </button>

        {small.map((src, i) => {
          const idx = i + 1;
          const showMore = i === s - 1 && hasMore;
          return (
            <button
              key={src + idx}
              type="button"
              onClick={() => setOpen(idx)}
              aria-label={showMore ? `Lihat semua ${total} foto` : `Perbesar foto ${idx + 1} — ${alt}`}
              className={`${tile} ${smallTileClass(i)}`}
            >
              <Image
                src={src}
                alt={`${alt} — foto ${idx + 1}`}
                fill
                sizes="(min-width: 1024px) 20vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {showMore && (
                <span className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/50 text-sm font-semibold text-white transition-colors group-hover:bg-black/60">
                  <LayoutGrid className="h-4 w-4" aria-hidden /> Lihat Semua Foto
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lightbox layar penuh */}
      {mounted && open !== null && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Galeri foto ${alt}`}
          className="fixed inset-0 z-[1000] flex h-[100dvh] flex-col bg-black/95"
          onClick={close}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white" onClick={(e) => e.stopPropagation()}>
            <span className="text-sm font-medium">
              {open + 1} / {total}
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="Tutup galeri"
              className="rounded-full p-2 hover:bg-white/15"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="relative min-h-0 flex-1" onClick={(e) => e.stopPropagation()}>
            <Image
              key={images[open]}
              src={images[open]}
              alt={`${alt} — foto ${open + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Foto sebelumnya"
                  className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Foto berikutnya"
                  className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* Strip thumbnail */}
          {total > 1 && (
            <div className="flex gap-2 overflow-x-auto px-4 py-3" onClick={(e) => e.stopPropagation()}>
              {images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setOpen(i)}
                  aria-label={`Ke foto ${i + 1}`}
                  className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-md ${
                    i === open ? "ring-2 ring-white" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={src} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
