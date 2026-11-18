-- Reaksi jempol baik (like) / jempol buruk (dislike) pada ulasan. Aman dijalankan ulang.
create table if not exists public.ulasan_reaksi (
  id uuid primary key default uuid_generate_v4(),
  ulasan_id uuid not null references public.ulasan(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  value smallint not null check (value in (1, -1)),
  created_at timestamptz not null default now(),
  unique (ulasan_id, user_id)
);

alter table public.ulasan_reaksi enable row level security;

drop policy if exists "Reaksi: public read" on public.ulasan_reaksi;
create policy "Reaksi: public read" on public.ulasan_reaksi for select using (true);
drop policy if exists "Reaksi: owner inserts" on public.ulasan_reaksi;
create policy "Reaksi: owner inserts" on public.ulasan_reaksi for insert with check (user_id = auth.uid());
drop policy if exists "Reaksi: owner updates" on public.ulasan_reaksi;
create policy "Reaksi: owner updates" on public.ulasan_reaksi for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "Reaksi: owner deletes" on public.ulasan_reaksi;
create policy "Reaksi: owner deletes" on public.ulasan_reaksi for delete using (user_id = auth.uid());
