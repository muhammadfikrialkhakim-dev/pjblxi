"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Alamat daftar wisata untuk redirect setelah hapus: kembali ke halaman &
 * filter (cari/urut/halaman) yang sedang dibuka pengguna, plus penanda ?flash
 * agar dialog hasil muncul. Hanya path /admin/spots dari Referer yang dipakai,
 * jadi tidak bisa dijadikan open redirect.
 */
function spotsListUrl(flash: string, name?: string) {
  let base = "/admin/spots";
  try {
    const ref = headers().get("referer");
    if (ref) {
      const u = new URL(ref);
      if (u.pathname === "/admin/spots") {
        u.searchParams.delete("flash");
        u.searchParams.delete("n");
        base = u.pathname + u.search;
      }
    }
  } catch {
    // Referer tidak ada / tidak valid — pakai daftar polos.
  }
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}flash=${flash}${name ? `&n=${encodeURIComponent(name.slice(0, 80))}` : ""}`;
}

export async function saveWisata(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  const isSuperAdmin = profile?.role === "super_admin";
  const isWisataAdmin = profile?.role === "admin_wisata";

  const id = formData.get("id") as string | null;
  const name = formData.get("name") as string;

  // Admin Wisata cuma boleh mengelola SATU wisata yang sudah ditugaskan
  // padanya — dia tidak pernah boleh membuat wisata baru, walau nekat
  // membuka /admin/spots/new langsung lewat URL.
  if (isWisataAdmin && !id) {
    redirect("/admin/spots");
  }

  const galleryRaw = (formData.get("gallery_urls") as string) ?? "";
  const gallery_urls = galleryRaw
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  const facilitiesRaw = (formData.get("facilities") as string) ?? "";
  const facilities = facilitiesRaw
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  const tipsRaw = (formData.get("tips") as string) ?? "";
  const tips = tipsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const payload: Record<string, unknown> = {
    name,
    slug: slugify(name),
    category_id: (formData.get("category_id") as string) || null,
    location: formData.get("location") as string,
    short_description: formData.get("short_description") as string,
    description: formData.get("description") as string,
    cover_image_url: formData.get("cover_image_url") as string,
    gallery_urls,
    facilities,
    opening_hours: (formData.get("opening_hours") as string) || null,
    contact_phone: (formData.get("contact_phone") as string) || null,
    estimated_duration: (formData.get("estimated_duration") as string) || null,
    best_time_to_visit: (formData.get("best_time_to_visit") as string) || null,
    age_restriction: ((formData.get("age_restriction") as string) || "").trim() || null,
    tips,
    is_trending: formData.get("is_trending") === "on",
    status: formData.get("status") as string,
  };

  // Field "Admin Wisata" cuma dirender di form untuk Super Admin — tapi
  // form HTML bisa dimanipulasi (devtools/curl) untuk tetap mengirim
  // field ini. Jangan percaya keberadaan field di formData saja; cek
  // ulang role di server supaya admin biasa/admin_wisata tidak bisa
  // menugaskan ulang (atau melepas) kepemilikan wisata lewat request
  // yang dipalsukan.
  const editPath = id ? `/admin/spots/${id}` : "/admin/spots/new";

  if (isSuperAdmin && formData.has("admin_id")) {
    const newAdminId = (formData.get("admin_id") as string) || null;

    if (newAdminId) {
      // Aturan: 1 admin_wisata cuma boleh pegang 1 wisata. Dropdown di form
      // sudah menyaring pilihan, tapi form HTML bisa dipalsukan (devtools/curl)
      // untuk tetap mengirim admin_id yang sudah dipakai wisata lain — jadi
      // cek ulang di server sebelum simpan, jangan cuma andalkan UI atau
      // unique index DB (yang pesan errornya kurang ramah untuk ditampilkan).
      let ownerCheck = supabase.from("wisata").select("id, name").eq("admin_id", newAdminId);
      if (id) ownerCheck = ownerCheck.neq("id", id);
      const { data: alreadyOwned } = await ownerCheck.maybeSingle();

      if (alreadyOwned) {
        redirect(
          `${editPath}?error=${encodeURIComponent(
            `Gagal menyimpan wisata: admin ini sudah ditugaskan mengelola wisata "${alreadyOwned.name}". Satu admin wisata hanya boleh mengelola satu wisata.`
          )}`
        );
      }
    }

    payload.admin_id = newAdminId;
  }

  const { error } = id
    ? await supabase.from("wisata").update(payload).eq("id", id)
    : await supabase.from("wisata").insert(payload);

  if (error) {
    // Jangan diam-diam anggap berhasil kalau RLS/DB menolak (mis. admin_wisata
    // yang nekat mencoba mengubah wisata orang lain lewat request yang
    // dipalsukan) — lempar balik ke form dengan pesan error, bukan redirect
    // ke list seolah-olah tersimpan.
    redirect(`${editPath}?error=${encodeURIComponent("Gagal menyimpan wisata: " + error.message)}`);
  }

  revalidatePath("/admin/spots");
  revalidatePath(`/admin/spots/${id}`);
  revalidatePath("/destinations");
  revalidatePath(`/destinations/${payload.slug}`);

  // Admin Wisata tidak punya daftar wisata (halaman /admin/spots melempar dia
  // ke halaman edit wisatanya), jadi langsung kembali ke sana dengan penanda
  // flash — kalau tidak, parameter hilang di redirect kedua.
  const flash = id ? "spot-updated" : "spot-created";
  const target = isWisataAdmin ? `/admin/spots/${id}` : "/admin/spots";
  redirect(`${target}?flash=${flash}&n=${encodeURIComponent(String(name ?? "").slice(0, 80))}`);
}

export async function deleteWisata(id: string) {
  "use server";
  const supabase = createClient();

  // Tombol hapus di UI cuma dirender untuk Super Admin (lihat
  // app/admin/spots/page.tsx) — tegaskan juga di server, jangan andalkan
  // UI saja, supaya request yang dipalsukan tidak bisa memicu hapus data.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  if (profile?.role !== "super_admin") return;

  const { data: wisata } = await supabase
    .from("wisata")
    .select("name, cover_image_url, gallery_urls")
    .eq("id", id)
    .single();

  const { data: deleted, error: deleteError } = await supabase.from("wisata").delete().eq("id", id).select("id");

  // Jangan diam-diam anggap berhasil: kalau database menolak (mis. masih ada
  // pesanan yang terkait) atau tidak ada baris yang terhapus, beri tahu.
  if (deleteError || !deleted?.length) {
    redirect(spotsListUrl("spot-delete-failed", wisata?.name));
  }

  const allUrls = [wisata?.cover_image_url, ...(wisata?.gallery_urls ?? [])].filter(
    (u): u is string => !!u && u.includes("/wisata-images/")
  );

  if (allUrls.length) {
    const paths = allUrls.map((u) => u.split("/wisata-images/")[1]).filter(Boolean);
    if (paths.length) await supabase.storage.from("wisata-images").remove(paths);
  }

  revalidatePath("/admin/spots");
  redirect(spotsListUrl("spot-deleted", wisata?.name));
}
