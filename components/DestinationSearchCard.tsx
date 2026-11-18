import { MapPin, Search, Star, Tag, Wallet } from "lucide-react";

export interface SearchOption {
  value: string;
  label: string;
}

export interface DestinationSearchLabels {
  destination: string;
  placeholder: string;
  category: string;
  price: string;
  rating: string;
  button: string;
}

/**
 * Kartu pencarian halaman Destinasi (gaya Traveloka): label tebal di atas tiap
 * kolom, ikon di kotak kiri, dan tombol Cari oranye. Form memakai GET sehingga
 * semua pilihan tersimpan di URL; nilai awal diambil dari query yang sedang aktif.
 */
export default function DestinationSearchCard({
  labels,
  categoryOptions,
  priceOptions,
  ratingOptions,
  values,
  sort,
}: {
  labels: DestinationSearchLabels;
  categoryOptions: SearchOption[];
  priceOptions: SearchOption[];
  ratingOptions: SearchOption[];
  values: { q?: string; category?: string; max_price?: string; min_rating?: string };
  sort?: string | null;
}) {
  const group =
    "flex overflow-hidden rounded-md border border-forest-200 bg-white transition-colors focus-within:border-clay-500";
  const iconCell = "flex w-11 shrink-0 items-center justify-center border-r border-forest-200 text-forest-700";
  const control = "min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-ink outline-none";
  const label = "mb-1.5 block text-sm font-bold text-forest-950";

  return (
    <form
      action="/destinations"
      className="grid gap-4 rounded-xl bg-white p-5 shadow-xl shadow-forest-900/10 ring-1 ring-forest-100 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end lg:p-6"
    >
      {sort && <input type="hidden" name="sort" value={sort} />}

      <label className="block sm:col-span-2 lg:col-span-1">
        <span className={label}>{labels.destination}</span>
        <div className={group}>
          <span className={iconCell}>
            <MapPin className="h-[18px] w-[18px]" />
          </span>
          <input type="text" name="q" defaultValue={values.q ?? ""} placeholder={labels.placeholder} className={control} />
        </div>
      </label>

      <label className="block">
        <span className={label}>{labels.category}</span>
        <div className={group}>
          <span className={iconCell}>
            <Tag className="h-[18px] w-[18px]" />
          </span>
          <select name="category" defaultValue={values.category ?? ""} className={control}>
            {categoryOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </label>

      <label className="block">
        <span className={label}>{labels.price}</span>
        <div className={group}>
          <span className={iconCell}>
            <Wallet className="h-[18px] w-[18px]" />
          </span>
          <select name="max_price" defaultValue={values.max_price ?? ""} className={control}>
            {priceOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </label>

      <label className="block">
        <span className={label}>{labels.rating}</span>
        <div className={group}>
          <span className={iconCell}>
            <Star className="h-[18px] w-[18px]" />
          </span>
          <select name="min_rating" defaultValue={values.min_rating ?? ""} className={control}>
            {ratingOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </label>

      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-md bg-clay-500 px-8 py-3 text-base font-bold text-white shadow-md shadow-clay-500/25 transition-colors hover:bg-clay-600 sm:col-span-2 lg:col-span-1"
      >
        <Search className="h-4 w-4" /> {labels.button}
      </button>
    </form>
  );
}
