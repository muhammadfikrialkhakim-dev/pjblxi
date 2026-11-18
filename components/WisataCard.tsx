import { Wisata, averageRating } from "@/lib/types";
import DestinationCard from "@/components/DestinationCard";

/**
 * Kartu wisata untuk homepage & wishlist. Tampilannya sama persis dengan
 * kartu di halaman Destinasi (DestinationCard) supaya font, lencana, lokasi,
 * rating, dan harga seragam di seluruh situs. Rating dihitung dari relasi
 * `ulasan(rating)` kalau query-nya menyertakan itu.
 */
export default function WisataCard({
  wisata,
  isWishlisted = false,
  categoryName = null,
}: {
  wisata: Wisata & { ulasan?: { rating: number }[] };
  isWishlisted?: boolean;
  categoryName?: string | null;
}) {
  const ulasan = wisata.ulasan ?? [];
  return (
    <DestinationCard
      wisata={wisata}
      categoryName={categoryName}
      rating={averageRating(ulasan)}
      reviewCount={ulasan.length}
      isWishlisted={isWishlisted}
    />
  );
}
