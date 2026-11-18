"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server action bisa dipanggil langsung dari luar halaman admin, jadi
 * middleware saja tidak cukup: setiap aksi di file ini memastikan sendiri
 * bahwa pemanggilnya benar-benar Super Admin yang sedang login.
 */
async function requireSuperAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Anda harus login terlebih dahulu.");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "super_admin") throw new Error("Hanya Super Admin yang boleh melakukan aksi ini.");
  return user;
}

const ALLOWED_NEW_ROLES = ["admin_wisata", "super_admin", "admin"];

/**
 * Membuat akun baru langsung dengan role tertentu (admin/super_admin).
 * Memakai Service Role key lewat Admin Auth API karena membuat akun untuk
 * ORANG LAIN (bukan sign-up sendiri) tidak bisa lewat client biasa.
 */
export async function createAccountWithRole(formData: FormData) {
  const full_name = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  await requireSuperAdmin();
  if (!ALLOWED_NEW_ROLES.includes(role)) throw new Error("Role tidak valid.");

  const adminClient = createAdminClient();

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Gagal membuat akun");
  }

  const { error: profileError } = await adminClient.from("profiles").insert({
    id: data.user.id,
    full_name,
    role,
  });

  if (profileError) {
    // Bersihkan akun auth kalau insert profil gagal, supaya tidak nyangkut yatim.
    await adminClient.auth.admin.deleteUser(data.user.id);
    throw new Error(profileError.message);
  }

  revalidatePath("/admin/super/admins");
  revalidatePath("/admin/super/users");
  redirect(role === "admin" || role === "admin_wisata" || role === "super_admin" ? "/admin/super/admins" : "/admin/super/users");
}

/** Super Admin permanen: tolak perubahan role / penghapusan terhadap akun ini. */
async function assertNotSuperAdmin(userId: string) {
  const adminClient = createAdminClient();
  const { data } = await adminClient.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (data?.role === "super_admin") {
    throw new Error("Super Admin bersifat permanen dan tidak dapat diubah atau dihapus.");
  }
}

/** Ubah role akun mana pun — hanya boleh dipanggil Super Admin (dijaga RLS + middleware). */
export async function changeUserRole(userId: string, role: string) {
  await requireSuperAdmin();
  await assertNotSuperAdmin(userId);
  const supabase = createClient();

  // Kalau akun ini sebelumnya "admin_wisata" dan role barunya BUKAN
  // "admin_wisata" lagi, lepas dulu penugasan wisatanya (wisata.admin_id).
  // Kalau tidak, wisata itu tetap menunjuk ke akun yang sudah bukan admin
  // wisata lagi — jadi "nyangkut" (tidak muncul di daftar Kelola Data Admin,
  // dan pilihan "Admin Wisata" di form Kelola Wisata jadi tidak sinkron)
  // sampai ada yang menugaskan ulang secara manual.
  if (role !== "admin_wisata") {
    await supabase.from("wisata").update({ admin_id: null }).eq("admin_id", userId);
  }

  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/super/admins");
  revalidatePath("/admin/super/users");
  revalidatePath("/admin/spots");
}

/** Hapus akun (auth user + profil ikut terhapus lewat ON DELETE CASCADE). */
export async function deleteAccount(userId: string) {
  await requireSuperAdmin();
  await assertNotSuperAdmin(userId);
  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/super/admins");
  revalidatePath("/admin/super/users");
}
