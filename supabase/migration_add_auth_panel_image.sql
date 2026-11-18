-- =========================================================
-- Gambar panel kiri halaman Masuk & Daftar, dikelola Super Admin lewat
-- Pengaturan Situs. Kosong = tampil ilustrasi pegunungan bawaan.
-- Jalankan sekali di Supabase SQL Editor.
-- =========================================================
alter table public.site_settings add column if not exists auth_panel_image text;
