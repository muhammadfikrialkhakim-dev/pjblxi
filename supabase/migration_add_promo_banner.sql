-- =========================================================
-- Gambar latar banner untuk halaman Promo, dikelola Super Admin lewat
-- Pengaturan Situs. Kosong = gradasi hijau bawaan.
-- Jalankan sekali di Supabase SQL Editor.
-- =========================================================
alter table public.site_settings add column if not exists promo_banner_image text;

notify pgrst, 'reload schema';
