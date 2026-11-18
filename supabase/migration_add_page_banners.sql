-- =========================================================
-- Gambar latar banner untuk halaman Kategori, Destinasi, dan Wishlist,
-- dikelola Super Admin lewat Pengaturan Situs. Kosong = gradasi hijau bawaan.
-- Jalankan sekali di Supabase SQL Editor.
-- =========================================================
alter table public.site_settings add column if not exists categories_banner_image text;
alter table public.site_settings add column if not exists destinations_banner_image text;
alter table public.site_settings add column if not exists wishlist_banner_image text;
