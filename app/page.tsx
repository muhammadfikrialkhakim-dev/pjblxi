import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WisataCard from "@/components/WisataCard";
import HeroSlideshow from "@/components/HeroSlideshow";
import HeroSearchCard from "@/components/HeroSearchCard";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import { Category, Wisata, uploadedImage, getWishlistIds, formatIDR } from "@/lib/types";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary, translateCategoryName } from "@/lib/i18n/dictionary";

export const revalidate = 60;

export default async function HomePage() {
  const locale = getLocale();
  const t = getDictionary(locale).home;
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role === "admin" || profile?.role === "admin_wisata" || profile?.role === "super_admin") redirect("/admin");
  }

  const wishlistIds = await getWishlistIds(supabase, user?.id);

  const [{ data: categories }, { data: trending }, { data: allPublished }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase
      .from("wisata")
      .select("*, tiket(*), ulasan(rating)")
      .eq("status", "published")
      .order("is_trending", { ascending: false })
      .limit(6),
    supabase
      .from("wisata")
      .select("*, tiket(*), ulasan(rating)")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const categoryNameFor = (w: Wisata) => {
    const cat = (categories as Category[] | null)?.find((c) => c.id === w.category_id);
    return cat ? translateCategoryName(cat.name, cat.slug, locale) : null;
  };

  // "Tempat yang Disarankan": diurutkan dari rating rata-rata ulasan
  // tertinggi (minimal 1 ulasan). Kalau belum ada ulasan sama sekali di
  // seluruh wisata, fallback ke wisata yang paling baru ditambahkan.
  // Destinasi yang sudah tampil di "Destinasi Trending" tidak diulang di
  // sini supaya kedua section tidak isinya sama persis.
  const trendingIds = new Set((trending as Wisata[] | null)?.map((w) => w.id));
  const withRating = ((allPublished as (Wisata & { ulasan?: { rating: number }[] })[] | null) ?? [])
    .filter((w) => !trendingIds.has(w.id))
    .map((w) => {
      const ratings = w.ulasan ?? [];
      const avgRating = ratings.length ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;
      return { wisata: w, avgRating, reviewCount: ratings.length };
    });

  const hasAnyReview = withRating.some((w) => w.reviewCount > 0);
  const recommended = (
    hasAnyReview
      ? [...withRating].sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount)
      : withRating // sudah terurut dari yang terbaru (query order created_at desc)
  )
    .slice(0, 6)
    .map((r) => r.wisata);

  // Hero hanya memakai gambar yang diunggah Super Admin lewat Pengaturan
  // Situs. Kalau belum ada, hero tampil polos (kosong).
  const { data: siteSettings } = await supabase.from("site_settings").select("hero_images").eq("id", true).maybeSingle();
  const heroImages = ((siteSettings?.hero_images as string[] | null) ?? [])
    .map((u) => uploadedImage(u))
    .filter((u): u is string => !!u)
    .map((url) => ({ url, alt: "Explore Malang" }));

  return (
    <div>
      {/* Hero — gambar penuh sampai ke tepi atas; navbar transparan mengambang di atasnya */}
      <section className="relative h-[480px] overflow-hidden bg-forest-950 sm:h-[540px]">
        {heroImages.length ? (
          <HeroSlideshow images={heroImages} />
        ) : (
          <ImagePlaceholder className="bg-forest-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/45" />
        <div className="container-page relative flex h-full flex-col items-center justify-center pb-16 pt-20 text-center">
          <h1 className="mx-auto max-w-3xl font-display text-4xl font-semibold text-white drop-shadow sm:text-5xl">
            {t.heroTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/90 drop-shadow">{t.heroSubtitle}</p>
        </div>
      </section>

      {/* Kartu pencarian — menumpuk di tepi bawah hero */}
      <section className="container-page relative z-10 -mt-24">
        <HeroSearchCard
          categories={((categories as Category[] | null) ?? []).map((cat) => ({
            slug: cat.slug,
            name: translateCategoryName(cat.name, cat.slug, locale),
          }))}
          labels={{
            allTab: t.searchTab,
            destinationLabel: t.searchDestinationLabel,
            categoryLabel: t.searchCategoryLabel,
            allCategories: t.allCategories,
            placeholder: t.searchPlaceholder,
            button: t.searchButton,
            tabTrending: t.tabTrending,
            tabTopRated: t.tabTopRated,
            priceLabel: t.priceLabel,
            ratingLabel: t.ratingLabel,
            priceOptions: [
              { value: "", label: t.anyPrice },
              ...[50000, 100000, 250000, 500000].map((n) => ({ value: String(n), label: t.priceUpTo(formatIDR(n)) })),
            ],
            ratingOptions: [
              { value: "", label: t.anyRating },
              ...["3", "4", "4.5"].map((n) => ({ value: n, label: t.ratingAtLeast(n) })),
            ],
          }}
        />
      </section>

      {/* Categories */}
      <section id="categories" className="container-page scroll-mt-20 py-14">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-forest-900">{t.categoriesTitle}</h2>
          <Link href="/categories" className="text-sm font-medium text-clay-600 hover:underline">
            {t.seeAll}
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {(categories as Category[] | null)?.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group relative h-32 overflow-hidden rounded-lg"
            >
              {uploadedImage(cat.image_url) ? (
                <Image src={uploadedImage(cat.image_url)!} alt={cat.name} fill className="object-cover transition-transform group-hover:scale-105" />
              ) : (
                <ImagePlaceholder className="bg-forest-700" />
              )}
              <div className="absolute inset-0 bg-black/35 transition-colors group-hover:bg-black/45" />
              <span className="absolute inset-0 flex items-center justify-center font-display text-lg font-semibold text-white">
                {translateCategoryName(cat.name, cat.slug, locale)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending wisata */}
      <section className="container-page pb-14">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-forest-900">{t.trendingTitle}</h2>
          <Link href="/destinations" className="text-sm font-medium text-clay-600 hover:underline">
            {t.seeAll}
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(trending as Wisata[] | null)?.map((w) => (
            <WisataCard key={w.id} wisata={w} categoryName={categoryNameFor(w)} isWishlisted={wishlistIds.has(w.id)} />
          ))}
          {!trending?.length && (
            <p className="text-sm text-ink/60">{t.trendingEmpty}</p>
          )}
        </div>
      </section>

      {/* Rekomendasi */}
      {recommended.length > 0 && (
        <section className="container-page pb-16">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold text-forest-900">{t.recommendedTitle}</h2>
              <p className="mt-1 text-sm text-ink/60">
                {hasAnyReview ? t.recommendedByRating : t.recommendedNew}
              </p>
            </div>
            <Link href="/destinations" className="text-sm font-medium text-clay-600 hover:underline">
              {t.seeAll}
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((w) => (
              <WisataCard key={w.id} wisata={w} categoryName={categoryNameFor(w)} isWishlisted={wishlistIds.has(w.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
