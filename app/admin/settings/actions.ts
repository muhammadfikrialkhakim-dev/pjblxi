"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveSiteSettings(formData: FormData) {
  const supabase = createClient();

  // Pertahanan berlapis: walau middleware & RLS sudah menutup jalur ini
  // untuk selain Super Admin, tetap dicek ulang di sini supaya kalau ada
  // yang mengakali (devtools/curl), tetap ditolak dengan jelas — bukan
  // cuma gagal diam-diam karena RLS.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  if (profile?.role !== "super_admin") {
    redirect("/admin");
  }

  const payload = {
    site_name: (formData.get("site_name") as string)?.trim() || "Explore Malang",
    site_tagline: (formData.get("site_tagline") as string)?.trim() || "",
    contact_email: (formData.get("contact_email") as string)?.trim() || null,
    contact_whatsapp: (formData.get("contact_whatsapp") as string)?.trim() || null,
    payment_bank_transfer_enabled: formData.get("payment_bank_transfer_enabled") === "on",
    payment_ewallet_enabled: formData.get("payment_ewallet_enabled") === "on",
    payment_credit_card_enabled: formData.get("payment_credit_card_enabled") === "on",
    payment_qris_enabled: formData.get("payment_qris_enabled") === "on",
    auth_panel_image: ((formData.get("auth_panel_image") as string) || "").trim() || null,
    categories_banner_image: ((formData.get("categories_banner_image") as string) || "").trim() || null,
    destinations_banner_image: ((formData.get("destinations_banner_image") as string) || "").trim() || null,
    wishlist_banner_image: ((formData.get("wishlist_banner_image") as string) || "").trim() || null,
    promo_banner_image: ((formData.get("promo_banner_image") as string) || "").trim() || null,
    dashboard_banner_image: ((formData.get("dashboard_banner_image") as string) || "").trim() || null,
    hero_images: ((formData.get("hero_images") as string) || "")
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("site_settings").update(payload).eq("id", true);

  if (error) {
    redirect(`/admin/settings?error=${encodeURIComponent("Gagal menyimpan: " + error.message)}`);
  }

  // Footer & metadata situs menampilkan nama/tagline ini ke publik, jadi
  // revalidate halaman-halaman yang memakainya.
  revalidatePath("/", "layout");
  revalidatePath("/login");
  revalidatePath("/categories");
  revalidatePath("/destinations");
  revalidatePath("/wishlist");
  revalidatePath("/promo");
  revalidatePath("/admin");
  revalidatePath("/register");
  redirect("/admin/settings?flash=settings-saved");
}
