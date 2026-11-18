import { createAccountWithRole } from "@/app/admin/super/actions";

export default function NewAdminPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-forest-900">Tambah Admin</h1>

      <form action={createAccountWithRole} className="card mt-6 max-w-md space-y-5 p-6">
        <div>
          <label className="label-field">Nama Lengkap</label>
          <input name="full_name" required className="input-field" />
        </div>
        <div>
          <label className="label-field">Email</label>
          <input type="email" name="email" required className="input-field" />
        </div>
        <div>
          <label className="label-field">Kata Sandi</label>
          <input type="password" name="password" required minLength={6} className="input-field" />
        </div>
        <div>
          <label className="label-field">Role</label>
          <select name="role" defaultValue="admin_wisata" className="input-field">
            <option value="admin_wisata">Admin Wisata</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin (tanpa akses panel)</option>
          </select>
          <p className="mt-1 text-xs text-ink/40">
            Admin Wisata hanya bisa mengelola satu wisata — tugaskan wisatanya nanti lewat menu Kelola Wisata.
            Role &quot;Admin&quot; biasa sudah tidak punya menu apa pun di panel ini — semua fitur sekarang
            eksklusif Super Admin, jadi jangan pilih role ini kecuali memang sengaja.
          </p>
        </div>

        <button type="submit" className="btn-primary">
          Buat Akun
        </button>
      </form>
    </div>
  );
}
