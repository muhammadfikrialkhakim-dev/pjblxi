import { ShieldCheck, ArrowDownCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Profile } from "@/lib/types";
import { promoteToAdmin, demoteToMember } from "./actions";

export default async function AdminAdminsPage() {
  const supabase = createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["admin", "super_admin"])
    .order("created_at", { ascending: false });

  let emailById = new Map<string, string>();
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    emailById = new Map(data.users.map((u) => [u.id, u.email ?? "-"]));
  } catch {
    // SUPABASE_SERVICE_ROLE_KEY belum diset.
  }

  const admins = (profiles ?? []) as Profile[];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-forest-900">Kelola Data Admin</h1>
      <p className="mt-1 text-sm text-ink/60">
        Hanya Super Admin yang bisa menaikkan member menjadi admin atau menurunkannya kembali.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h2 className="mb-3 font-medium text-forest-900">Jadikan Admin</h2>
          <form action={promoteToAdmin} className="card space-y-4 p-6">
            <div>
              <label className="label-field">Email Akun</label>
              <input
                name="email"
                type="email"
                required
                className="input-field"
                placeholder="member@email.com"
              />
              <p className="mt-1.5 text-xs text-ink/40">
                Akun harus sudah pernah daftar/login sebagai member terlebih dahulu.
              </p>
            </div>
            <button type="submit" className="btn-primary">
              <ShieldCheck className="h-4 w-4" /> Jadikan Admin
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-forest-50 text-ink/60">
                <tr>
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id} className="border-t border-forest-50">
                    <td className="px-4 py-3 font-medium text-forest-900">{a.full_name || "-"}</td>
                    <td className="px-4 py-3 text-ink/70">{emailById.get(a.id) ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          a.role === "super_admin" ? "bg-clay-100 text-clay-700" : "bg-forest-100 text-forest-800"
                        }`}
                      >
                        {a.role === "super_admin" ? "Super Admin" : "Admin"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.role === "admin" && (
                        <form action={demoteToMember.bind(null, a.id)}>
                          <button
                            className="inline-flex items-center gap-1.5 rounded p-1.5 text-sm text-red-600 hover:bg-red-50"
                            title="Turunkan jadi member"
                          >
                            <ArrowDownCircle className="h-4 w-4" /> Turunkan
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
                {!admins.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-ink/50">Belum ada admin.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
