"use client";

import { useState } from "react";
import { Flame, MapPin, Search, Star, Ticket } from "lucide-react";

export interface HeroSearchCategory {
  slug: string;
  name: string; // sudah diterjemahkan sesuai bahasa
}

export interface HeroSearchOption {
  value: string;
  label: string;
}

// Semua isi berupa string/array biasa (bukan fungsi) karena dikirim dari
// Server Component ke Client Component.
export interface HeroSearchLabels {
  allTab: string;
  tabTrending: string;
  tabTopRated: string;
  destinationLabel: string;
  categoryLabel: string;
  allCategories: string;
  priceLabel: string;
  ratingLabel: string;
  priceOptions: HeroSearchOption[];
  ratingOptions: HeroSearchOption[];
  placeholder: string;
  button: string;
}

type Sort = "" | "trending" | "rating";

/**
 * Kartu pencarian hero. Tab di atas menentukan pengurutan hasil (Semua,
 * Trending, Rating Tertinggi); form punya pencarian nama, kategori, batas
 * harga tiket, dan rating minimum. Semua dikirim sebagai query string ke
 * /destinations (q, category, sort, max_price, min_rating).
 */
export default function HeroSearchCard({
  categories,
  labels,
}: {
  categories: HeroSearchCategory[];
  labels: HeroSearchLabels;
}) {
  const [sort, setSort] = useState<Sort>("");

  const tabs: { key: Sort; label: string; Icon: typeof Ticket }[] = [
    { key: "", label: labels.allTab, Icon: Ticket },
    { key: "trending", label: labels.tabTrending, Icon: Flame },
    { key: "rating", label: labels.tabTopRated, Icon: Star },
  ];

  const tabClass = (active: boolean) =>
    `flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
      active ? "bg-clay-500 text-white" : "text-forest-800 hover:bg-forest-50"
    }`;

  const selectClass =
    "w-full rounded-lg border border-forest-200 bg-white px-3 py-3.5 text-sm text-ink outline-none focus:border-clay-500";

  return (
    <div className="rounded-2xl bg-white p-4 shadow-xl sm:p-6">
      <div role="tablist" className="-mx-1 flex items-center gap-1 overflow-x-auto border-b border-forest-100 px-1 pb-4 sm:justify-center sm:gap-3">
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key || "all"}
            type="button"
            role="tab"
            aria-selected={sort === key}
            onClick={() => setSort(key)}
            className={tabClass(sort === key)}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      <form action="/destinations" className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <input type="hidden" name="sort" value={sort} disabled={sort === ""} />

        <label className="block sm:col-span-2 lg:col-span-1">
          <span className="mb-1.5 block text-sm font-medium text-forest-900">{labels.destinationLabel}</span>
          <div className="flex items-center gap-2 rounded-lg border border-forest-200 px-3 focus-within:border-clay-500">
            <MapPin className="h-4 w-4 shrink-0 text-clay-500" />
            <input
              type="text"
              name="q"
              placeholder={labels.placeholder}
              className="w-full bg-transparent py-3.5 text-sm text-ink outline-none"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-forest-900">{labels.categoryLabel}</span>
          <select name="category" defaultValue="" className={selectClass}>
            <option value="">{labels.allCategories}</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-forest-900">{labels.priceLabel}</span>
          <select name="max_price" defaultValue="" className={selectClass}>
            {labels.priceOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-forest-900">{labels.ratingLabel}</span>
          <select name="min_rating" defaultValue="" className={selectClass}>
            {labels.ratingOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-lg bg-clay-500 px-8 py-3.5 text-sm font-semibold text-white hover:bg-clay-600 sm:col-span-2 lg:col-span-1 lg:self-end"
        >
          <Search className="h-4 w-4" /> {labels.button}
        </button>
      </form>
    </div>
  );
}
