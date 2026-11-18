-- =========================================================
-- FIX v2 — "new row violates row-level security policy for table orders"
-- Jalankan SELURUH file ini sekaligus di Supabase SQL Editor.
-- Aman dijalankan berkali-kali, tidak menghapus data.
-- =========================================================

-- 1. Pastikan fungsi is_admin() benar-benar ada (kadang gagal dibuat
--    kalau schema.sql sempat berhenti di tengah karena error lain).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 2. Hapus SEMUA policy yang ada di tabel orders, apa pun namanya —
--    supaya tidak ada policy lama/salah nama yang masih nyangkut dan
--    diam-diam memblokir insert.
do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'orders'
  loop
    execute format('drop policy if exists %I on public.orders', pol.policyname);
  end loop;
end $$;

-- 3. Pastikan RLS aktif, lalu buat ulang 3 policy yang dibutuhkan.
alter table public.orders enable row level security;

create policy "Orders: owner reads" on public.orders
  for select using (customer_id = auth.uid() or public.is_admin());

create policy "Orders: owner creates" on public.orders
  for insert with check (customer_id = auth.uid() or customer_id is null);

create policy "Orders: admin updates" on public.orders
  for update using (public.is_admin());

-- =========================================================
-- 4. DIAGNOSTIK — jalankan dan lihat hasilnya, kirim ke saya jika
--    masih error setelah ini.
-- =========================================================

-- Harus muncul 3 baris: select, insert, update
select policyname, cmd, qual, with_check
from pg_policies
where tablename = 'orders';

-- Harus muncul 1 baris dengan rowsecurity = true
select relname, relrowsecurity
from pg_class
where relname = 'orders';

-- Cek fungsi is_admin ada
select proname from pg_proc where proname = 'is_admin';
