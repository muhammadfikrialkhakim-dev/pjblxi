"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/app/profile/actions";

const MAX_VISITORS = 10;

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/profile/visitors");
  return { supabase, user };
}

/** Tambah (tanpa id) atau ubah (dengan id) data pengunjung tersimpan. */
export async function saveVisitor(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser();

  const id = String(formData.get("id") ?? "");
  const full_name = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (full_name.length < 2) return { ok: false, message: "Nama minimal 2 karakter." };
  if (full_name.length > 100) return { ok: false, message: "Nama maksimal 100 karakter." };
  if (phone && !/^\+?[0-9][0-9\s-]{7,19}$/.test(phone)) {
    return { ok: false, message: "Nomor telepon tidak valid (8–20 digit, boleh diawali +)." };
  }

  if (id) {
    const { error } = await supabase
      .from("saved_visitors")
      .update({ full_name, phone: phone || null })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { count } = await supabase
      .from("saved_visitors")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if ((count ?? 0) >= MAX_VISITORS) {
      return { ok: false, message: `Maksimal ${MAX_VISITORS} data pengunjung tersimpan.` };
    }
    const { error } = await supabase.from("saved_visitors").insert({ user_id: user.id, full_name, phone: phone || null });
    if (error) {
      return {
        ok: false,
        message: /relation|schema cache/i.test(error.message)
          ? "Tabel belum dibuat — jalankan supabase/migration_profile_menu_features.sql."
          : error.message,
      };
    }
  }

  revalidatePath("/profile/visitors");
  revalidatePath("/booking");
  return { ok: true, message: id ? "Data pengunjung diperbarui." : "Data pengunjung ditambahkan." };
}

export async function deleteVisitor(id: string): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("saved_visitors").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/profile/visitors");
  revalidatePath("/booking");
  return { ok: true, message: "Data pengunjung dihapus." };
}
