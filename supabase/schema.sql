-- =========================================================
-- Explore Malang — Supabase schema (v2)
-- wisata (tempat) 1 --> N tiket (paket harga) 1 --> N orders
-- Jalankan di Supabase SQL editor (project baru)
-- =========================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- PROFILES (agen travel / admin / customer)
-- ---------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'agent', 'admin', 'super_admin')),
  agency_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles: user reads own" on public.profiles;
create policy "Profiles: user reads own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "Profiles: user updates own" on public.profiles;
create policy "Profiles: user updates own" on public.profiles
  for update using (auth.uid() = id);
drop policy if exists "Profiles: user inserts own" on public.profiles;
create policy "Profiles: user inserts own" on public.profiles
  for insert with check (auth.uid() = id);

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;

-- Kewenangan khusus: kelola akun admin & semua user (hanya Super Admin).
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

drop policy if exists "Profiles: admin reads all" on public.profiles;
create policy "Profiles: admin reads all" on public.profiles
  for select using (public.is_admin());

drop policy if exists "Profiles: super admin updates any" on public.profiles;
create policy "Profiles: super admin updates any" on public.profiles
  for update using (public.is_super_admin());

drop policy if exists "Profiles: super admin deletes any" on public.profiles;
create policy "Profiles: super admin deletes any" on public.profiles
  for delete using (public.is_super_admin());

-- ---------------------------------------------------------
-- CATEGORIES
-- ---------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;
drop policy if exists "Categories: public read" on public.categories;
create policy "Categories: public read" on public.categories for select using (true);
drop policy if exists "Categories: admin write" on public.categories;
create policy "Categories: admin write" on public.categories for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------
-- WISATA (tempat / destinasi wisata — info umum, TANPA harga)
-- ---------------------------------------------------------
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

alter table public.wisata enable row level security;

drop policy if exists "Wisata: public read published" on public.wisata;
create policy "Wisata: public read published" on public.wisata
  for select using (status = 'published' or public.is_admin());
drop policy if exists "Wisata: admin write" on public.wisata;
create policy "Wisata: admin write" on public.wisata
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------
-- TIKET (paket tiket yang dijual untuk sebuah wisata)
-- Satu wisata bisa punya banyak tiket, mis. "Sunrise Tour",
-- "Jeep Only", "Tiket Masuk Saja", masing-masing harga sendiri.
-- ---------------------------------------------------------
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

alter table public.tiket enable row level security;

drop policy if exists "Tiket: public read active" on public.tiket;
create policy "Tiket: public read active" on public.tiket
  for select using (
    is_active = true
    or public.is_admin()
    or exists (select 1 from public.wisata w where w.id = tiket.wisata_id and w.status = 'published')
  );
drop policy if exists "Tiket: admin write" on public.tiket;
create policy "Tiket: admin write" on public.tiket
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------
-- ORDERS (pemesanan — merujuk ke paket TIKET, bukan wisata)
-- ---------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_code text not null unique,
  tiket_id uuid not null references public.tiket(id),
  customer_id uuid not null references public.profiles(id),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  visit_date date not null,
  ticket_quantity integer not null default 1,
  unit_price numeric(12,2) not null,
  total_price numeric(12,2) not null,
  payment_method text check (payment_method in ('bank_transfer', 'e_wallet', 'credit_card', 'qris')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'expired', 'refunded')),
  order_status text not null default 'awaiting_payment' check (order_status in ('awaiting_payment', 'confirmed', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "Orders: owner reads" on public.orders;
create policy "Orders: owner reads" on public.orders
  for select using (customer_id = auth.uid() or public.is_admin());
drop policy if exists "Orders: owner creates" on public.orders;
create policy "Orders: owner creates" on public.orders
  for insert with check (customer_id = auth.uid());
drop policy if exists "Orders: admin updates" on public.orders;
create policy "Orders: admin updates" on public.orders
  for update using (public.is_admin());

create or replace function public.generate_order_code()
returns trigger
language plpgsql
as $$
begin
  if new.order_code is null then
    new.order_code := 'EM-' || to_char(now(), 'YYYYMMDD') || '-' ||
      lpad(floor(random() * 10000)::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_generate_order_code on public.orders;
create trigger trg_generate_order_code
  before insert on public.orders
  for each row execute function public.generate_order_code();

-- ---------------------------------------------------------
-- PAYMENTS
-- ---------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text,
  provider_reference text,
  amount numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

drop policy if exists "Payments: owner reads" on public.payments;
create policy "Payments: owner reads" on public.payments
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = payments.order_id
      and (o.customer_id = auth.uid() or public.is_admin())
    )
  );
drop policy if exists "Payments: admin writes" on public.payments;
create policy "Payments: admin writes" on public.payments
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------
-- ULASAN (penilaian publik / rating & review per wisata)
-- ---------------------------------------------------------
create table if not exists public.ulasan (
  id uuid primary key default uuid_generate_v4(),
  wisata_id uuid not null references public.wisata(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  komentar text,
  created_at timestamptz not null default now(),
  -- Satu akun hanya boleh memberi 1 ulasan per wisata (bisa diedit lewat update).
  unique (wisata_id, customer_id)
);

alter table public.ulasan enable row level security;

drop policy if exists "Ulasan: public read" on public.ulasan;
create policy "Ulasan: public read" on public.ulasan
  for select using (true);

drop policy if exists "Ulasan: owner creates" on public.ulasan;
create policy "Ulasan: owner creates" on public.ulasan
  for insert with check (customer_id = auth.uid());

drop policy if exists "Ulasan: owner updates" on public.ulasan;
create policy "Ulasan: owner updates" on public.ulasan
  for update using (customer_id = auth.uid());

drop policy if exists "Ulasan: owner or admin deletes" on public.ulasan;
create policy "Ulasan: owner or admin deletes" on public.ulasan
  for delete using (customer_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------
-- Seed data contoh
-- ---------------------------------------------------------
insert into public.categories (name, slug, image_url) values
  ('Alam', 'alam', 'https://images.unsplash.com/photo-1544918877-7e9a5c4bdb3d'),
  ('Budaya', 'budaya', 'https://images.unsplash.com/photo-1596395463672-9e5a4f3a4c58'),
  ('Kuliner', 'kuliner', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836'),
  ('Petualangan', 'petualangan', 'https://images.unsplash.com/photo-1551632811-561732d1e306')
on conflict (slug) do nothing;

insert into public.wisata
  (category_id, name, slug, location, short_description, description, cover_image_url, is_trending, status)
select
  (select id from public.categories where slug = 'alam'),
  'Mount Bromo Expedition', 'mount-bromo-expedition', 'Bromo Tengger Semeru, Malang',
  'Saksikan matahari terbit di atas kawah Bromo bersama pemandu lokal.',
  'Wisata Gunung Bromo menawarkan pemandangan matahari terbit dari Penanjakan, lautan pasir, dan kawah aktif. Tersedia beberapa paket tiket sesuai kebutuhan.',
  'https://images.unsplash.com/photo-1596395463672-9e5a4f3a4c58', true, 'published'
where not exists (select 1 from public.wisata where slug = 'mount-bromo-expedition');

insert into public.wisata
  (category_id, name, slug, location, short_description, description, cover_image_url, is_trending, status)
select
  (select id from public.categories where slug = 'petualangan'),
  'Kelud Volcano Tour', 'kelud-volcano-tour', 'Gunung Kelud, Malang',
  'Petualangan seru menyusuri lereng Gunung Kelud dengan jeep.',
  'Jelajahi keindahan Gunung Kelud dengan kendaraan 4x4, mengunjungi terowongan lama dan menikmati panorama kawah dari dekat.',
  'https://images.unsplash.com/photo-1551632811-561732d1e306', false, 'published'
where not exists (select 1 from public.wisata where slug = 'kelud-volcano-tour');

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Sunrise Tour + Jeep', 'Penjemputan dini hari, jeep 4x4, pemandu, lokasi sunrise Penanjakan.', 350000, 100
from public.wisata where slug = 'mount-bromo-expedition'
and not exists (select 1 from public.tiket where name = 'Sunrise Tour + Jeep');

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Tiket Masuk Saja', 'Hanya tiket masuk kawasan Bromo, tanpa transportasi.', 50000, 500
from public.wisata where slug = 'mount-bromo-expedition'
and not exists (select 1 from public.tiket where name = 'Tiket Masuk Saja');

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Jeep Tour Kelud', 'Sewa jeep 4x4 keliling lereng Kelud selama 3 jam.', 275000, 80
from public.wisata where slug = 'kelud-volcano-tour'
and not exists (select 1 from public.tiket where name = 'Jeep Tour Kelud');
