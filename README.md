# Explore Malang — Web Pemesanan Tiket Wisata

Aplikasi pemesanan tiket wisata untuk region **Malang Raya**, dibangun dengan
**Next.js 14 (App Router)** dan **Supabase** (database + auth). Dirancang agar
bisa dipakai/dijual ke agen travel sebagai white-label booking platform.

## Fitur

**Sisi Pengunjung / Customer**
- Beranda dengan pencarian & kategori wisata
- Daftar & detail wisata (galeri, deskripsi, fasilitas, lokasi peta)
- Setiap wisata bisa punya lebih dari 1 **paket tiket** (mis. "Sunrise Tour + Jeep"
  vs "Tiket Masuk Saja") dengan harga & kuota masing-masing
- Alur pemesanan: pilih paket tiket → tanggal & jumlah → isi data pemesan →
  pilih metode pembayaran → e-tiket / konfirmasi
- Riwayat transaksi per akun customer

**Sisi Admin** (role `admin`)
- Dashboard ringkasan (total pendapatan, jumlah transaksi, wisata aktif)
- **Kelola Wisata**: data tempat (nama, lokasi, deskripsi, galeri, kategori) — tanpa harga
- **Kelola Tiket**: paket tiket per wisata (harga, harga coret, kuota/hari, aktif/nonaktif)
- **Kelola Kategori**: CRUD kategori wisata
- **Kelola Member**: daftar akun customer + jumlah transaksinya
- **Kelola Transaksi**: verifikasi pembayaran manual & ubah status transaksi
- **Laporan**: pendapatan per bulan & wisata terlaris

**Sisi Super Admin** (role `super_admin`) — punya semua akses Admin, ditambah:
- **Kelola Data Admin**: buat akun admin/super admin baru, ubah role, hapus akun
- **Kelola Data User**: kelola akun *semua* role (customer, agent, admin, super admin)

## Tumpukan Teknologi
- Next.js 14 (App Router, Server Actions)
- Supabase (Postgres, Auth, Row Level Security)
- Tailwind CSS
- TypeScript

## Cara Menjalankan

### 1. Siapkan project Supabase
1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, jalankan seluruh isi file `supabase/schema.sql`.
   File ini membuat tabel `profiles`, `categories`, `wisata`, `tiket`, `orders`,
   `payments`, lengkap dengan Row Level Security dan beberapa data contoh.
   (Jika sebelumnya Anda sempat menjalankan skema versi lama yang masih
   memakai tabel `destinations`, jalankan `supabase/migration_v1_to_v2.sql`
   untuk memindahkan datanya, bukan `schema.sql` lagi.)
3. (Opsional) Jalankan `supabase/seed_wisata_malang_raya.sql` untuk menambahkan
   5 kategori baru (Taman Rekreasi, Pantai, Air Terjun, Gunung & Perkemahan,
   Edukasi & Museum — total jadi 9 kategori, pas untuk grid 3x3 di beranda)
   dan ±11 wisata nyata di kawasan Malang Raya (Kota Malang, Kota Batu, dan
   Kabupaten Malang) beserta paket tiketnya — Jatim Park 2, Museum Angkut,
   Selecta, Coban Rondo, BNS, Kampung Warna Warni Jodipan, Museum Brawijaya,
   Pantai Balekambang, Pulau Sempu, dan Coban Pelangi. Harga & kuota di
   file ini contoh — sesuaikan lagi lewat halaman Admin.
4. Jalankan juga `supabase/storage_setup.sql` untuk membuat bucket Storage
   `wisata-images` (dipakai untuk upload gambar sampul & galeri wisata dari
   halaman Admin) beserta policy-nya: siapa pun bisa melihat gambarnya,
   tapi hanya admin yang bisa upload/hapus.
5b. Jalankan `supabase/migration_add_promo_banner.sql` untuk kolom banner halaman Promo
   (diatur Super Admin di Pengaturan Situs → Gambar Latar Banner Halaman).
5a. Jalankan `supabase/migration_add_ticket_quota.sql` untuk mengaktifkan
   **kuota tiket harian yang nyata**: sisa kuota = `quota_per_day` dikurangi
   tiket terpesan pada tanggal kunjungan (pesanan lunas + pesanan menunggu
   bayar ≤ 60 menit). Pesanan gagal/kedaluwarsa/refund mengembalikan kuota.
   Pengecekan dilakukan di database (trigger + kunci baris) sehingga tidak
   bisa kelebihan pesanan walau dua orang membeli bersamaan.
5. Jalankan `supabase/add_super_admin_role.sql` untuk menambahkan role
   `super_admin` (kalau Anda mulai dari `schema.sql` versi terbaru, role ini
   sudah otomatis tersedia — file ini terutama untuk project yang sudah
   berjalan sebelumnya).
6. Salin **Project URL**, **anon public key**, dan **service_role key** dari
   Settings → API (service_role dipakai untuk fitur Super Admin membuat akun
   baru & webhook Midtrans — JANGAN pernah expose ke browser).

### 2. Konfigurasi environment
```bash
cp .env.local.example .env.local
```
Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` sesuai
project Supabase Anda, lalu `SUPABASE_SERVICE_ROLE_KEY` dari Settings → API
(dipakai khusus oleh webhook pembayaran, jangan pernah expose ke client).

### 3. Konfigurasi Midtrans (payment gateway)
1. Daftar/masuk ke [dashboard.midtrans.com](https://dashboard.midtrans.com).
2. Untuk testing, gunakan mode **Sandbox** dulu (tersedia otomatis saat daftar).
   Buka **Settings → Access Keys**, salin **Server Key** dan **Client Key**
   (diawali `SB-Mid-...`), lalu isi ke `.env.local`:
   ```
   MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxx
   NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxx
   MIDTRANS_IS_PRODUCTION=false
   NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=false
   ```
3. Set **Payment Notification URL** di **Settings → Configuration** ke:
   ```
   https://domain-anda.com/api/midtrans/webhook
   ```
   Saat development lokal, gunakan tunnel seperti `ngrok` agar Midtrans bisa
   mengirim notifikasi ke komputer Anda, mis. `https://xxxx.ngrok.io/api/midtrans/webhook`.
4. Simulasikan pembayaran sandbox dengan kartu uji / VA simulator dari
   [dokumentasi Midtrans](https://docs.midtrans.com/docs/testing-payment-on-sandbox).
5. Saat siap produksi: aktifkan akun Midtrans production, ganti seluruh key
   ke key produksi (tanpa awalan `SB-`), dan set `MIDTRANS_IS_PRODUCTION=true`
   serta `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=true`. Jangan lupa update
   Payment Notification URL ke domain produksi juga.

### 4. Install dependency & jalankan
```bash
npm install
npm run dev
```
Buka http://localhost:3000

### 4. Membuat akun Admin
Setelah mendaftar lewat halaman `/register`, buka Supabase Table Editor →
tabel `profiles`, ubah kolom `role` pada akun Anda menjadi `admin`. Setelah
itu Anda bisa mengakses `/admin`.

## Struktur Folder Penting
```
app/
  page.tsx                    # Beranda
  destinations/                # Listing & detail wisata (route tetap /destinations)
  booking/                     # Form data pemesan (per paket tiket)
  checkout/[orderId]/          # Pemilihan metode pembayaran
  orders/[id]/                 # E-tiket / konfirmasi pesanan
  account/                     # Riwayat transaksi customer
  admin/
    spots/                     # Kelola Wisata (info tempat)
    tiket/                     # Kelola Tiket (paket harga per wisata)
    transactions/               # Daftar transaksi
components/                    # Komponen UI yang dipakai bersama
lib/supabase/                  # Client & server Supabase helper
supabase/schema.sql            # Skema database v2 (wisata + tiket) + RLS + seed data
supabase/seed_wisata_malang_raya.sql # Tambahan ~11 wisata nyata di Malang Raya + tiketnya
supabase/migration_v1_to_v2.sql # Migrasi jika sebelumnya sudah pakai tabel 'destinations'
supabase/storage_setup.sql     # Bucket Storage 'wisata-images' + policy upload gambar
```

## Catatan Penting Sebelum Produksi
1. **Pembayaran**: sudah terintegrasi dengan **Midtrans Snap**
   (`app/checkout/actions.ts` membuat transaksi asli, status pembayaran hanya
   diupdate lewat webhook di `app/api/midtrans/webhook/route.ts` setelah
   signature diverifikasi — bukan langsung dari client). Sebelum go-live,
   ganti seluruh key sandbox ke key produksi (lihat bagian Konfigurasi Midtrans).
2. **Upload gambar**: sudah pakai **Supabase Storage** — form Kelola Wisata
   punya tombol unggah langsung dari komputer (gambar sampul + galeri, maks 5MB
   per file), tidak perlu lagi tempel URL manual. Pastikan sudah menjalankan
   `supabase/storage_setup.sql`.
3. **Multi-tenant / multi-agen**: skema sudah punya kolom `role` (`agent`,
   `admin`, `customer`) dan `agency_name` di `profiles` sebagai titik awal jika
   ingin setiap agen travel mengelola destinasinya sendiri — tambahkan kolom
   `agency_id` di `destinations` dan sesuaikan RLS policy.
4. **Domain & branding**: ganti nama "Explore Malang", warna, dan logo di
   `tailwind.config.ts` dan `components/Navbar.tsx` / `Footer.tsx` sesuai brand
   agen travel yang akan menggunakan platform ini.
5. **NEXT_PUBLIC_SITE_URL**: isi dengan domain produksi Anda, dipakai untuk
   redirect setelah popup pembayaran Midtrans selesai.

## Lisensi
Kode ini milik Anda sepenuhnya untuk dikembangkan dan dijual kembali.

## Promo & Voucher

Pengunjung bisa **mengklaim** promo di halaman `/promo` (lewat tombol Klaim atau
dengan mengetik kode), lalu **memakainya** saat checkout di halaman booking.

- **Database:** jalankan `supabase/migration_add_promos.sql` sekali di Supabase
  SQL Editor (tabel `promos` & `user_promos`, kolom diskon di `orders`).
- **Kelola promo:** menu **Kelola Promo** di panel admin. Super Admin membuat promo
  untuk semua destinasi atau satu destinasi; Admin Wisata hanya untuk wisatanya.
- **Aturan:** satu klaim per user per promo, dipakai maksimal sekali. Diskon bisa
  persen (dengan batas maksimal) atau nominal, ada minimal belanja, kuota klaim,
  dan periode berlaku (WIB). Voucher dilepas kembali kalau pesanannya gagal,
  kedaluwarsa, atau dibatalkan sebelum lunas.
- **Keamanan:** harga & diskon selalu dihitung ulang di server (`app/booking/actions.ts`);
  klaim ditulis lewat service role (`SUPABASE_SERVICE_ROLE_KEY` wajib terisi).

## Asisten AI (Hubungi Kami)
Halaman `/hubungi-kami` punya chatbot yang dijawab AI (Claude) lewat route
`app/api/chat/route.ts`. Isi `ANTHROPIC_API_KEY` di `.env.local` (lihat
`.env.local.example`) lalu restart `npm run dev`. AI hanya diberi informasi
publik (aturan situs + daftar wisata terbit), tidak bisa melihat pesanan atau
data pribadi, dan akan mengarahkan ke tim (WhatsApp/Email) untuk refund atau
masalah akun. Kalau key kosong atau API error, chatbot otomatis memakai
jawaban berbasis kata kunci bawaan. Ada pembatas 15 pesan/menit per IP.
