"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export interface HeroSlideshowImage {
  url: string;
  alt: string;
}

/**
 * Slideshow gambar latar hero — ganti gambar otomatis tiap 3 detik dengan
 * transisi fade halus. Semua gambar ditumpuk (stacked absolute) dan cuma
 * gambar yang aktif yang opacity-nya 100, sisanya 0 — jadi transisinya
 * mulus tanpa gambar "lompat" atau flash putih.
 */
export default function HeroSlideshow({ images }: { images: HeroSlideshowImage[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return; // cuma 1 gambar (atau kosong) — tidak perlu rotasi
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  if (!images.length) return null;

  return (
    <>
      {images.map((img, i) => (
        <div
          key={img.url}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={img.url}
            alt={img.alt}
            fill
            priority={i === 0}
            sizes="100vw"
            quality={90}
            className="object-cover"
          />
        </div>
      ))}
    </>
  );
}
