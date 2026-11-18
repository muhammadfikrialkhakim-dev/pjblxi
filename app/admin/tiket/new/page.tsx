import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Wisata } from "@/lib/types";
import TiketForm from "@/components/TiketForm";

export default async function NewTiketPage({
  searchParams,
}: {
  searchParams: { wisata?: string; error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  const isWisataAdmin = profile?.role === "admin_wisata";
  const isSuperAdmin = profile?.role === "super_admin";

  // Super Admin & Admin Wisata sama-sama boleh membuka halaman ini.
  if (!isWisataAdmin && !isSuperAdmin) redirect("/admin/tiket");

  // Admin Wisata cuma pegang 1 wisata — jangan tawarkan pilihan wisata lain
  // sama sekali di form (sebelumnya dropdown ini menampilkan SEMUA wisata
  // ke admin_wisata juga, dan kalau dia salah pilih, penyimpanan gagal diam-
  // diam karena RLS). Super Admin sebaliknya BOLEH memilih wisata mana pun.
  // Server action saveTiket tetap validasi ulang juga.
  let wisataList: Wisata[];
  let defaultWisataId = searchParams.wisata;

  if (isWisataAdmin) {
    const { data: ownWisata } = await supabase.from("wisata").select("*").eq("admin_id", user?.id).maybeSingle();
    wisataList = ownWisata ? [ownWisata as Wisata] : [];
    defaultWisataId = ownWisata?.id;
  } else {
    const { data } = await supabase.from("wisata").select("*").order("name");
    wisataList = (data as Wisata[] | null) ?? [];
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-forest-900">Tambah Paket Tiket</h1>
      {searchParams.error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}
      <div className="mt-6 max-w-xl">
        <TiketForm wisataList={wisataList} defaultWisataId={defaultWisataId} lockWisata={isWisataAdmin} />
      </div>
    </div>
  );
}
