"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeCode, wibLocalToIso } from "@/lib/promo";

/**
 * Simpan promo (baru / ubah).
 * - Super Admin: promo untuk semua wisata atau satu wisata pilihannya.
 * - Admin Wisata: HANYA promo untuk wisata yang ditugaskan padanya. Field
 *   wisata dari form tidak dipercaya — di server selalu dipaksa ke wisata
 *   miliknya (RLS juga menolak kalau ada yang mengakali).
 */
export async function savePromo(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  const isSuperAdmin = profile?.role === "super_admin";
  const isWisataAdmin = profile?.role === "admin_wisata";
  if (!user || (!isSuperAdmin && !isWisataAdmin)) redirect("/admin");

  const id = (formData.get("id") as string | null) || null;
  const editPath = id ? `/admin/promos/${id}` : "/admin/promos/new";
  const fail = (message: string): never => redirect(`${editPath}?error=${encodeURIComponent(message)}`);

  const code = normalizeCode(String(formData.get("code") ?? ""));
  if (!/^[A-Z0-9_-]{2,40}$/.test(code)) {
    fail("Kode hanya boleh berisi huruf, angka, tanda strip (-) dan garis bawah (_), 2–40 karakter.");
  }

  const title = String(formData.get("title") ?? "").trim();
  if (!title) fail("Judul promo wajib diisi.");

  const discount_type = formData.get("discount_type") === "fixed" ? "fixed" : "percent";
  const discount_value = Number(formData.get("discount_value"));
  if (!Number.isFinite(discount_value) || discount_value <= 0) fail("Nilai diskon harus lebih dari 0.");
  if (discount_type === "percent" && discount_value > 100) fail("Diskon persen tidak boleh lebih dari 100%.");

  const maxRaw = String(formData.get("max_discount") ?? "").trim();
  const max_discount = discount_type === "percent" && maxRaw ? Number(maxRaw) : null;
  if (max_discount !== null && (!Number.isFinite(max_discount) || max_discount <= 0)) {
    fail("Batas maksimal diskon harus lebih dari 0.");
  }

  const min_purchase = Number(formData.get("min_purchase") || 0);
  if (!Number.isFinite(min_purchase) || min_purchase < 0) fail("Minimal belanja tidak valid.");

  const quotaRaw = String(formData.get("claim_quota") ?? "").trim();
  const claim_quota = quotaRaw ? Math.floor(Number(quotaRaw)) : null;
  if (claim_quota !== null && (!Number.isFinite(claim_quota) || claim_quota < 1)) fail("Kuota klaim minimal 1.");

  const starts_at = wibLocalToIso(String(formData.get("starts_at") ?? "")) ?? new Date().toISOString();
  const ends_at = wibLocalToIso(String(formData.get("ends_at") ?? ""));
  if (ends_at && new Date(ends_at) <= new Date(starts_at)) fail("Waktu berakhir harus setelah waktu mulai.");

  // Cakupan wisata
  let wisata_id: string | null = null;
  if (isWisataAdmin) {
    const { data: own } = await supabase.from("wisata").select("id").eq("admin_id", user.id).maybeSingle();
    if (!own) fail("Akun Anda belum ditugaskan ke wisata mana pun.");
    wisata_id = own!.id;
  } else {
    wisata_id = (formData.get("wisata_id") as string) || null;
  }

  const payload = {
    code,
    title,
    description: String(formData.get("description") ?? "").trim() || null,
    discount_type,
    discount_value,
    max_discount,
    min_purchase,
    wisata_id,
    claim_quota,
    starts_at,
    ends_at,
    is_active: formData.get("is_active") === "on",
  };

  const query = id
    ? supabase.from("promos").update(payload).eq("id", id).select("id")
    : supabase.from("promos").insert({ ...payload, created_by: user.id }).select("id");
  const { data, error } = await query;

  if (error) {
    if (error.code === "23505") fail("Kode promo itu sudah dipakai promo lain. Gunakan kode yang berbeda.");
    fail(`Gagal menyimpan promo: ${error.message}`);
  }
  if (!data?.length) fail("Promo tidak tersimpan — Anda tidak berhak mengubah promo ini.");

  revalidatePath("/admin/promos");
  revalidatePath("/promo");
  redirect("/admin/promos");
}

export async function togglePromo(id: string, active: boolean) {
  const supabase = createClient();
  await supabase.from("promos").update({ is_active: active }).eq("id", id);
  revalidatePath("/admin/promos");
  revalidatePath("/promo");
}

export async function deletePromo(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("promos").delete().eq("id", id).select("id");
  if (error || !data?.length) {
    redirect(`/admin/promos?error=${encodeURIComponent("Gagal menghapus promo.")}`);
  }
  revalidatePath("/admin/promos");
  revalidatePath("/promo");
}
