import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WisataForm from "@/components/WisataForm";

export default async function NewSpotPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  const canAssignAdmin = profile?.role === "super_admin";

  // Admin Wisata cuma mengelola SATU wisata yang sudah ditugaskan padanya
  // dan tidak pernah boleh membuat wisata baru — jangan biarkan dia
  // mendarat di form ini lewat URL langsung.
  if (profile?.role === "admin_wisata") redirect("/admin/spots");

  const [{ data: categories }, { data: allWisataAdmins }, { data: assignedWisata }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    canAssignAdmin
      ? supabase.from("profiles").select("*").eq("role", "admin_wisata").order("full_name")
      : Promise.resolve({ data: [] }),
    canAssignAdmin
      ? supabase.from("wisata").select("admin_id").not("admin_id", "is", null)
      : Promise.resolve({ data: [] }),
  ]);

  // 1 admin_wisata cuma boleh pegang 1 wisata — karena ini form TAMBAH wisata
  // baru (belum ada admin_id lama yang perlu dikecualikan), singkirkan semua
  // akun admin_wisata yang sudah ditugaskan ke wisata manapun dari pilihan,
  // supaya Super Admin tidak bisa memilih admin yang sudah punya wisata lain.
  const assignedAdminIds = new Set((assignedWisata ?? []).map((w) => w.admin_id as string));
  const wisataAdmins = (allWisataAdmins ?? []).filter((a) => !assignedAdminIds.has(a.id));

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-forest-900">Tambah Wisata</h1>
      {searchParams.error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}
      <div className="mt-6 max-w-2xl">
        <WisataForm categories={categories ?? []} wisataAdmins={wisataAdmins ?? []} canAssignAdmin={canAssignAdmin} />
      </div>
    </div>
  );
}
