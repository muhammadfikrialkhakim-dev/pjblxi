import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Promo } from "@/lib/promo";
import PromoForm from "@/components/PromoForm";

export default async function EditPromoPage({
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
  const isSuperAdmin = profile?.role === "super_admin";
  if (!isWisataAdmin && !isSuperAdmin) redirect("/admin");

  const { data } = await supabase.from("promos").select("*").eq("id", params.id).maybeSingle();
  if (!data) notFound();
  const promo = data as Promo;

  let wisataList: { id: string; name: string }[];
  if (isWisataAdmin) {
    const { data: own } = await supabase.from("wisata").select("id, name").eq("admin_id", user?.id).maybeSingle();
    // Promo wisata lain / promo umum bukan wewenang Admin Wisata.
    if (!own || promo.wisata_id !== own.id) redirect("/admin/promos");
    wisataList = [own];
  } else {
    const { data: all } = await supabase.from("wisata").select("id, name").order("name");
    wisataList = all ?? [];
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-forest-900">Edit Promo</h1>
      {searchParams.error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{searchParams.error}</p>
      )}
      <div className="mt-6 max-w-2xl">
        <PromoForm promo={promo} wisataList={wisataList} lockWisata={isWisataAdmin} />
      </div>
    </div>
  );
}
