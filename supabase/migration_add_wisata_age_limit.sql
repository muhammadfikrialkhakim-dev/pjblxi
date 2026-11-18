-- =========================================================
-- Batas usia pengunjung untuk wisata (opsional).
-- NULL = tidak dibatasi. Aman dijalankan berkali-kali.
-- Jalankan di Supabase SQL Editor.
-- =========================================================

alter table public.wisata add column if not exists min_age smallint
  check (min_age is null or (min_age between 0 and 120));
alter table public.wisata add column if not exists max_age smallint
  check (max_age is null or (max_age between 0 and 120));

alter table public.wisata drop constraint if exists wisata_age_range_check;
alter table public.wisata add constraint wisata_age_range_check
  check (min_age is null or max_age is null or min_age <= max_age);

comment on column public.wisata.min_age is 'Usia minimum pengunjung (tahun). NULL = tanpa batas bawah.';
comment on column public.wisata.max_age is 'Usia maksimum pengunjung (tahun). NULL = tanpa batas atas.';
