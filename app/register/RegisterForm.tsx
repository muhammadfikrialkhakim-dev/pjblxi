"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthShell from "@/components/AuthShell";
import GoogleButton from "@/components/GoogleButton";
import PasswordInput from "@/components/PasswordInput";
import IconInput from "@/components/IconInput";
import PasswordStrength from "@/components/PasswordStrength";
import { Mail, User } from "lucide-react";

export default function RegisterForm({ panelImage }: { panelImage?: string | null }) {
  return (
    <Suspense fallback={null}>
      <RegisterFormInner panelImage={panelImage} />
    </Suspense>
  );
}

function friendlyError(message?: string) {
  if (!message) return "Gagal mendaftar. Coba lagi.";
  if (/already registered|already been registered/i.test(message)) return "Email ini sudah terdaftar. Silakan masuk.";
  if (/password should be at least/i.test(message)) return "Kata sandi minimal 6 karakter.";
  if (/rate limit/i.test(message)) return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
  return message;
}

function RegisterFormInner({ panelImage }: { panelImage?: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const rawRedirect = searchParams.get("redirectTo");
  const redirectTo = rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/";

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
      return setError(friendlyError(error?.message));
    }

    // Row di public.profiles dibuat otomatis oleh trigger database
    // (lihat supabase/migration_auto_create_profile.sql), jadi tidak
    // perlu insert manual di sini lagi — sebelumnya insert ini bisa
    // gagal diam-diam dan menyebabkan booking error foreign key.

    setLoading(false);
    router.push("/login?registered=1");
  }

  return (
    <AuthShell
      panelImage={panelImage}
      title="Buat akun baru"
      subtitle="Daftar untuk memesan tiket wisata Malang."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-clay-600 hover:underline">
            Masuk
          </Link>
        </>
      }
    >
      {error && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <GoogleButton label="Daftar dengan Google" dividerLabel="atau daftar dengan email" next={redirectTo} />


      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="label-field">Nama Lengkap</label>
          <IconInput
            icon={User}
            required
            autoComplete="name"
            placeholder="Nama sesuai identitas"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
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
          <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" minLength={6} placeholder="Minimal 6 karakter" />
          <PasswordStrength password={password} />
        </div>
        <button disabled={loading} className="btn-primary w-full rounded-lg py-3 text-base shadow-md shadow-clay-500/25">
          {loading ? "Memproses..." : "Daftar"}
        </button>
      </form>
    </AuthShell>
  );
}
