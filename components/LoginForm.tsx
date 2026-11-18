"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { PageStrings } from "@/lib/i18n/pages";

export default function LoginForm({ t }: { t: PageStrings["login"] }) {
  return (
    <Suspense fallback={null}>
      <LoginFormInner t={t} />
    </Suspense>
  );
}

function LoginFormInner({ t }: { t: PageStrings["login"] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const justRegistered = searchParams.get("registered") === "1";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setLoading(false);
      return setError(error?.message ?? t.failed);
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
    const isStaff = profile?.role === "admin" || profile?.role === "admin_wisata" || profile?.role === "super_admin";

    setLoading(false);
    // Staf (admin/super admin) selalu diarahkan ke dashboard admin.
    // User biasa mengikuti halaman yang sempat dituju sebelum login
    // (redirectTo), atau ke halaman utama jika tidak ada.
    const destination = isStaff ? "/admin" : searchParams.get("redirectTo") ?? "/";
    router.push(destination);
    router.refresh();
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <form onSubmit={handleLogin} className="card w-full max-w-sm p-6">
        <h1 className="font-display text-xl font-semibold text-forest-900">{t.title}</h1>
        <p className="mt-1 text-sm text-ink/60">
          {t.subtitle}
        </p>

        {justRegistered && !error && (
          <p className="mt-4 rounded bg-green-50 px-3 py-2 text-sm text-green-700">
            {t.registered}
          </p>
        )}
        {error && <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-5 space-y-4">
          <div>
            <label className="label-field">{t.email}</label>
            <input type="email" required className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label-field">{t.password}</label>
            <input type="password" required className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>

        <button disabled={loading} className="btn-primary mt-6 w-full">
          {loading ? t.processing : t.submit}
        </button>

        <p className="mt-4 text-center text-sm text-ink/60">
          {t.noAccount} <Link href="/register" className="font-medium text-clay-600 hover:underline">{t.signUp}</Link>
        </p>
      </form>
    </div>
  );
}
