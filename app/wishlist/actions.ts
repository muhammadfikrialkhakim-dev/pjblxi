"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Tambah/hapus wisata dari wishlist user yang sedang login. */
export async function toggleWishlist(wisataId: string, wisataSlug?: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, needsLogin: true as const };

  const { data: existing } = await supabase
    .from("wishlist")
    .select("id")
    .eq("customer_id", user.id)
    .eq("wisata_id", wisataId)
    .maybeSingle();

  if (existing) {
    await supabase.from("wishlist").delete().eq("id", existing.id);
  } else {
    const { error } = await supabase.from("wishlist").insert({ customer_id: user.id, wisata_id: wisataId });
    if (error) return { ok: false as const, error: error.message };
  }

  revalidatePath("/wishlist");
  if (wisataSlug) revalidatePath(`/destinations/${wisataSlug}`);
  return { ok: true as const, wishlisted: !existing };
}
