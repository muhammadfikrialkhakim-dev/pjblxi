"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function submitReview(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const wisata_id = formData.get("wisata_id") as string;
  const wisata_slug = formData.get("wisata_slug") as string;

  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/destinations/${wisata_slug}`)}`);
  }

  const rating = Number(formData.get("rating"));
  const komentar = (formData.get("komentar") as string) || null;

  if (!rating || rating < 1 || rating > 5) {
    throw new Error("Pilih rating 1-5 bintang terlebih dahulu.");
  }

  // Verified purchase: hanya pembeli dengan pesanan LUNAS yang boleh mengulas
  // (dijaga juga oleh RLS lewat has_paid_order_for_wisata).
  const { data: tiketRows } = await supabase.from("tiket").select("id").eq("wisata_id", wisata_id);
  const tiketIds = (tiketRows ?? []).map((t) => t.id);
  const { data: paid } = tiketIds.length
    ? await supabase
        .from("orders")
        .select("id")
        .eq("customer_id", user.id)
        .eq("payment_status", "paid")
        .in("tiket_id", tiketIds)
        .limit(1)
    : { data: [] as { id: string }[] };
  if (!paid?.length) {
    throw new Error("Ulasan hanya untuk pengunjung yang sudah membeli tiket wisata ini.");
  }

  // upsert: kalau user sudah pernah menilai wisata ini, perbarui ulasannya
  // (dijaga juga oleh constraint unique(wisata_id, customer_id) di database).
  const { error } = await supabase
    .from("ulasan")
    .upsert(
      { wisata_id, customer_id: user.id, rating, komentar, is_verified_purchase: true },
      { onConflict: "wisata_id,customer_id" }
    );

  if (error) throw new Error(error.message);

  revalidatePath(`/destinations/${wisata_slug}`);
}

/** Jempol baik (1) / buruk (-1) pada sebuah ulasan. Klik lagi untuk membatalkan. */
export async function reactToReview(ulasanId: string, value: 1 | -1, wisataSlug: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, needsLogin: true as const };

  const { data: existing } = await supabase
    .from("ulasan_reaksi")
    .select("id, value")
    .eq("ulasan_id", ulasanId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing && existing.value === value) {
    await supabase.from("ulasan_reaksi").delete().eq("id", existing.id);
  } else if (existing) {
    await supabase.from("ulasan_reaksi").update({ value }).eq("id", existing.id);
  } else {
    const { error } = await supabase.from("ulasan_reaksi").insert({ ulasan_id: ulasanId, user_id: user.id, value });
    if (error) return { ok: false as const, error: error.message };
  }

  revalidatePath(`/destinations/${wisataSlug}`);
  return { ok: true as const };
}

/** Balas sebuah ulasan (semua user yang login boleh). */
export async function replyToReview(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const wisataSlug = formData.get("wisata_slug") as string;
  if (!user) redirect(`/login?redirectTo=${encodeURIComponent(`/destinations/${wisataSlug}`)}`);

  const ulasanId = formData.get("ulasan_id") as string;
  const komentar = ((formData.get("komentar") as string) || "").trim().slice(0, 1000);
  if (!komentar) return;

  const { error } = await supabase.from("ulasan_balasan").insert({ ulasan_id: ulasanId, user_id: user.id, komentar });
  if (error) throw new Error(error.message);
  revalidatePath(`/destinations/${wisataSlug}`);
}

export async function deleteReply(formData: FormData) {
  const supabase = createClient();
  const id = formData.get("reply_id") as string;
  const wisataSlug = formData.get("wisata_slug") as string;
  await supabase.from("ulasan_balasan").delete().eq("id", id);
  revalidatePath(`/destinations/${wisataSlug}`);
}
