"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidDomicile } from "@/lib/indonesia-regions";

export async function updateProfile(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/profile");
  }

  const full_name = (formData.get("full_name") as string)?.trim();
  if (!full_name) {
    throw new Error("Nama tidak boleh kosong.");
  }
  const phone = ((formData.get("phone") as string) || "").trim() || null;
  let city = ((formData.get("city") as string) || "").trim() || null;

  // Domisili harus dari daftar resmi provinsi + kota/kabupaten. Satu-satunya
  // pengecualian: nilai lama (diketik bebas sebelum fitur ini) yang tidak
  // diubah pengguna. Nilai lain — mis. dari request yang dipalsukan — diabaikan.
  if (city) {
    const { data: current } = await supabase.from("profiles").select("city").eq("id", user.id).maybeSingle();
    const existing = (current?.city as string | null | undefined) ?? null;
    if (!isValidDomicile(city) && city !== existing) city = existing;
  }

  const { error } = await supabase.from("profiles").update({ full_name, phone, city }).eq("id", user.id);
  if (error) {
    // 42703 = kolom belum ada (migration_add_profile_details.sql belum dijalankan):
    // tetap simpan nama supaya fitur lama tidak rusak.
    if (error.code === "42703" || /column .* does not exist|could not find/i.test(error.message)) {
      const { error: fallbackError } = await supabase.from("profiles").update({ full_name }).eq("id", user.id);
      if (fallbackError) throw new Error(fallbackError.message);
    } else {
      throw new Error(error.message);
    }
  }

  // Nama tampil di navbar (Server Component) & halaman lain, jadi segarkan
  // seluruh layout supaya perubahan langsung terlihat.
  revalidatePath("/", "layout");
  redirect("/profile?saved=1");
}
