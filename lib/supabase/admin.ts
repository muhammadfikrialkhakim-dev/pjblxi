import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase dengan Service Role Key — melewati Row Level Security.
 *
 * HANYA dipakai di kode server yang tidak berjalan dalam konteks sesi user
 * (mis. webhook payment gateway), karena tidak ada user yang login saat
 * Midtrans mengirim notifikasi ke server kita. JANGAN pernah mengirim
 * client ini atau SUPABASE_SERVICE_ROLE_KEY ke browser.
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY belum diset. Ambil dari Supabase Settings → API " +
        "(Service Role key) dan tambahkan ke .env.local. JANGAN pernah expose key ini ke client."
    );
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
