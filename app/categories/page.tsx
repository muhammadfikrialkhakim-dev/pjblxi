import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import { Category, uploadedImage } from "@/lib/types";
import { getLocale } from "@/lib/i18n/locale";
import { translateCategoryName } from "@/lib/i18n/dictionary";
import BannerBackground from "@/components/BannerBackground";
import { getPageBanners } from "@/lib/page-banners";

export const revalidate = 30;

export default async function CategoriesPage() {
  const locale = getLocale();
  const en = locale === "en";
  const supabase = createClient();

  const banners = await getPageBanners();
  const [{ data: categoryRows }, { data: wisataRows }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("wisata").select("category_id").eq("status", "published"),
  ]);

  const categories = (categoryRows as Category[] | null) ?? [];
  const counts = new Map<string, number>();
  (wisataRows ?? []).forEach((w: { category_id: string | null }) => {
    if (w.category_id) counts.set(w.category_id, (counts.get(w.category_id) ?? 0) + 1);
  });

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-forest-700 via-forest-800 to-forest-900 py-14 text-white sm:py-16">
        <div className="pointer-events-none absolute -right-16 top-0 h-72 w-72 rounded-full bg-clay-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-forest-300/20 blur-3xl" />
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 w-full opacity-40"
          viewBox="0 0 600 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 100V55l60-30 70 26 80-40 90 46 70-26 90 36 70-24 70 28v53z" fill="#0d1e13" />
        </svg>
        <BannerBackground image={banners.categories} />
        <div className="container-page relative">
          <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            {en ? "Browse by Category" : "Jelajahi Berdasarkan Kategori"}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-forest-100/90">
            {en
              ? "Pick the kind of trip you feel like — nature, culture, food, beaches, and more across Greater Malang."
              : "Pilih jenis perjalanan yang Anda inginkan — alam, budaya, kuliner, pantai, dan lainnya di seluruh Malang Raya."}
          </p>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const count = counts.get(cat.id) ?? 0;
            const img = uploadedImage(cat.image_url);
            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="group relative block h-56 overflow-hidden rounded-2xl shadow-sm ring-1 ring-forest-100"
              >
                {img ? (
                  <Image
                    src={img}
                    alt={cat.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <ImagePlaceholder className="bg-forest-700" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/85 via-forest-950/25 to-transparent transition-colors group-hover:from-forest-950/90" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-white">
                      {translateCategoryName(cat.name, cat.slug, locale)}
                    </h2>
                    <p className="mt-0.5 text-sm text-white/80">
                      {en ? `${count} attraction${count === 1 ? "" : "s"}` : `${count} destinasi`}
                    </p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-forest-900 transition-all group-hover:translate-x-1 group-hover:bg-clay-500 group-hover:text-white">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </div>
              </Link>
            );
          })}
          {!categories.length && (
            <p className="col-span-full py-10 text-center text-sm text-ink/60">
              {en ? "No categories yet." : "Belum ada kategori."}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
