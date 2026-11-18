import { createClient } from "@/lib/supabase/server";

/** Nama situs & kontak dari Pengaturan Situs, dengan fallback bila belum diisi. */
export async function getSiteContact() {
  const supabase = createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("site_name, contact_email, contact_whatsapp")
    .eq("id", true)
    .maybeSingle();

  return {
    siteName: data?.site_name || "Explore Malang",
    email: (data?.contact_email as string | null) ?? null,
    whatsapp: (data?.contact_whatsapp as string | null) ?? null,
  };
}
