import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VisitorManager, { type Visitor } from "@/components/VisitorManager";

const MAX = 10;

export default async function VisitorsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/profile/visitors");

  // Error (mis. migrasi belum dijalankan) → tampilkan daftar kosong, bukan crash.
  const { data } = await supabase
    .from("saved_visitors")
    .select("id, full_name, phone")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return (
    <>
      <h1 className="font-display text-3xl font-semibold text-forest-900">Data Pengunjung Tersimpan</h1>
      <p className="mt-1 mb-6 text-sm text-ink/60">
        Simpan data orang yang sering Anda ajak berkunjung. Saat memesan tiket, Anda bisa memilihnya agar nama dan nomor telepon terisi otomatis.
      </p>
      <VisitorManager visitors={(data ?? []) as Visitor[]} max={MAX} />
    </>
  );
}
