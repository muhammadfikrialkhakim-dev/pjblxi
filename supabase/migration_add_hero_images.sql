-- =========================================================
-- Fitur baru KHUSUS SUPER ADMIN: Pengaturan Situs.
--
-- Sebelumnya halaman /admin/settings cuma tulisan placeholder dan bisa
-- diakses role 'admin' biasa juga. Sekarang jadi fitur nyata (nama situs,
-- tagline, kontak, metode pembayaran aktif) dan dibatasi HANYA Super Admin
-- yang boleh mengubahnya — karena ini pengaturan yang berlaku untuk
-- SELURUH platform, bukan per-wisata.
--
-- Dibuat sebagai satu baris tunggal (singleton) yang dibaca publik (footer
-- & metadata situs perlu menampilkannya ke pengunjung), tapi cuma bisa
-- diubah oleh Super Admin.
-- =========================================================

create table if not exists public.site_settings (
  id boolean primary key default true,
  site_name text not null default 'Explore Malang',
  site_tagline text not null default 'Platform pemesanan tiket wisata terpadu untuk wilayah Malang Raya — dibangun untuk agen travel dan wisatawan.',
  contact_email text,
  contact_whatsapp text,
  payment_bank_transfer_enabled boolean not null default true,
  payment_ewallet_enabled boolean not null default true,
  payment_credit_card_enabled boolean not null default true,
  payment_qris_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  -- Pastikan tabel ini SELALU cuma punya 1 baris (singleton) — id boolean
  -- yang selalu 'true' membuat baris kedua mustahil dibuat (primary key
  -- akan bentrok).
  constraint site_settings_singleton check (id = true)
);

insert into public.site_settings (id) values (true) on conflict (id) do nothing;

alter table public.site_settings enable row level security;

drop policy if exists "Site settings: public read" on public.site_settings;
create policy "Site settings: public read" on public.site_settings
  for select using (true);

drop policy if exists "Site settings: super admin write" on public.site_settings;
create policy "Site settings: super admin write" on public.site_settings
  for all using (public.is_super_admin())
  with check (public.is_super_admin());

-- =========================================================
-- Gambar hero homepage (dikelola Super Admin). Kosong = hero polos.
-- =========================================================
alter table public.site_settings add column if not exists hero_images text[] not null default '{}';

-- Kosongkan gambar contoh (bukan hasil upload) di kategori & wisata.
update public.categories set image_url = null where image_url is not null and image_url not like '%/storage/v1/object/%';
update public.wisata set cover_image_url = null where cover_image_url is not null and cover_image_url not like '%/storage/v1/object/%';
