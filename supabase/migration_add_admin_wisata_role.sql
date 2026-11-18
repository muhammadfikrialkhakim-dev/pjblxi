-- =========================================================
-- Tambah role 'admin_wisata': admin yang HANYA mengelola satu
-- wisata yang ditugaskan padanya (beda dengan 'admin' biasa yang
-- masih bisa akses semua data seperti sebelumnya).
-- Jalankan di Supabase SQL Editor SETELAH schema.sql dan
-- add_super_admin_role.sql (aman dijalankan berkali-kali).
-- =========================================================

-- 1. Perluas pilihan role yang valid di kolom profiles.role
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('customer', 'agent', 'admin', 'admin_wisata', 'super_admin'));

-- 2. Kolom penanda: wisata ini jadi tanggung jawab admin_wisata siapa.
--    NULL berarti belum ditugaskan ke siapa pun (masih dikelola bebas
--    oleh admin biasa/super admin sampai ditugaskan).
alter table public.wisata add column if not exists admin_id uuid references public.profiles(id) on delete set null;
create index if not exists wisata_admin_id_idx on public.wisata (admin_id);

-- 3. is_wisata_owner(wisata_id) — true kalau user yang sedang login
--    adalah akun ber-role 'admin_wisata' YANG DITUGASKAN ke wisata
--    tersebut. Dipakai untuk membatasi akses admin_wisata hanya ke
--    wisata & tiket miliknya sendiri (beda dari is_admin() yang
--    aksesnya ke SEMUA data).
create or replace function public.is_wisata_owner(target_wisata_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.wisata w
    join public.profiles p on p.id = auth.uid()
    where w.id = target_wisata_id
      and w.admin_id = auth.uid()
      and p.role = 'admin_wisata'
  );
$$;

-- 4. WISATA — admin_wisata boleh baca & ubah HANYA wisata miliknya sendiri
--    (termasuk saat masih 'draft'). Admin biasa & super admin tetap
--    seperti sebelumnya (akses semua), publik tetap hanya lihat yang
--    'published'.
drop policy if exists "Wisata: public read published" on public.wisata;
create policy "Wisata: public read published" on public.wisata
  for select using (status = 'published' or public.is_admin() or public.is_wisata_owner(id));

drop policy if exists "Wisata: admin write" on public.wisata;
create policy "Wisata: admin write" on public.wisata
  for all using (public.is_admin() or public.is_wisata_owner(id))
  with check (public.is_admin() or public.is_wisata_owner(id));

-- 5. TIKET — admin_wisata hanya boleh baca & ubah paket tiket milik
--    wisata yang ditugaskan padanya.
drop policy if exists "Tiket: public read active" on public.tiket;
create policy "Tiket: public read active" on public.tiket
  for select using (
    is_active = true
    or public.is_admin()
    or public.is_wisata_owner(wisata_id)
    or exists (select 1 from public.wisata w where w.id = tiket.wisata_id and w.status = 'published')
  );

drop policy if exists "Tiket: admin write" on public.tiket;
create policy "Tiket: admin write" on public.tiket
  for all using (public.is_admin() or public.is_wisata_owner(wisata_id))
  with check (public.is_admin() or public.is_wisata_owner(wisata_id));

-- 6. Menugaskan sebuah wisata ke akun admin_wisata tertentu biasanya
--    dilakukan lewat form "Kelola Wisata" (field "Admin Wisata") di
--    panel Super Admin. Kalau perlu lewat SQL langsung, contoh:
-- update public.wisata set admin_id = (
--   select id from auth.users where email = 'admin-wisata@contoh.com'
-- ) where slug = 'nama-slug-wisata';
