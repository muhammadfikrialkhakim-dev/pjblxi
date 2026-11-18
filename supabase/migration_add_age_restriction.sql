-- =========================================================
-- Tambah "Batasan Umur" pada wisata (Info Penting untuk Wisatawan).
-- Jalankan sekali di Supabase SQL Editor SEBELUM memakai form admin yang
-- baru. Aman dijalankan berkali-kali (pakai "if not exists").
-- =========================================================
alter table public.wisata add column if not exists age_restriction text;

comment on column public.wisata.age_restriction is 'Contoh: "Semua umur" atau "Anak di bawah 5 tahun wajib didampingi"';
