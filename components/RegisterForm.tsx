"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { PageStrings } from "@/lib/i18n/pages";

export default function RegisterForm({ t }: { t: PageStrings["register"] }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error || !data.user) {
      setLoading(false);
      return setError(error?.message ?? t.failed);
    }

    // Row di public.profiles dibuat otomatis oleh trigger database
    // (lihat supabase/migration_auto_create_profile.sql), jadi tidak
    // perlu insert manual di sini lagi — sebelumnya insert ini bisa
    // gagal diam-diam dan menyebabkan booking error foreign key.

    setLoading(false);
    router.push("/login?registered=1");
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <form onSubmit={handleRegister} className="card w-full max-w-sm p-6">
        <h1 className="font-display text-xl font-semibold text-forest-900">{t.title}</h1>
        <p className="mt-1 text-sm text-ink/60">{t.subtitle}</p>

        {error && <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-5 space-y-4">
          <div>
            <label className="label-field">{t.fullName}</label>
            <input required className="input-field" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="label-field">{t.email}</label>
            <input type="email" required className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label-field">{t.password}</label>
            <input type="password" required minLength={6} className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>

        <button disabled={loading} className="btn-primary mt-6 w-full">
          {loading ? t.processing : t.submit}
        </button>

        <p className="mt-4 text-center text-sm text-ink/60">
          {t.hasAccount} <Link href="/login" className="font-medium text-clay-600 hover:underline">{t.signIn}</Link>
        </p>
      </form>
    </div>
  );
}
