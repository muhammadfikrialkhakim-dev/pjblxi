import Image from "next/image";
import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { Wisata, lowestPrice, formatIDR, uploadedImage } from "@/lib/types";
import TrendingBadge from "@/components/TrendingBadge";
import WishlistButton from "@/components/WishlistButton";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

/**
 * Kartu wisata gaya marketplace untuk halaman Destinasi: gambar besar dengan
 * lencana gelap di kiri atas (kategori / Trending), judul, baris info
 * (lokasi + rating), dan harga oranye di bawah.
 */
export default function DestinationCard({
  wisata,
  categoryName,
  rating,
  reviewCount,
  isWishlisted = false,
}: {
  wisata: Wisata;
  categoryName?: string | null;
  rating: number | null;
  reviewCount: number;
  isWishlisted?: boolean;
}) {
  const t = getDictionary(getLocale()).wisataCard;
  const price = lowestPrice(wisata.tiket);
  const hasPrice = price != null && Number.isFinite(price);
  const cover = uploadedImage(wisata.cover_image_url);
  const badge = wisata.is_trending ? t.trending : categoryName;

  return (
    <Link
      href={`/destinations/${wisata.slug}`}
      className="group block overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-forest-100 transition-shadow hover:shadow-lg"
    >
      <div className="relative h-52 w-full overflow-hidden bg-forest-100">
        {cover ? (
          <Image
            src={cover}
            alt={wisata.name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <ImagePlaceholder />
        )}
        {badge && <TrendingBadge label={badge} />}
        <div className="absolute right-3 top-3 z-10">
          <WishlistButton wisataId={wisata.id} wisataSlug={wisata.slug} initial={isWishlisted} />
        </div>
      </div>

      <div className="p-4">
        <h3 className="truncate font-display text-lg font-semibold text-forest-900">{wisata.name}</h3>

        <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-ink/60">
          <span className="flex min-w-0 items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-clay-500" />
            <span className="truncate">{wisata.location ?? "Malang"}</span>
          </span>
          {rating != null ? (
            <span className="flex shrink-0 items-center gap-1 font-medium text-forest-900">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {rating.toFixed(1)}
              <span className="font-normal text-ink/50">({reviewCount})</span>
            </span>
          ) : (
            <span className="shrink-0 text-ink/40">{t.noReviews}</span>
          )}
        </div>

        <div className="mt-3">
          {hasPrice ? (
            <>
              <p className="text-xs text-ink/50">{t.fromLabel}</p>
              <p className="text-xl font-bold text-clay-500">{formatIDR(price!)}</p>
            </>
          ) : (
            <p className="text-sm font-semibold text-forest-800">{t.contactUs}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
