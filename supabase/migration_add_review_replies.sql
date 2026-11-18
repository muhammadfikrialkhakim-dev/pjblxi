-- Balasan (reply) pada ulasan. Aman dijalankan ulang.
create table if not exists public.ulasan_balasan (
  id uuid primary key default uuid_generate_v4(),
  ulasan_id uuid not null references public.ulasan(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  komentar text not null check (char_length(trim(komentar)) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table public.ulasan_balasan enable row level security;

drop policy if exists "Balasan: public read" on public.ulasan_balasan;
create policy "Balasan: public read" on public.ulasan_balasan for select using (true);
drop policy if exists "Balasan: owner inserts" on public.ulasan_balasan;
create policy "Balasan: owner inserts" on public.ulasan_balasan for insert with check (user_id = auth.uid());
drop policy if exists "Balasan: owner or admin deletes" on public.ulasan_balasan;
create policy "Balasan: owner or admin deletes" on public.ulasan_balasan
  for delete using (user_id = auth.uid() or public.is_admin());
