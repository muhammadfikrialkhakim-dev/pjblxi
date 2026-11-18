"use client";

import { useTransition } from "react";
import { Trash2, Loader2, Lock } from "lucide-react";
import { Profile } from "@/lib/types";
import { changeUserRole, deleteAccount } from "@/app/admin/super/actions";

const roleLabel: Record<string, string> = {
  customer: "Customer",
  agent: "Agent",
  admin: "Admin (tanpa akses panel)",
  admin_wisata: "Admin Wisata",
  super_admin: "Super Admin",
};

export default function AccountRowActions({
  profile,
  roleOptions,
}: {
  profile: Profile;
  roleOptions: string[];
}) {
  const [isPending, startTransition] = useTransition();

  // Super Admin bersifat permanen: role tidak bisa diubah dan akun tidak bisa
  // dihapus lewat UI (dijaga juga di server action & trigger database).
  if (profile.role === "super_admin") {
    return (
      <div
        className="flex items-center justify-end gap-1.5 text-xs font-medium text-ink/50"
        title="Super Admin bersifat permanen dan tidak dapat diubah atau dihapus"
      >
        <Lock className="h-3.5 w-3.5" />
        Permanen
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <select
        disabled={isPending}
        defaultValue={profile.role}
        onChange={(e) => startTransition(() => changeUserRole(profile.id, e.target.value))}
        className="rounded border border-forest-200 bg-white px-2 py-1 text-xs text-ink/80 disabled:opacity-50"
      >
        {roleOptions.map((r) => (
          <option key={r} value={r}>{roleLabel[r] ?? r}</option>
        ))}
      </select>

      <button
        disabled={isPending}
        onClick={() => {
          if (confirm(`Hapus akun "${profile.full_name ?? "ini"}" secara permanen?`)) {
            startTransition(() => deleteAccount(profile.id));
          }
        }}
        className="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
        title="Hapus akun"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
