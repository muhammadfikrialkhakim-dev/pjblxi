import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Tujuan balik (redirect URI aplikasi) setelah pengguna memilih akun di
 * halaman Google. Supabase mengirim ?code=... — di sini ditukar jadi sesi
 * login (cookie), lalu pengguna diarahkan:
 *  - staf (admin wisata / super admin) → /admin
 *  - pengguna biasa → halaman yang dituju sebelum login (?next=), atau "/"
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Hanya terima path internal supaya tidak bisa dipakai sebagai open redirect.
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  // Di balik proxy/hosting, origin asli ada di header x-forwarded-host.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const base =
    process.env.NODE_ENV !== "development" && forwardedHost ? `https://${forwardedHost}` : origin;

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let destination = next;
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        const role = profile?.role;
        if (role === "admin_wisata" || role === "super_admin") destination = "/admin";
      }
      return NextResponse.redirect(`${base}${destination}`);
    }
  }

  return NextResponse.redirect(`${base}/login?error=google`);
}
