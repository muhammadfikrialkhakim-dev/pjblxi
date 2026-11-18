import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileSidebar from "@/components/ProfileSidebar";

export const dynamic = "force-dynamic";

const roleLabel: Record<string, string> = {
  customer: "Pelanggan",
  agent: "Agen Travel",
  admin: "Admin",
  admin_wisata: "Admin Wisata",
  super_admin: "Super Admin",
};

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/profile");

  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();

  const role: string = profile?.role ?? "customer";
  const isStaff = role === "admin" || role === "admin_wisata" || role === "super_admin";

  const providers: string[] = (user.app_metadata?.providers as string[] | undefined) ?? [];
  const providerLabel = providers.includes("email") ? "Email" : providers.includes("google") ? "Google" : "Email";

  const name: string = profile?.full_name ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? "";
  const avatarUrl: string | undefined = user.user_metadata?.avatar_url ?? user.user_metadata?.picture;
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w: string) => w[0]?.toUpperCase())
      .join("") || "U";

  return (
    <div className="container-page py-10">
      <div className="grid gap-6 lg:grid-cols-[300px_1fr] lg:items-start">
        <ProfileSidebar
          name={name}
          avatarUrl={avatarUrl}
          initials={initials}
          providerLabel={providerLabel}
          roleText={roleLabel[role] ?? role}
          isStaff={isStaff}
        />
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
