-- =========================================================
-- Rekomendasi pengunjung per wisata: usia, tinggi badan, berat badan,
-- plus catatan tambahan (mis. kondisi kesehatan). Ditampilkan di popup
-- "Rekomendasi Pengunjung" pada halaman detail wisata. Semua kolom
-- opsional (null = tidak ada batasan). Aman dijalankan berkali-kali.
-- Hak edit mengikuti RLS tabel wisata yang sudah ada (super_admin &
-- admin_wisata pemilik wisata).
-- =========================================================

alter table public.wisata add column if not exists min_age int;
alter table public.wisata add column if not exists max_age int;
alter table public.wisata add column if not exists min_height_cm int;
alter table public.wisata add column if not exists max_height_cm int;
alter table public.wisata add column if not exists min_weight_kg int;
alter table public.wisata add column if not exists max_weight_kg int;
alter table public.wisata add column if not exists recommendation_notes text;

alter table public.wisata drop constraint if exists wisata_recommendation_check;
alter table public.wisata add constraint wisata_recommendation_check check (
  (min_age is null or min_age >= 0)
  and (min_height_cm is null or min_height_cm > 0)
  and (min_weight_kg is null or min_weight_kg > 0)
  and (max_age is null or min_age is null or max_age >= min_age)
  and (max_height_cm is null or min_height_cm is null or max_height_cm >= min_height_cm)
  and (max_weight_kg is null or min_weight_kg is null or max_weight_kg >= min_weight_kg)
);

comment on column public.wisata.min_age is 'Usia minimum yang direkomendasikan (tahun)';
comment on column public.wisata.max_age is 'Usia maksimum yang direkomendasikan (tahun)';
comment on column public.wisata.min_height_cm is 'Tinggi badan minimum (cm)';
comment on column public.wisata.max_height_cm is 'Tinggi badan maksimum (cm)';
comment on column public.wisata.min_weight_kg is 'Berat badan minimum (kg)';
comment on column public.wisata.max_weight_kg is 'Berat badan maksimum (kg), mis. untuk wahana/jeep';
comment on column public.wisata.recommendation_notes is 'Catatan tambahan, mis. tidak disarankan bagi ibu hamil / penyakit jantung';
