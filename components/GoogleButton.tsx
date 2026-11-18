"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Tombol "Lanjutkan dengan Google". Saat diklik, pengguna langsung dibawa
 * ke halaman pemilihan akun Google (prompt=select_account), lalu kembali ke
 * /auth/callback untuk dibuatkan sesi.
 */
export default function GoogleButton({
  label,
  dividerLabel,
  next = "/",
}: {
  label: string;
  dividerLabel: string;
  next?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tombol (dan pemisahnya) baru tampil kalau NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED=true
  // di .env.local — yaitu setelah provider Google diaktifkan di Supabase.
  if (process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED !== "true") return null;

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        queryParams: { prompt: "select_account" },
      },
    });
    // Kalau berhasil, browser sudah pindah ke Google — baris di bawah hanya jalan saat gagal.
    if (error) {
      setLoading(false);
      setError("Tidak bisa membuka Google. Coba lagi sebentar.");
    }
  }

  return (
    <div className="mb-5">
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded border border-forest-200 bg-white px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-forest-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        {loading ? "Membuka Google..." : label}
      </button>
      {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}
      <div className="mt-5 flex items-center gap-3 text-xs text-ink/40">
        <span className="h-px flex-1 bg-forest-100" /> {dividerLabel} <span className="h-px flex-1 bg-forest-100" />
      </div>
    </div>
  );
}
