-- =========================================================
-- TES SEMENTARA — HANYA UNTUK DEBUGGING, JANGAN DIBIARKAN AKTIF
-- =========================================================
-- Ini mematikan RLS di tabel orders sementara, supaya kita tahu pasti
-- apakah booking bisa berhasil TANPA RLS sama sekali. Kalau setelah ini
-- booking masih gagal dengan pesan error LAIN (bukan soal RLS lagi),
-- berarti masalah sebenarnya bukan di RLS, tapi di tempat lain
-- (misalnya kolom yang wajib diisi, tipe data, dsb).

alter table public.orders disable row level security;

-- Sekarang coba booking lagi dari browser.
-- - Kalau BERHASIL       -> penyebabnya memang RLS, isi policy insert
--                           kita masih belum sesuai kondisi Anda.
-- - Kalau MASIH GAGAL     -> ada error lain, kirim ke saya pesan error
--                           barunya (pasti beda dari sebelumnya).

-- =========================================================
-- SETELAH SELESAI TES, WAJIB JALANKAN INI LAGI supaya keamanan
-- tabel orders tidak bolong (siapa saja bisa lihat/ubah semua order
-- orang lain kalau RLS mati permanen):
-- =========================================================
-- alter table public.orders enable row level security;
