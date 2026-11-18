"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/app/profile/actions";

const KEYS = ["notify_order_email", "notify_promo_email"] as const;

export async function setNotificationPref(key: string, value: boolean): Promise<FormState> {
  if (!(KEYS as readonly string[]).includes(key)) return { ok: false, message: "Pengaturan tidak dikenal." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/profile/notifications");

  const { error } = await supabase.from("profiles").update({ [key]: value }).eq("id", user.id);
  if (error) {
    return {
      ok: false,
      message: /column|schema cache/i.test(error.message)
        ? "Kolom belum dibuat — jalankan supabase/migration_profile_menu_features.sql."
        : error.message,
    };
  }
  revalidatePath("/profile/notifications");
  return { ok: true, message: "Tersimpan." };
}
