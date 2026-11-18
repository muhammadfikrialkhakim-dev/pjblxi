import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import DestinationCard from "@/components/DestinationCard";
import DestinationSearchCard from "@/components/DestinationSearchCard";
import BannerBackground from "@/components/BannerBackground";
import { getPageBanners } from "@/lib/page-banners";
import { Category, Wisata, getWishlistIds, lowestPrice, averageRating, formatIDR } from "@/lib/types";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary, translateCategoryName } from "@/lib/i18n/dictionary";

export const revalidate = 30;

export default async function DestinationsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; sort?: string; max_price?: string; min_rating?: string };
}) {
  const locale = getLocale();
  const t = getDictionary(locale).destinations;
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const wishlistIds = await getWishlistIds(supabase, user?.id);

  const { data: categoryRows } = await supabase.from("categories").select("*").order("name");
  const categories = (categoryRows as Category[] | null) ?? [];
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  let query = supabase.from("wisata").select("*, tiket(*), ulasan(rating)").eq("status", "published");

  if (searchParams.q) {
    query = query.ilike("name", `%${searchParams.q}%`);
  }

  if (searchParams.category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", searchParams.category)
      .single();
    if (cat) query = query.eq("category_id", cat.id);
  }

  const { data: rawList } = await query.order("created_at", { ascending: false });

  // Filter harga & rating dan pengurutan dikerjakan di sini (harga = tiket
  // aktif termurah, rating = rata-rata ulasan), karena keduanya dihitung dari
  // tabel relasi.
  const maxPrice = Number(searchParams.max_price);
  const minRating = Number(searchParams.min_rating);
  const sort = searchParams.sort === "trending" || searchParams.sort === "rating" ? searchParams.sort : null;

  type WisataWithUlasan = Wisata & { ulasan?: { rating: number }[] };
  let wisataList = (rawList as WisataWithUlasan[] | null) ?? [];

  if (maxPrice > 0) {
    wisataList = wisataList.filter((w) => {
      const price = lowestPrice(w.tiket);
      return price !== null && Number.isFinite(price) && price <= maxPrice;
    });
  }
  if (minRating > 0) {
    wisataList = wisataList.filter((w) => (averageRating(w.ulasan) ?? 0) >= minRating);
  }
  if (sort === "trending") {
    wisataList = [...wisataList].sort((a, b) => Number(b.is_trending) - Number(a.is_trending));
  } else if (sort === "rating") {
    wisataList = [...wisataList].sort(
      (a, b) =>
        (averageRating(b.ulasan) ?? 0) - (averageRating(a.ulasan) ?? 0) ||
        (b.ulasan?.length ?? 0) - (a.ulasan?.length ?? 0)
    );
  }

  const home = getDictionary(locale).home;
  const banners = await getPageBanners();

  // Tautan urutan: mempertahankan semua pencarian & filter yang sedang aktif.
  const sortHref = (value: string) => {
    const params = new URLSearchParams();
    if (searchParams.q) params.set("q", searchParams.q);
    if (searchParams.category) params.set("category", searchParams.category);
    if (searchParams.max_price) params.set("max_price", searchParams.max_price);
    if (searchParams.min_rating) params.set("min_rating", searchParams.min_rating);
    if (value) params.set("sort", value);
    const qs = params.toString();
    return qs ? `/destinations?${qs}` : "/destinations";
  };
  const sortOptions = [
    { value: "", label: t.sortNewest },
    { value: "trending", label: t.sortTrendingShort },
    { value: "rating", label: t.sortTopRated },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-forest-700 via-forest-800 to-forest-900 pb-28 pt-12 text-white sm:pt-16">
        <div className="pointer-events-none absolute -right-16 top-0 h-72 w-72 rounded-full bg-clay-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-forest-300/20 blur-3xl" />
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full opacity-40"
          viewBox="0 0 600 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 100V55l60-30 70 26 80-40 90 46 70-26 90 36 70-24 70 28v53z" fill="#0d1e13" />
        </svg>
        <BannerBackground image={banners.destinations} />
        <div className="container-page relative">
          <h1 className="max-w-2xl font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
            {searchParams.q ? t.resultsFor(searchParams.q) : t.allDestinations}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-forest-100/90">{t.heroText}</p>
        </div>
      </section>

      {/* Kartu pencarian — menumpuk di tepi bawah hero */}
      <section className="container-page relative z-10 -mt-20">
        <DestinationSearchCard
          labels={{
            destination: home.searchDestinationLabel,
            placeholder: home.searchPlaceholder,
            category: home.searchCategoryLabel,
            price: home.priceLabel,
            rating: home.ratingLabel,
            button: home.searchButton,
          }}
          categoryOptions={[
            { value: "", label: home.allCategories },
            ...categories.map((c) => ({ value: c.slug, label: translateCategoryName(c.name, c.slug, locale) })),
          ]}
          priceOptions={[
            { value: "", label: home.anyPrice },
            ...[50000, 100000, 250000, 500000].map((n) => ({ value: String(n), label: home.priceUpTo(formatIDR(n)) })),
          ]}
          ratingOptions={[
            { value: "", label: home.anyRating },
            ...["3", "4", "4.5"].map((n) => ({ value: n, label: home.ratingAtLeast(n) })),
          ]}
          values={{
            q: searchParams.q,
            category: searchParams.category,
            max_price: searchParams.max_price,
            min_rating: searchParams.min_rating,
          }}
          sort={sort}
        />
      </section>

      {/* Hasil */}
      <section className="container-page py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-ink/70">{t.found(wisataList.length)}</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink/50">{t.sortLabel}:</span>
            {sortOptions.map((o) => {
              const active = (sort ?? "") === o.value;
              return (
                <Link
                  key={o.value || "new"}
                  href={sortHref(o.value)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                    active ? "bg-clay-500 text-white" : "bg-forest-50 text-forest-800 hover:bg-forest-100"
                  }`}
                >
                  {o.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wisataList.map((w) => {
            const cat = w.category_id ? categoryById.get(w.category_id) : null;
            return (
              <DestinationCard
                key={w.id}
                wisata={w}
                categoryName={cat ? translateCategoryName(cat.name, cat.slug, locale) : null}
                rating={averageRating(w.ulasan)}
                reviewCount={w.ulasan?.length ?? 0}
                isWishlisted={wishlistIds.has(w.id)}
              />
            );
          })}
          {!wisataList.length && <p className="col-span-full py-10 text-center text-sm text-ink/60">{t.empty}</p>}
        </div>
      </section>
    </div>
  );
}
