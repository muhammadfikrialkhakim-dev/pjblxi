export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: "customer" | "agent" | "admin" | "admin_wisata" | "super_admin";
  agency_name: string | null;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
};

export type Wisata = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  short_description: string | null;
  description: string | null;
  cover_image_url: string | null;
  gallery_urls: string[] | null;
  facilities: string[] | null;
  opening_hours: string | null;
  contact_phone: string | null;
  estimated_duration: string | null;
  best_time_to_visit: string | null;
  age_restriction: string | null;
  tips: string[] | null;
  is_trending: boolean;
  status: "draft" | "published" | "archived";
  admin_id: string | null;
  created_at: string;
  tiket?: Tiket[];
  category?: Pick<Category, "name" | "slug"> | null;
};

export type Tiket = {
  id: string;
  wisata_id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  quota_per_day: number;
  is_active: boolean;
  created_at: string;
  wisata?: Wisata;
};

export type Order = {
  id: string;
  order_code: string;
  midtrans_order_id: string | null;
  tiket_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  visit_date: string;
  ticket_quantity: number;
  unit_price: number;
  total_price: number;
  promo_id?: string | null;
  promo_code?: string | null;
  discount_amount?: number | null;
  payment_method: "bank_transfer" | "e_wallet" | "credit_card" | "qris" | null;
  payment_status: "pending" | "paid" | "failed" | "expired" | "refunded";
  order_status: "awaiting_payment" | "confirmed" | "completed" | "cancelled" | "draft";
  notes: string | null;
  created_at: string;
  tiket?: Tiket;
};

export type Ulasan = {
  id: string;
  wisata_id: string;
  customer_id: string;
  rating: number;
  komentar: string | null;
  created_at: string;
  is_verified_purchase?: boolean;
  profiles?: { full_name: string | null };
};

/** Harga termurah dari daftar tiket sebuah wisata, untuk ditampilkan di kartu listing. */
export function lowestPrice(tiket?: Tiket[] | null): number | null {
  if (!tiket?.length) return null;
  return Math.min(...tiket.filter((t) => t.is_active).map((t) => t.price));
}

export function averageRating(ulasan?: Pick<Ulasan, "rating">[] | null): number | null {
  if (!ulasan?.length) return null;
  return ulasan.reduce((sum, u) => sum + u.rating, 0) / ulasan.length;
}

export function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Hanya anggap gambar "ada" jika diunggah admin (Supabase Storage); gambar demo/eksternal diabaikan. */
export function uploadedImage(url: string | null | undefined): string | null {
  if (!url || !url.includes("/storage/v1/object/")) return null;
  return url;
}

/** Ambil set id wisata yang ada di wishlist user (kosong kalau belum login). */
export async function getWishlistIds(
  supabase: { from: (t: string) => any },
  userId?: string | null
): Promise<Set<string>> {
  if (!userId) return new Set();
  const { data } = await supabase.from("wishlist").select("wisata_id").eq("customer_id", userId);
  return new Set(((data ?? []) as { wisata_id: string }[]).map((r) => r.wisata_id));
}
