-- =========================================================
-- Tambah role 'super_admin' + kewenangan sesuai use case diagram
-- Jalankan di Supabase SQL Editor SETELAH schema.sql (aman dijalankan
-- berkali-kali).
-- =========================================================

-- 1. Perluas pilihan role yang valid di kolom profiles.role
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('customer', 'agent', 'admin', 'super_admin'));

-- 2. is_admin() sekarang benar untuk 'admin' MAUPUN 'super_admin' —
--    super admin otomatis punya semua kewenangan admin biasa
--    (kelola wisata, kategori, tiket, transaksi), ditambah kewenangan
--    khusus lewat is_super_admin() di bawah.
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

-- 3. is_super_admin() — khusus untuk kewenangan "Kelola Data Admin" dan
--    "Kelola Data User" yang cuma boleh dipegang Super Admin.
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

-- 4. Admin biasa boleh MELIHAT semua profil (untuk "Kelola Data Member"),
--    tapi hanya Super Admin yang boleh MENGUBAH role/menghapus akun orang
--    lain (untuk "Kelola Data Admin" & "Kelola Data User").
drop policy if exists "Profiles: admin reads all" on public.profiles;
create policy "Profiles: admin reads all" on public.profiles
  for select using (public.is_admin());

drop policy if exists "Profiles: super admin updates any" on public.profiles;
create policy "Profiles: super admin updates any" on public.profiles
  for update using (public.is_super_admin());

drop policy if exists "Profiles: super admin deletes any" on public.profiles;
create policy "Profiles: super admin deletes any" on public.profiles
  for delete using (public.is_super_admin());

-- 5. Jadikan akun tertentu sebagai Super Admin pertama Anda.
--    GANTI email di bawah dengan email akun yang sudah Anda daftarkan,
--    lalu jalankan baris ini sendiri (boleh dijalankan terpisah).
-- update public.profiles set role = 'super_admin'
-- where id = (select id from auth.users where email = 'email-anda@contoh.com');
