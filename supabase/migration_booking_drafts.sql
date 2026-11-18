-- =========================================================
-- Migrasi: Tabel draft pemesanan (booking_drafts)
-- Menyimpan tanggal kunjungan, nama, email, dan detail form lainnya
-- secara otomatis agar jika user menekan Back tidak hilang.
-- Jalankan di Supabase SQL Editor.
-- =========================================================

create table if not exists public.booking_drafts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  wisata_slug text,
  tiket_id uuid references public.tiket(id) on delete set null,
  visit_date date,
  customer_name text,
  customer_email text,
  customer_phone text,
  quantity integer not null default 1,
  notes text,
  updated_at timestamptz not null default now()
);

alter table public.booking_drafts enable row level security;

-- Policy: Pengguna hanya dapat membaca draft miliknya sendiri
drop policy if exists "Booking drafts: owner reads" on public.booking_drafts;
create policy "Booking drafts: owner reads" on public.booking_drafts
  for select using (user_id = auth.uid() or public.is_admin());

-- Policy: Pengguna hanya dapat membuat draft miliknya sendiri
drop policy if exists "Booking drafts: owner creates" on public.booking_drafts;
create policy "Booking drafts: owner creates" on public.booking_drafts
  for insert with check (user_id = auth.uid());

-- Policy: Pengguna hanya dapat memperbarui draft miliknya sendiri
drop policy if exists "Booking drafts: owner updates" on public.booking_drafts;
create policy "Booking drafts: owner updates" on public.booking_drafts
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Policy: Pengguna dapat menghapus draft miliknya sendiri (misal setelah order berhasil dibuat)
drop policy if exists "Booking drafts: owner deletes" on public.booking_drafts;
create policy "Booking drafts: owner deletes" on public.booking_drafts
  for delete using (user_id = auth.uid() or public.is_admin());

