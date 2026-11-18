-- ============================================================
-- Data pribadi tambahan di halaman Profil (jenis kelamin, tanggal lahir,
-- kota domisili). Jalankan di Supabase SQL Editor.
-- ============================================================
alter table public.profiles add column if not exists gender text
  check (gender in ('male', 'female'));
alter table public.profiles add column if not exists birth_date date;
alter table public.profiles add column if not exists city text;
