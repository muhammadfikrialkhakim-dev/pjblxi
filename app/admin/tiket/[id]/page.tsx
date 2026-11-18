import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Wisata } from "@/lib/types";
import TiketForm from "@/components/TiketForm";

export default async function EditTiketPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  const isWisataAdmin = profile?.role === "admin_wisata";

  const [{ data: tiket }, wisataResult] = await Promise.all([
    supabase.from("tiket").select("*").eq("id", params.id).single(),
    isWisataAdmin
      ? supabase.from("wisata").select("*").eq("admin_id", user?.id).maybeSingle()
      : supabase.from("wisata").select("*").order("name"),
  ]);

  if (!tiket) notFound();

  // Sama seperti halaman Edit Wisata: admin_wisata cuma boleh mengelola
  // paket tiket milik wisatanya sendiri, meskipun tiket aktif dari wisata
  // lain tetap bisa ke-load lewat policy "baca publik".
  if (isWisataAdmin) {
    const { data: owns } = await supabase
      .from("wisata")
      .select("id")
      .eq("id", tiket.wisata_id)
      .eq("admin_id", user?.id)
      .maybeSingle();
    if (!owns) redirect("/admin/tiket");
  }

  // Admin Wisata cuma pegang 1 wisata — kunci field-nya (lihat lockWisata di
  // TiketForm), bukan dropdown semua wisata seperti sebelumnya.
  const wisataList: Wisata[] = isWisataAdmin
    ? wisataResult.data
      ? [wisataResult.data as Wisata]
      : []
    : ((wisataResult.data as Wisata[] | null) ?? []);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-forest-900">Edit Paket Tiket</h1>
      {searchParams.error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}
      <div className="mt-6 max-w-xl">
        <TiketForm tiket={tiket} wisataList={wisataList} lockWisata={isWisataAdmin} />
      </div>
    </div>
  );
}
