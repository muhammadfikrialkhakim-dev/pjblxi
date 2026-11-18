-- =========================================================
-- Migrasi: tambah fitur Penilaian Publik (rating & ulasan)
-- Jalankan di Supabase SQL Editor pada project yang SUDAH berjalan.
-- Aman dijalankan langsung.
-- =========================================================

create table if not exists public.ulasan (
  id uuid primary key default uuid_generate_v4(),
  wisata_id uuid not null references public.wisata(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  komentar text,
  created_at timestamptz not null default now(),
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
