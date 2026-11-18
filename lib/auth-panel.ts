import { createClient } from "@/lib/supabase/server";
import { uploadedImage } from "@/lib/types";

/**
 * Gambar panel kiri halaman Masuk & Daftar — diunggah Super Admin lewat
 * Pengaturan Situs. Null = pakai ilustrasi pegunungan bawaan.
 */
export async function getAuthPanelImage(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.from("site_settings").select("*").eq("id", true).maybeSingle();
  return uploadedImage((data?.auth_panel_image as string | null | undefined) ?? null);
}
