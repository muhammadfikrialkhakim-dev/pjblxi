import { createClient } from "@/lib/supabase/server";
import { uploadedImage } from "@/lib/types";

export type PageBanners = {
  categories: string | null;
  destinations: string | null;
  wishlist: string | null;
  promo: string | null;
  dashboard: string | null;
};

/**
 * Gambar latar banner tiap halaman, diatur Super Admin di Pengaturan Situs.
 * Null = pakai gradasi hijau bawaan. select("*") dipakai supaya halaman tetap
 * jalan walau migrasi kolomnya belum dijalankan.
 */
export async function getPageBanners(): Promise<PageBanners> {
  const supabase = createClient();
  const { data } = await supabase.from("site_settings").select("*").eq("id", true).maybeSingle();
  const pick = (key: string) => uploadedImage((data?.[key] as string | null | undefined) ?? null);
  return {
    categories: pick("categories_banner_image"),
    destinations: pick("destinations_banner_image"),
    wishlist: pick("wishlist_banner_image"),
    promo: pick("promo_banner_image"),
    dashboard: pick("dashboard_banner_image"),
  };
}
