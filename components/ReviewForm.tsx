"use client";

import { useState } from "react";
import { Star, LogIn } from "lucide-react";
import { submitReview } from "@/app/destinations/[slug]/actions";

export default function ReviewForm({
  wisataId,
  wisataSlug,
  isLoggedIn,
  hasPurchased,
  existingRating,
}: {
  wisataId: string;
  wisataSlug: string;
  isLoggedIn: boolean;
  hasPurchased: boolean;
  existingRating?: { rating: number; komentar: string | null } | null;
}) {
  const [rating, setRating] = useState(existingRating?.rating ?? 0);
  const [hovered, setHovered] = useState(0);

  if (!isLoggedIn) {
    return (
      <a
        href={`/login?redirectTo=${encodeURIComponent(`/destinations/${wisataSlug}`)}`}
        className="btn-secondary inline-flex"
      >
        <LogIn className="h-4 w-4" /> Masuk untuk memberi penilaian
      </a>
    );
  }

  if (!hasPurchased) {
    return (
      <p className="rounded border border-forest-100 bg-forest-50 px-4 py-3 text-sm text-ink/70">
        Ulasan hanya bisa diberikan oleh pengunjung yang sudah membeli dan membayar tiket wisata ini.
      </p>
    );
  }

  return (
    <form action={submitReview} className="card p-4">
      <input type="hidden" name="wisata_id" value={wisataId} />
      <input type="hidden" name="wisata_slug" value={wisataSlug} />
      <input type="hidden" name="rating" value={rating} />

      <p className="text-sm font-medium text-forest-900">
        {existingRating ? "Perbarui penilaian Anda" : "Beri penilaian untuk wisata ini"}
      </p>

      <div className="mt-2 flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const starValue = i + 1;
          const active = (hovered || rating) >= starValue;
          return (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHovered(starValue)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(starValue)}
              aria-label={`Beri ${starValue} bintang`}
            >
              <Star className={`h-6 w-6 ${active ? "fill-clay-500 text-clay-500" : "text-forest-200"}`} />
            </button>
          );
        })}
      </div>

      <textarea
        name="komentar"
        rows={3}
        defaultValue={existingRating?.komentar ?? ""}
        placeholder="Ceritakan pengalaman Anda (opsional)..."
        className="input-field mt-3"
      />

      <button type="submit" disabled={rating === 0} className="btn-primary mt-3">
        {existingRating ? "Perbarui Ulasan" : "Kirim Ulasan"}
      </button>
    </form>
  );
}
