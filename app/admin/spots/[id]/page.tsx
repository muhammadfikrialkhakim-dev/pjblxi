import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WisataForm from "@/components/WisataForm";

export default async function EditSpotPage({
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
  const canAssignAdmin = profile?.role === "super_admin";
  const isWisataAdmin = profile?.role === "admin_wisata";

  const [{ data: wisata }, { data: categories }, { data: allWisataAdmins }, { data: assignedWisata }] = await Promise.all([
    supabase.from("wisata").select("*").eq("id", params.id).single(),
    supabase.from("categories").select("*").order("name"),
    canAssignAdmin
      ? supabase.from("profiles").select("*").eq("role", "admin_wisata").order("full_name")
      : Promise.resolve({ data: [] }),
    canAssignAdmin
      ? supabase.from("wisata").select("admin_id").not("admin_id", "is", null).neq("id", params.id)
      : Promise.resolve({ data: [] }),
  ]);

  if (!wisata) notFound();

  // 1 admin_wisata cuma boleh pegang 1 wisata — singkirkan dari pilihan akun
  // yang sudah ditugaskan ke wisata LAIN (selain wisata ini sendiri, supaya
  // admin yang memang sudah jadi pemiliknya tetap muncul terpilih di form).
  const assignedAdminIds = new Set((assignedWisata ?? []).map((w) => w.admin_id as string));
  const wisataAdmins = (allWisataAdmins ?? []).filter(
    (a) => !assignedAdminIds.has(a.id) || a.id === wisata.admin_id
  );

  // Jaring pengaman tambahan: Admin Wisata cuma boleh mengelola SATU wisata
  // yang ditugaskan padanya. Kalau entah bagaimana membuka id wisata orang
  // lain (mis. wisata itu berstatus 'published' sehingga tetap kelihatan),
  // lempar balik ke wisatanya sendiri — bukan yang ini.
  if (isWisataAdmin && wisata.admin_id !== user?.id) {
    redirect("/admin/spots");
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-forest-900">Edit Wisata</h1>
        <Link href={`/admin/tiket?wisata=${wisata.id}`} className="btn-secondary">
          Kelola Paket Tiket →
        </Link>
      </div>
      {searchParams.error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}
      <div className="mt-6 max-w-2xl">
        <WisataForm
          wisata={wisata}
          categories={categories ?? []}
          wisataAdmins={wisataAdmins ?? []}
          canAssignAdmin={canAssignAdmin}
        />
      </div>
    </div>
  );
}
