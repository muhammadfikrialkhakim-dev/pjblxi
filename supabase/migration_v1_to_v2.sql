-- =========================================================
-- Migrasi: dari tabel 'destinations' (v1) ke 'wisata' + 'tiket' (v2)
-- HANYA jalankan ini jika Anda SUDAH pernah menjalankan schema.sql versi lama.
-- Jika project Supabase Anda masih baru/kosong, langsung pakai supabase/schema.sql saja.
--
-- ⚠️ PERINGATAN — JANGAN JALANKAN FILE INI LAGI setelah Anda sudah
-- menjalankan migration_add_admin_wisata_role.sql (atau migration lain yang
-- lebih baru). File ini membuat ULANG policy "Wisata: admin write" &
-- "Tiket: admin write" versi LAMA yang cuma mengizinkan role admin/
-- super_admin — kalau dijalankan lagi setelah admin_wisata diaktifkan, ini
-- akan MENIMPA BALIK policy yang benar, sehingga admin_wisata jadi
-- kehilangan akses menyimpan perubahan (RLS menolak UPDATE-nya secara diam-
-- diam, tanpa error yang terlihat). File ini HANYA untuk migrasi satu kali
-- dari skema versi sangat lama.
-- =========================================================

-- 1. Buat tabel wisata & tiket (jika belum ada)
create table if not exists public.wisata (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  location text,
  latitude double precision,
  longitude double precision,
  short_description text,
  description text,
  cover_image_url text,
  gallery_urls text[] default '{}',
  facilities text[] default '{}',
  is_trending boolean not null default false,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tiket (
  id uuid primary key default uuid_generate_v4(),
  wisata_id uuid not null references public.wisata(id) on delete cascade,
  name text not null,
  description text,
  price numeric(12,2) not null default 0,
  original_price numeric(12,2),
  quota_per_day integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Pindahkan data lama dari 'destinations' -> 'wisata'
insert into public.wisata
  (id, category_id, name, slug, location, latitude, longitude, short_description,
   description, cover_image_url, gallery_urls, facilities, is_trending, status, created_at)
select
  id, category_id, name, slug, location, latitude, longitude, short_description,
  description, cover_image_url, gallery_urls, facilities, is_trending, status, created_at
from public.destinations
on conflict (id) do nothing;

-- 3. Buat 1 paket tiket default untuk tiap wisata, dari harga lama
insert into public.tiket (wisata_id, name, price, quota_per_day)
select id, 'Tiket Reguler', price, quota_per_day
from public.destinations
on conflict do nothing;

-- 4. Tambah kolom tiket_id ke orders, isi berdasarkan destination_id lama
alter table public.orders add column if not exists tiket_id uuid references public.tiket(id);

update public.orders o
set tiket_id = t.id
from public.tiket t
where t.wisata_id = o.destination_id
and o.tiket_id is null;

alter table public.orders alter column tiket_id set not null;
alter table public.orders drop column if exists destination_id;

-- 5. Aktifkan RLS di tabel baru
alter table public.wisata enable row level security;
create policy "Wisata: public read published" on public.wisata
  for select using (status = 'published' or public.is_admin());
create policy "Wisata: admin write" on public.wisata
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.tiket enable row level security;
create policy "Tiket: public read active" on public.tiket
  for select using (
    is_active = true or public.is_admin()
    or exists (select 1 from public.wisata w where w.id = tiket.wisata_id and w.status = 'published')
  );
create policy "Tiket: admin write" on public.tiket
  for all using (public.is_admin()) with check (public.is_admin());

-- 6. Hapus tabel lama setelah yakin data sudah pindah dengan benar
-- drop table public.destinations cascade;
