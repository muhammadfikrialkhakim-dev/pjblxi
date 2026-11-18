/**
 * Lencana "Trending" — satu gaya untuk semua tempat: label hijau gelap,
 * font sama dengan navbar (Plus Jakarta Sans, semibold).
 *  - variant "corner": menempel di pojok kiri atas gambar kartu
 *    (induknya harus `relative overflow-hidden`).
 *  - variant "inline": label biasa di dekat judul.
 */
export default function TrendingBadge({
  label,
  variant = "corner",
}: {
  label: string;
  variant?: "corner" | "inline";
}) {
  const base = "bg-forest-950/90 font-sans text-sm font-semibold text-white";
  if (variant === "inline") {
    return <span className={`${base} rounded-md px-3 py-1.5`}>{label}</span>;
  }
  return <span className={`${base} absolute left-0 top-0 z-[1] rounded-br-lg px-3 py-1.5`}>{label}</span>;
}
