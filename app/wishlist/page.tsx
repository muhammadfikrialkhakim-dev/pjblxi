import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart, Compass, Wallet, Star, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import WisataCard from "@/components/WisataCard";
import { Category, Wisata, lowestPrice, averageRating, formatIDR } from "@/lib/types";
import { getLocale } from "@/lib/i18n/locale";
import { translateCategoryName } from "@/lib/i18n/dictionary";
import BannerBackground from "@/components/BannerBackground";
import { getPageBanners } from "@/lib/page-banners";

export const dynamic = "force-dynamic";

type WishWisata = Wisata & { ulasan?: { rating: number }[] };

const SORTS = [
  { value: "", label: "Terakhir disimpan" },
  { value: "price", label: "Harga terendah" },
  { value: "rating", label: "Rating tertinggi" },
] as const;

export default async function WishlistPage({ searchParams }: { searchParams: { sort?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/wishlist");

  const locale = getLocale();
  const banners = await getPageBanners();

  const [{ data }, { data: categoryRows }] = await Promise.all([
    supabase
      .from("wishlist")
      .select("created_at, wisata:wisata(*, tiket(*), ulasan(rating))")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("*"),
  ]);

  const categoryById = new Map(((categoryRows as Category[] | null) ?? []).map((c) => [c.id, c]));

  // Urutan awal = yang terakhir disimpan di paling atas (sesuai query).
  let list = ((data ?? []) as unknown as { wisata: WishWisata | null }[])
    .map((r) => r.wisata)
    .filter((w): w is WishWisata => !!w && w.status === "published");

  const priceOf = (w: WishWisata) => {
    const p = lowestPrice(w.tiket);
    return p !== null && Number.isFinite(p) ? p : null;
  };

  const sort = searchParams.sort === "price" || searchParams.sort === "rating" ? searchParams.sort : "";
  if (sort === "price") {
    list = [...list].sort((a, b) => (priceOf(a) ?? Infinity) - (priceOf(b) ?? Infinity));
  } else if (sort === "rating") {
    list = [...list].sort((a, b) => (averageRating(b.ulasan) ?? 0) - (averageRating(a.ulasan) ?? 0));
  }

  const prices = list.map(priceOf).filter((p): p is number => p !== null);
  const ratings = list.map((w) => averageRating(w.ulasan)).filter((r): r is number => r !== null);
  const cheapest = prices.length ? Math.min(...prices) : null;
  const bestRating = ratings.length ? Math.max(...ratings) : null;

  const stats = [
    { Icon: Heart, label: "Tersimpan", value: `${list.length} wisata` },
    ...(cheapest !== null ? [{ Icon: Wallet, label: "Harga termurah", value: formatIDR(cheapest) }] : []),
    ...(bestRating !== null ? [{ Icon: Star, label: "Rating tertinggi", value: bestRating.toFixed(1) }] : []),
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-forest-900 via-forest-800 to-forest-700 py-7 text-white sm:py-9">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-[#ff2d4f]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-clay-400/20 blur-3xl" />
        {/* Hati melayang sebagai hiasan */}
        <Heart className="heart-float pointer-events-none absolute right-[12%] top-4 hidden h-7 w-7 fill-[#ff2d4f]/70 text-[#ff2d4f]/70 sm:block" />
        <Heart
          className="heart-float pointer-events-none absolute right-[24%] top-12 hidden h-5 w-5 fill-[#ff2d4f]/50 text-[#ff2d4f]/50 sm:block"
          style={{ animationDelay: "1.2s" }}
        />
        <Heart
          className="heart-float pointer-events-none absolute right-[6%] top-14 hidden h-5 w-5 fill-white/30 text-white/30 sm:block"
          style={{ animationDelay: "2.1s" }}
        />

        <BannerBackground image={banners.wishlist} />
        <div className="container-page relative">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
              <Heart className="h-5 w-5 fill-[#ff2d4f] text-[#ff2d4f] drop-shadow-[0_2px_8px_rgba(255,45,79,0.6)]" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">Wishlist Saya</h1>
              <p className="mt-0.5 max-w-xl text-sm text-forest-100/85">
                Simpan tempat impian Anda dan pesan tiketnya kapan saja.
              </p>
            </div>
          </div>

          {list.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2.5">
              {stats.map(({ Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 rounded-lg bg-white/10 px-3 py-2 ring-1 ring-white/15 backdrop-blur-sm"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10">
                    <Icon className="h-4 w-4 text-clay-300" />
                  </span>
                  <div>
                    <p className="text-[11px] leading-tight text-forest-100/75">{label}</p>
                    <p className="text-sm font-semibold leading-tight text-white">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="container-page py-8">
        {list.length > 0 ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-ink/70">{list.length} wisata tersimpan</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-ink/50">Urutkan:</span>
                {SORTS.map((o) => (
                  <Link
                    key={o.value || "recent"}
                    href={o.value ? `/wishlist?sort=${o.value}` : "/wishlist"}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                      sort === o.value ? "bg-clay-500 text-white" : "bg-forest-50 text-forest-800 hover:bg-forest-100"
                    }`}
                  >
                    {o.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {list.map((w) => {
                const cat = w.category_id ? categoryById.get(w.category_id) : null;
                return (
                  <WisataCard
                    key={w.id}
                    wisata={w}
                    isWishlisted
                    categoryName={cat ? translateCategoryName(cat.name, cat.slug, locale) : null}
                  />
                );
              })}
            </div>

            {/* Ajakan menjelajah */}
            <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-clay-50 to-forest-50 p-6 ring-1 ring-forest-100">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
                  <Compass className="h-5 w-5 text-clay-500" />
                </span>
                <div>
                  <p className="font-display text-lg font-semibold text-forest-900">Masih mencari tempat lain?</p>
                  <p className="text-sm text-ink/60">Jelajahi destinasi lain di Malang Raya dan simpan favoritmu.</p>
                </div>
              </div>
              <Link
                href="/destinations"
                className="flex items-center gap-2 rounded-lg bg-clay-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-clay-500/25 hover:bg-clay-600"
              >
                Jelajahi Destinasi <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        ) : (
          /* Keadaan kosong */
          <div className="mx-auto max-w-md rounded-2xl bg-white px-8 py-14 text-center shadow-sm ring-1 ring-forest-100">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#ff2d4f]/10">
              <Heart className="heart-float h-10 w-10 text-[#ff2d4f]" />
            </span>
            <h2 className="mt-6 font-display text-xl font-semibold text-forest-900">Wishlist Anda masih kosong</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/60">
              Tekan ikon hati pada kartu wisata untuk menyimpannya di sini, supaya mudah ditemukan lagi nanti.
            </p>
            <Link
              href="/destinations"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-clay-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-clay-500/25 hover:bg-clay-600"
            >
              Jelajahi Destinasi <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
