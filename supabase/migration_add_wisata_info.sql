-- =========================================================
-- Tambah informasi lengkap untuk membantu wisatawan di halaman
-- detail destinasi: jam operasional, kontak, estimasi durasi
-- kunjungan, waktu terbaik berkunjung, dan tips.
-- Aman dijalankan berkali-kali (pakai "if not exists").
-- =========================================================

alter table public.wisata add column if not exists opening_hours text;
alter table public.wisata add column if not exists contact_phone text;
alter table public.wisata add column if not exists estimated_duration text;
alter table public.wisata add column if not exists best_time_to_visit text;
alter table public.wisata add column if not exists tips text[] default '{}';

comment on column public.wisata.opening_hours is 'Contoh: "Setiap hari, 08.00 - 17.00 WIB"';
comment on column public.wisata.contact_phone is 'Nomor telepon/WhatsApp pengelola untuk info lebih lanjut';
comment on column public.wisata.estimated_duration is 'Contoh: "2-3 jam"';
comment on column public.wisata.best_time_to_visit is 'Contoh: "Pagi hari sebelum jam 9 untuk menghindari kabut"';
comment on column public.wisata.tips is 'Daftar tips singkat untuk wisatawan, mis. "Bawa jaket, suhu dingin"';
