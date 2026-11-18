import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    if (role !== "admin" && role !== "admin_wisata" && role !== "super_admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // Role 'admin' (biasa) sudah tidak punya menu/fitur apa pun lagi di
    // panel ini — semua yang dulu dibagi (Kelola Wisata, Tiket, Kategori,
    // Member, Transaksi, Laporan, dst) sekarang eksklusif Super Admin.
    // Akun & role 'admin' sengaja TETAP ADA di database, cuma akses ke
    // /admin dicabut total di sini.
    if (role === "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // Halaman /admin/super/* (Kelola Data Admin, Kelola Data User) dan
    // /admin/settings (Pengaturan Situs — berlaku untuk seluruh platform)
    // hanya untuk Super Admin — admin biasa tidak boleh mengubah role/akun
    // orang lain ataupun pengaturan situs secara keseluruhan.
    if (
      (request.nextUrl.pathname.startsWith("/admin/super") || request.nextUrl.pathname.startsWith("/admin/settings")) &&
      role !== "super_admin"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }

    // Admin Wisata hanya mengelola satu wisata yang ditugaskan padanya, jadi
    // menu di sidebar-nya cuma Kelola Wisata & Kelola Tiket — jangan biarkan
    // dia mengakses halaman admin lain (Kategori, Member, Transaksi, dst)
    // lewat URL langsung juga.
    const wisataAdminAllowedPrefixes = ["/admin/spots", "/admin/tiket", "/admin/promos", "/admin/transactions", "/admin/reports"];
    if (
      role === "admin_wisata" &&
      request.nextUrl.pathname !== "/admin" &&
      !wisataAdminAllowedPrefixes.some((p) => request.nextUrl.pathname.startsWith(p))
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/spots";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  // Berjalan di hampir semua halaman (bukan hanya /admin) supaya sesi login
  // (cookie access token) selalu di-refresh oleh Supabase di setiap request.
  // Tanpa ini, sesi bisa basi di halaman non-admin (mis. booking/checkout)
  // dan menyebabkan insert ke tabel yang di-RLS gagal karena auth.uid()
  // tidak sinkron. Logic pengecekan role admin di dalam middleware() di atas
  // tetap hanya berlaku untuk path /admin.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
