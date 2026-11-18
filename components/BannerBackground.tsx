import Image from "next/image";

/**
 * Gambar latar banner + lapisan gelap supaya teks putih tetap terbaca.
 * Letakkan di dalam <section className="relative overflow-hidden ..."> setelah
 * hiasan lain, dan sebelum kontennya (konten harus `relative`).
 * Tanpa gambar, komponen ini tidak menampilkan apa-apa dan gradasi bawaan terlihat.
 */
export default function BannerBackground({ image }: { image?: string | null }) {
  if (!image) return null;
  return (
    <>
      <Image src={image} alt="" fill priority sizes="100vw" quality={90} className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-forest-950/85 via-forest-950/55 to-forest-950/65" />
    </>
  );
}
