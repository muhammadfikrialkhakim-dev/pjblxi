"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleWishlist } from "@/app/wishlist/actions";

const SPARKS = [0, 60, 120, 180, 240, 300];

export default function WishlistButton({
  wisataId,
  wisataSlug,
  initial,
  size = "sm",
}: {
  wisataId: string;
  wisataSlug: string;
  initial: boolean;
  size?: "sm" | "lg";
}) {
  const [active, setActive] = useState(initial);
  // "add"/"remove" menentukan animasi; `tick` dipakai sebagai key supaya
  // animasi diputar ulang setiap kali tombol ditekan.
  const [fx, setFx] = useState<{ type: "add" | "remove"; tick: number } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function onClick(e: React.MouseEvent) {
    // Tombol ini ada di dalam kartu yang berupa <Link> — jangan ikut navigasi.
    e.preventDefault();
    e.stopPropagation();

    // Optimistic: ubah tampilan & mainkan animasi langsung, tanpa menunggu server.
    const previous = active;
    const next = !previous;
    setActive(next);
    setFx((f) => ({ type: next ? "add" : "remove", tick: (f?.tick ?? 0) + 1 }));

    start(async () => {
      const res = await toggleWishlist(wisataId, wisataSlug);
      if (res.ok) {
        setActive(res.wishlisted);
      } else {
        // Gagal / belum login: kembalikan ke kondisi semula.
        setActive(previous);
        setFx(null);
        if ("needsLogin" in res) {
          router.push(`/login?redirectTo=${encodeURIComponent(`/destinations/${wisataSlug}`)}`);
        }
      }
    });
  }

  const big = size === "lg";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? "Hapus dari wishlist" : "Simpan ke wishlist"}
      className={
        big
          ? "inline-flex items-center gap-2 rounded border border-forest-200 bg-white px-3.5 py-2 text-sm font-medium text-forest-800 transition-colors hover:bg-forest-50 active:scale-[0.97]"
          : "flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow transition-transform hover:bg-white active:scale-90"
      }
    >
      <span className="relative inline-flex h-4 w-4 items-center justify-center">
        {/* Cincin & percikan hanya muncul saat ditambahkan ke wishlist */}
        {fx?.type === "add" && (
          <span key={`fx-${fx.tick}`} aria-hidden className="pointer-events-none absolute inset-0">
            <span className="wl-ring absolute inset-0 rounded-full bg-[#ff2d4f]/50" />
            {SPARKS.map((angle) => (
              <span
                key={angle}
                className="wl-spark absolute left-1/2 top-1/2 -ml-[2px] -mt-[2px] h-1 w-1 rounded-full bg-[#ff2d4f]"
                style={{ ["--a" as string]: `${angle}deg` }}
              />
            ))}
          </span>
        )}
        <Heart
          key={fx ? `heart-${fx.tick}` : "heart"}
          className={`h-4 w-4 transition-colors duration-200 ${
            fx ? (fx.type === "add" ? "wl-pop" : "wl-unpop") : ""
          } ${active ? "fill-[#ff2d4f] text-[#ff2d4f] drop-shadow-[0_1px_4px_rgba(255,45,79,0.5)]" : "text-forest-700"}`}
        />
      </span>
      {big && (active ? "Tersimpan" : "Simpan ke Wishlist")}
    </button>
  );
}
