"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthShell from "@/components/AuthShell";
import GoogleButton from "@/components/GoogleButton";
import PasswordInput from "@/components/PasswordInput";
import IconInput from "@/components/IconInput";
import { Mail } from "lucide-react";

export default function LoginForm({ panelImage }: { panelImage?: string | null }) {
  return (
    <Suspense fallback={null}>
      <LoginFormInner panelImage={panelImage} />
    </Suspense>
  );
}

function friendlyError(message?: string) {
  if (!message) return "Gagal masuk. Coba lagi.";
  if (/invalid login credentials/i.test(message)) return "Email atau kata sandi salah.";
  if (/email not confirmed/i.test(message)) return "Email Anda belum dikonfirmasi. Cek kotak masuk untuk tautan konfirmasi.";
  return message;
}

function LoginFormInner({ panelImage }: { panelImage?: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "google" ? "Masuk dengan Google gagal. Silakan coba lagi." : null
  );
  const [loading, setLoading] = useState(false);
  const justRegistered = searchParams.get("registered") === "1";

  // Hanya terima path internal supaya tidak bisa dipakai sebagai open redirect.
  const rawRedirect = searchParams.get("redirectTo");
  const redirectTo = rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setLoading(false);
      return setError(friendlyError(error?.message));
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
    const isStaff = profile?.role === "admin" || profile?.role === "admin_wisata" || profile?.role === "super_admin";

    setLoading(false);
    // Staf (admin/super admin) selalu diarahkan ke dashboard admin.
    // User biasa mengikuti halaman yang sempat dituju sebelum login
    // (redirectTo), atau ke halaman utama jika tidak ada.
    router.push(isStaff ? "/admin" : redirectTo);
    router.refresh();
  }

  return (
    <AuthShell
      panelImage={panelImage}
      title="Selamat datang kembali"
      subtitle="Masuk untuk melihat pesanan dan riwayat transaksi Anda."
      footer={
        <>
          Belum punya akun?{" "}
          <Link href="/register" className="font-medium text-clay-600 hover:underline">
            Daftar
          </Link>
        </>
      }
    >
      {justRegistered && !error && (
        <p className="mb-4 rounded bg-green-50 px-3 py-2 text-sm text-green-700">
          Pendaftaran berhasil. Silakan masuk dengan akun Anda.
        </p>
      )}
      {error && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <GoogleButton label="Masuk dengan Google" dividerLabel="atau dengan email" next={redirectTo} />


      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="label-field">Email</label>
          <IconInput
            icon={Mail}
            type="email"
            required
            autoComplete="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label-field">Kata Sandi</label>
          <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" placeholder="Kata sandi Anda" />
        </div>
        <button disabled={loading} className="btn-primary w-full rounded-lg py-3 text-base shadow-md shadow-clay-500/25">
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>
    </AuthShell>
  );
}
