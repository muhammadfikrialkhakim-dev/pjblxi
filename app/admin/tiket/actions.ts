"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveTiket(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  const isWisataAdmin = profile?.role === "admin_wisata";
  const isSuperAdmin = profile?.role === "super_admin";

  const id = formData.get("id") as string | null;
  const wisata_id = formData.get("wisata_id") as string;

  const editPath = id ? `/admin/tiket/${id}` : `/admin/tiket/new?wisata=${wisata_id}`;

  // Super Admin & Admin Wisata sama-sama boleh menambah paket tiket baru.
  // Selain keduanya (mis. role 'admin' biasa yang sudah tidak punya akses
  // panel sama sekali) ditolak, jaga-jaga kalau ada yang mengakali lewat
  // devtools/curl.
  if (!isWisataAdmin && !isSuperAdmin) {
    redirect("/admin/tiket");
  }

  // Admin Wisata cuma boleh mengelola paket tiket milik SATU wisata yang
  // ditugaskan padanya. Jangan percaya "wisata_id" dari form begitu saja —
  // field ini sudah dikunci di UI (lihat lockWisata di TiketForm), tapi form
  // HTML tetap bisa dipalsukan lewat devtools/curl. Sebelumnya field ini
  // tidak divalidasi sama sekali di server, jadi kalau nilainya bukan milik
  // admin_wisata yang bersangkutan, RLS akan menolak UPDATE/INSERT-nya tapi
  // errornya tidak pernah dicek di bawah — hasilnya pengguna diarahkan
  // seolah-olah tersimpan padahal tidak ada yang berubah sama sekali.
  if (isWisataAdmin) {
    const { data: owns } = await supabase
      .from("wisata")
      .select("id")
      .eq("id", wisata_id)
      .eq("admin_id", user?.id)
      .maybeSingle();
    if (!owns) {
      const separator = editPath.includes("?") ? "&" : "?";
      redirect(`${editPath}${separator}error=${encodeURIComponent("Anda tidak berhak mengelola tiket wisata ini.")}`);
    }
  }

  const payload = {
    wisata_id,
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    price: Number(formData.get("price")),
    original_price: formData.get("original_price") ? Number(formData.get("original_price")) : null,
    quota_per_day: Number(formData.get("quota_per_day") || 100),
    is_active: formData.get("is_active") === "on",
  };

  const { error } = id
    ? await supabase.from("tiket").update(payload).eq("id", id)
    : await supabase.from("tiket").insert(payload);

  if (error) {
    // Sama seperti saveWisata: jangan diam-diam anggap berhasil kalau
    // RLS/DB menolak penyimpanan — lempar balik ke form dengan pesan error.
    const separator = editPath.includes("?") ? "&" : "?";
    redirect(`${editPath}${separator}error=${encodeURIComponent("Gagal menyimpan paket tiket: " + error.message)}`);
  }

  revalidatePath("/admin/tiket");
  redirect(`/admin/tiket?wisata=${wisata_id}`);
}

export async function deleteTiket(id: string) {
  "use server";
  const supabase = createClient();
  const { error } = await supabase.from("tiket").delete().eq("id", id);

  if (error) {
    // 23503 = foreign_key_violation: paket ini sudah pernah dipesan, jadi
    // barisnya tidak boleh dihapus (riwayat transaksi di tabel orders masih
    // merujuk ke sana). Sebagai gantinya paket dinonaktifkan — hilang dari
    // halaman pemesanan, tapi riwayat transaksi & laporan tetap utuh.
    if (error.code === "23503") {
      const { error: deactivateError } = await supabase.from("tiket").update({ is_active: false }).eq("id", id);
      if (deactivateError) {
        redirect(`/admin/tiket?error=${encodeURIComponent("Gagal menonaktifkan paket tiket: " + deactivateError.message)}`);
      }
      revalidatePath("/admin/tiket");
      redirect(
        `/admin/tiket?notice=${encodeURIComponent(
          "Paket tiket ini sudah pernah dipesan sehingga tidak bisa dihapus permanen. Paket dinonaktifkan agar tidak tampil lagi untuk pelanggan, riwayat transaksi tetap aman."
        )}`
      );
    }
    redirect(`/admin/tiket?error=${encodeURIComponent("Gagal menghapus paket tiket: " + error.message)}`);
  }
  revalidatePath("/admin/tiket");
}
