-- =========================================================
-- Promo & voucher: bisa DIKLAIM pengunjung dan DIPAKAI saat checkout.
-- Jalankan sekali di Supabase SQL Editor. Aman dijalankan berulang.
--
-- promos       : definisi promo (dibuat Super Admin / Admin Wisata)
-- user_promos  : voucher yang sudah diklaim seorang user (1 klaim per user
--                per promo, dipakai maksimal sekali)
-- orders       : bertambah promo_id, promo_code, discount_amount
--                (total_price = unit_price x qty - discount_amount)
-- =========================================================

create table if not exists public.promos (
  id uuid primary key default uuid_generate_v4(),
  code text not null,                         -- mis. HEMAT20 (unik, tanpa membedakan huruf besar/kecil)
  title text not null,
  description text,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric(12,2) not null check (discount_value > 0),
  max_discount numeric(12,2) check (max_discount is null or max_discount > 0),  -- batas diskon utk tipe percent
  min_purchase numeric(12,2) not null default 0,                                 -- minimal belanja (subtotal)
  wisata_id uuid references public.wisata(id) on delete cascade,                 -- null = berlaku di semua wisata
  claim_quota integer check (claim_quota is null or claim_quota > 0),            -- batas total klaim; null = tanpa batas
  starts_at timestamptz not null default now(),
  ends_at timestamptz,                                                           -- null = tanpa batas akhir
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint promos_percent_max check (discount_type <> 'percent' or discount_value <= 100),
  constraint promos_period_valid check (ends_at is null or ends_at > starts_at)
);

create unique index if not exists promos_code_uidx on public.promos (upper(code));
create index if not exists promos_wisata_idx on public.promos (wisata_id);

create table if not exists public.user_promos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  promo_id uuid not null references public.promos(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  used_at timestamptz,                                         -- terisi = sedang/ sudah dipakai di sebuah pesanan
  order_id uuid references public.orders(id) on delete set null,
  unique (user_id, promo_id)
);

create index if not exists user_promos_user_idx on public.user_promos (user_id);
create index if not exists user_promos_order_idx on public.user_promos (order_id);

alter table public.orders
  add column if not exists promo_id uuid references public.promos(id) on delete set null,
  add column if not exists promo_code text,
  add column if not exists discount_amount numeric(12,2) not null default 0;

-- ---------------------------------------------------------
-- RLS
-- ---------------------------------------------------------
alter table public.promos enable row level security;
alter table public.user_promos enable row level security;

-- Pengunjung hanya melihat promo yang sedang aktif & berlaku.
drop policy if exists "Promos: public read active" on public.promos;
create policy "Promos: public read active" on public.promos
  for select using (
    is_active
    and starts_at <= now()
    and (ends_at is null or ends_at > now())
  );

-- Admin melihat & mengelola semua promo; Admin Wisata hanya promo wisatanya sendiri.
drop policy if exists "Promos: staff read" on public.promos;
create policy "Promos: staff read" on public.promos
  for select using (
    public.is_admin()
    or (wisata_id is not null and public.is_wisata_owner(wisata_id))
  );

drop policy if exists "Promos: staff insert" on public.promos;
create policy "Promos: staff insert" on public.promos
  for insert with check (
    public.is_admin()
    or (wisata_id is not null and public.is_wisata_owner(wisata_id))
  );

drop policy if exists "Promos: staff update" on public.promos;
create policy "Promos: staff update" on public.promos
  for update using (
    public.is_admin()
    or (wisata_id is not null and public.is_wisata_owner(wisata_id))
  );

drop policy if exists "Promos: staff delete" on public.promos;
create policy "Promos: staff delete" on public.promos
  for delete using (
    public.is_admin()
    or (wisata_id is not null and public.is_wisata_owner(wisata_id))
  );

-- Voucher: user hanya melihat miliknya. Klaim & pemakaian ditulis oleh
-- server (service role) supaya kuota & pemakaian tidak bisa dimanipulasi dari
-- browser — makanya tidak ada policy insert/update untuk user biasa.
drop policy if exists "UserPromos: owner reads" on public.user_promos;
create policy "UserPromos: owner reads" on public.user_promos
  for select using (user_id = auth.uid() or public.is_admin());

-- Admin boleh meng-update (mis. melepas voucher saat pesanan dibatalkan manual).
drop policy if exists "UserPromos: admin updates" on public.user_promos;
create policy "UserPromos: admin updates" on public.user_promos
  for update using (public.is_admin());

-- Muat ulang schema cache API Supabase agar tabel/kolom baru langsung dikenali.
notify pgrst, 'reload schema';
