"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PasswordInput from "@/components/PasswordInput";
import PasswordStrength, { evaluatePassword } from "@/components/PasswordStrength";

/** Form ganti kata sandi (tab "Kata Sandi & Keamanan" di halaman Profil). */
export default function PasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);

    if (password !== confirm) return setError("Konfirmasi kata sandi tidak sama.");
    if (evaluatePassword(password).level === 1 && password.length < 6) return setError("Kata sandi minimal 6 karakter.");

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      return setError(
        /different from the old password/i.test(error.message)
          ? "Kata sandi baru harus berbeda dari yang lama."
          : /at least/i.test(error.message)
            ? "Kata sandi minimal 6 karakter."
            : error.message
      );
    }
    setPassword("");
    setConfirm("");
    setDone(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {done && (
        <p className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" /> Kata sandi berhasil diperbarui.
        </p>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink/70">Kata Sandi Baru</label>
        <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" minLength={6} placeholder="Minimal 6 karakter" />
        <PasswordStrength password={password} />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink/70">Ulangi Kata Sandi Baru</label>
        <PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" minLength={6} placeholder="Ketik ulang kata sandi" />
      </div>

      <div className="flex justify-end">
        <button disabled={loading} className="btn-primary rounded-lg px-8">
          {loading ? "Menyimpan..." : "Simpan Kata Sandi"}
        </button>
      </div>
    </form>
  );
}
