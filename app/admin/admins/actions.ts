"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Menjadikan sebuah akun (dicari lewat email) sebagai admin.
 * Hanya bisa dijalankan oleh super_admin — dijamin oleh RLS policy
 * "Profiles: super admin updates all" (update ditolak database kalau
 * pemanggilnya bukan super_admin, meskipun action ini dipanggil).
 */
export async function promoteToAdmin(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) throw new Error("Email wajib diisi");

  const admin = createAdminClient();
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const user = data.users.find((u) => u.email?.toLowerCase() === email);

  if (!user) {
    throw new Error("Tidak ditemukan akun dengan email tersebut. Pastikan orangnya sudah pernah mendaftar/login.");
  }

  const supabase = createClient();
  const { error } = await supabase.from("profiles").update({ role: "admin" }).eq("id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/admins");
  revalidatePath("/admin/members");
}

/** Menurunkan admin kembali menjadi member biasa (customer). */
export async function demoteToMember(id: string) {
  "use server";
  const supabase = createClient();
  const { error } = await supabase.from("profiles").update({ role: "customer" }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/admins");
  revalidatePath("/admin/members");
}
