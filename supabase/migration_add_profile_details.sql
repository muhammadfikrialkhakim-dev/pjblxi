-- =========================================================
-- Data tambahan profil pengguna (halaman Profil): nomor telepon & kota domisili.
-- Jalankan sekali di Supabase SQL Editor.
-- =========================================================
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists city text;
