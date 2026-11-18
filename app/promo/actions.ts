"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeCode, promoStatus, type Promo } from "@/lib/promo";

export type ClaimResult =
  | { ok: true; claimId: string; title: string }
  | { ok: false; error: string; needLogin?: boolean };

const GENERIC_ERROR = "Promo belum bisa diklaim saat ini. Silakan coba lagi.";

/**
 * Klaim = memasukkan promo ke "Voucher Saya" milik user. Ditulis lewat
 * service role (bukan client user) supaya kuota & aturan klaim tidak bisa
 * dilewati dari browser. Satu user hanya bisa mengklaim satu promo satu kali.
 */
async function claim(userId: string, promo: Promo): Promise<ClaimResult> {
  const admin = createAdminClient();

  const status = promoStatus(promo);
  if (status === "upcoming") return { ok: false, error: "Promo ini belum dimulai." };
  if (status !== "active") return { ok: false, error: "Promo ini sudah tidak berlaku." };

  const { data: existing } = await admin
    .from("user_promos")
    .select("id, used_at")
    .eq("user_id", userId)
    .eq("promo_id", promo.id)
    .maybeSingle();
  if (existing) {
    return {
      ok: false,
      error: existing.used_at ? "Voucher ini sudah Anda pakai." : "Anda sudah mengklaim promo ini.",
    };
  }

  const countClaims = async () => {
    const { count } = await admin
      .from("user_promos")
      .select("id", { count: "exact", head: true })
      .eq("promo_id", promo.id);
    return count ?? 0;
  };

  if (promo.claim_quota && (await countClaims()) >= promo.claim_quota) {
    return { ok: false, error: "Kuota promo ini sudah habis." };
  }

  const { data: inserted, error } = await admin
    .from("user_promos")
    .insert({ user_id: userId, promo_id: promo.id })
    .select("id")
    .single();

  if (error || !inserted) {
    if (error?.code === "23505") return { ok: false, error: "Anda sudah mengklaim promo ini." };
    throw new Error(error?.message ?? "Gagal menyimpan klaim");
  }

  // Cek ulang kuota SETELAH menyimpan: kalau dua orang mengklaim bersamaan
  // pada kuota terakhir, yang melampaui batas dibatalkan.
  if (promo.claim_quota && (await countClaims()) > promo.claim_quota) {
    await admin.from("user_promos").delete().eq("id", inserted.id);
    return { ok: false, error: "Kuota promo ini sudah habis." };
  }

  return { ok: true, claimId: inserted.id, title: promo.title };
}

async function currentUserId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** Klaim dari kartu promo. */
export async function claimPromo(promoId: string): Promise<ClaimResult> {
  try {
    const userId = await currentUserId();
    if (!userId) return { ok: false, error: "Silakan masuk dulu untuk mengklaim promo.", needLogin: true };

    const admin = createAdminClient();
    const { data: promo } = await admin.from("promos").select("*").eq("id", promoId).maybeSingle();
    if (!promo) return { ok: false, error: "Promo tidak ditemukan." };

    const result = await claim(userId, promo as Promo);
    if (result.ok) {
      revalidatePath("/promo");
      revalidatePath("/booking");
    }
    return result;
  } catch (err) {
    console.error("[claimPromo]", err);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Klaim dengan mengetik kode (di halaman promo atau di form booking). */
export async function claimPromoByCode(rawCode: string): Promise<ClaimResult> {
  try {
    const userId = await currentUserId();
    if (!userId) return { ok: false, error: "Silakan masuk dulu untuk mengklaim promo.", needLogin: true };

    const code = normalizeCode(rawCode ?? "");
    // Hanya huruf, angka, strip, dan garis bawah — sekaligus mencegah karakter khusus pada pencarian.
    if (!code || !/^[A-Z0-9_-]{2,40}$/.test(code)) return { ok: false, error: "Kode promo tidak valid." };

    const admin = createAdminClient();
    const { data: promo } = await admin.from("promos").select("*").eq("code", code).maybeSingle();
    if (!promo) return { ok: false, error: "Kode promo tidak ditemukan." };

    const result = await claim(userId, promo as Promo);
    if (result.ok) {
      revalidatePath("/promo");
      revalidatePath("/booking");
    }
    return result;
  } catch (err) {
    console.error("[claimPromoByCode]", err);
    return { ok: false, error: GENERIC_ERROR };
  }
}
