/** Area gambar kosong (belum ada foto yang diunggah admin) — polos, tanpa gambar. */
export default function ImagePlaceholder({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`absolute inset-0 bg-forest-100 ${className}`} />;
}
