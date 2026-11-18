# Login dengan Google — pengaturan satu kali

Kode di aplikasi sudah siap. Supaya tombol Google berfungsi, aktifkan providernya:

1. **Google Cloud Console** → APIs & Services → Credentials → *Create Credentials* → *OAuth client ID* (Web application).
   - *Authorized redirect URIs*: `https://<PROJECT-REF>.supabase.co/auth/v1/callback`
     (salin persisnya dari Supabase → Authentication → Providers → Google).
   - Simpan **Client ID** dan **Client Secret**.
   - Kalau diminta, atur *OAuth consent screen* (nama aplikasi, email dukungan).
2. **Supabase** → Authentication → Providers → **Google** → aktifkan, tempel Client ID & Client Secret, Save.
3. **Supabase** → Authentication → URL Configuration:
   - *Site URL*: alamat situs Anda (mis. `https://domain-anda.com`; untuk lokal `http://localhost:3000`).
   - *Redirect URLs*: tambahkan `http://localhost:3000/auth/callback` dan `https://domain-anda.com/auth/callback`.
4. Tidak ada migrasi SQL. Profil pengguna Google dibuat otomatis oleh trigger `handle_new_user` yang sudah ada (role default: customer).

5. Terakhir, di `.env.local` set `NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED=true` lalu restart `npm run dev`. Selama nilainya bukan `true`, tombol Google disembunyikan.
