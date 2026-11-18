import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NotificationSettings from "@/components/NotificationSettings";

export default async function NotificationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/profile/notifications");

  // select("*") supaya tetap jalan sebelum migrasi kolom dijalankan (pakai default).
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return (
    <>
      <h1 className="font-display text-3xl font-semibold text-forest-900">Pengaturan Notifikasi</h1>
      <p className="mt-1 mb-6 text-sm text-ink/60">Atur email apa saja yang ingin Anda terima.</p>
      <NotificationSettings
        email={user.email ?? ""}
        initial={{
          notify_order_email: profile?.notify_order_email ?? true,
          notify_promo_email: profile?.notify_promo_email ?? false,
        }}
      />
    </>
  );
}
