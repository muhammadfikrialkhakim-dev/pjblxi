-- =========================================================
-- Wishlist + Ulasan Terverifikasi (hanya pembeli yang sudah bayar)
-- Aman dijalankan ulang.
-- =========================================================

-- 1. WISHLIST
create table if not exists public.wishlist (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  wisata_id uuid not null references public.wisata(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (customer_id, wisata_id)
);

alter table public.wishlist enable row level security;

drop policy if exists "Wishlist: owner reads" on public.wishlist;
create policy "Wishlist: owner reads" on public.wishlist
  for select using (customer_id = auth.uid());
drop policy if exists "Wishlist: owner inserts" on public.wishlist;
create policy "Wishlist: owner inserts" on public.wishlist
  for insert with check (customer_id = auth.uid());
drop policy if exists "Wishlist: owner deletes" on public.wishlist;
create policy "Wishlist: owner deletes" on public.wishlist
  for delete using (customer_id = auth.uid());

-- 2. ULASAN TERVERIFIKASI
-- Fungsi: apakah user ini punya pesanan LUNAS untuk wisata tsb?
create or replace function public.has_paid_order_for_wisata(p_wisata_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.orders o
    join public.tiket t on t.id = o.tiket_id
    where o.customer_id = auth.uid()
      and o.payment_status = 'paid'
      and t.wisata_id = p_wisata_id
  );
$$;

alter table public.ulasan add column if not exists is_verified_purchase boolean not null default false;

-- Ulasan lama: tandai terverifikasi kalau penulisnya memang pernah bayar.
update public.ulasan u
set is_verified_purchase = true
where exists (
  select 1 from public.orders o
  join public.tiket t on t.id = o.tiket_id
  where o.customer_id = u.customer_id and o.payment_status = 'paid' and t.wisata_id = u.wisata_id
);

-- Hanya pembeli yang sudah bayar yang boleh membuat / mengubah ulasan.
drop policy if exists "Ulasan: owner creates" on public.ulasan;
create policy "Ulasan: owner creates" on public.ulasan
  for insert with check (customer_id = auth.uid() and public.has_paid_order_for_wisata(wisata_id));

drop policy if exists "Ulasan: owner updates" on public.ulasan;
create policy "Ulasan: owner updates" on public.ulasan
  for update using (customer_id = auth.uid())
  with check (customer_id = auth.uid() and public.has_paid_order_for_wisata(wisata_id));
