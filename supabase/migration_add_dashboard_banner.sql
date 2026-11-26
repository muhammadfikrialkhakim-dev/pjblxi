-- =========================================================
-- Gambar latar banner sambutan di Dashboard Admin, dikelola Super Admin
-- lewat Pengaturan Situs. Kosong = gradasi hijau bawaan.
-- Jalankan sekali di Supabase SQL Editor.
-- =========================================================
alter table public.site_settings add column if not exists dashboard_banner_image text;
