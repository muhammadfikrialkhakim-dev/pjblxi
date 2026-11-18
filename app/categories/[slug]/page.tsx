import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DestinationCard from "@/components/DestinationCard";
import { Category, Wisata, getWishlistIds, averageRating, uploadedImage } from "@/lib/types";
import { getLocale } from "@/lib/i18n/locale";
import { translateCategoryName } from "@/lib/i18n/dictionary";

export const revalidate = 30;

type WisataWithUlasan = Wisata & { ulasan?: { rating: number }[] };

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { sort?: string };
}) {
  const locale = getLocale();
  const en = locale === "en";
  const supabase = createClient();

  const { data: categoryRows } = await supabase.from("categories").select("*").order("name");
  const categories = (categoryRows as Category[] | null) ?? [];
  const category = categories.find((c) => c.slug === params.slug);
  if (!category) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const wishlistIds = await getWishlistIds(supabase, user?.id);

  const { data } = await supabase
    .from("wisata")
    .select("*, tiket(*), ulasan(rating)")
    .eq("status", "published")
    .eq("category_id", category.id)
    .order("created_at", { ascending: false });

  let list = (data as WisataWithUlasan[] | null) ?? [];

  const sort = searchParams.sort === "trending" || searchParams.sort === "rating" ? searchParams.sort : "";
  if (sort === "trending") {
    list = [...list].sort((a, b) => Number(b.is_trending) - Number(a.is_trending));
  } else if (sort === "rating") {
    list = [...list].sort((a, b) => (averageRating(b.ulasan) ?? 0) - (averageRating(a.ulasan) ?? 0));
  }

  const name = translateCategoryName(category.name, category.slug, locale);
  const img = uploadedImage(category.image_url);
  const base = `/categories/${category.slug}`;
  const sorts = [
    { value: "", label: en ? "Newest" : "Terbaru" },
    { value: "trending", label: "Trending" },
    { value: "rating", label: en ? "Top rated" : "Rating tertinggi" },
  ];

  return (
    <div>
      {/* Hero memakai gambar kategori */}
      <section className="relative overflow-hidden bg-forest-900 py-14 text-white sm:py-20">
        {img && <Image src={img} alt="" fill priority sizes="100vw" className="object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/90 via-forest-950/60 to-forest-950/70" />
        <div className="container-page relative">
          <Link href="/categories" className="text-sm font-medium text-forest-100/85 hover:text-white">
            ← {en ? "All categories" : "Semua kategori"}
          </Link>
          <h1 className="mt-3 font-display text-4xl font-semibold text-white sm:text-5xl">{name}</h1>
          <p className="mt-3 text-base text-forest-100/90">
            {en
              ? `${list.length} attraction${list.length === 1 ? "" : "s"} in this category`
              : `${list.length} destinasi dalam kategori ini`}
          </p>
        </div>
      </section>

      <section className="container-page py-8">
        {/* Kategori lain */}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/categories/${c.slug}`}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                c.id === category.id ? "bg-clay-500 text-white" : "bg-forest-50 text-forest-800 hover:bg-forest-100"
              }`}
            >
              {translateCategoryName(c.name, c.slug, locale)}
            </Link>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-ink/70">
            {en ? `${list.length} found` : `${list.length} wisata ditemukan`}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink/50">{en ? "Sort by" : "Urutkan"}:</span>
            {sorts.map((o) => (
              <Link
                key={o.value || "new"}
                href={o.value ? `${base}?sort=${o.value}` : base}
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
          {list.map((w) => (
            <DestinationCard
              key={w.id}
              wisata={w}
              categoryName={name}
              rating={averageRating(w.ulasan)}
              reviewCount={w.ulasan?.length ?? 0}
              isWishlisted={wishlistIds.has(w.id)}
            />
          ))}
          {!list.length && (
            <p className="col-span-full py-12 text-center text-sm text-ink/60">
              {en ? "No attractions in this category yet." : "Belum ada wisata di kategori ini."}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
