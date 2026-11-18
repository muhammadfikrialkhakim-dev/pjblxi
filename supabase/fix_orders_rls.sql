-- =========================================================
-- FIX: "new row violates row-level security policy for table orders"
-- =========================================================
-- Penyebab paling umum: schema.sql sempat dijalankan lebih dari
-- sekali di SQL Editor. Statement "create policy" TIDAK punya
-- "if not exists", jadi begitu satu policy dianggap "already exists",
-- sisa script berhenti — termasuk policy untuk tabel `orders` yang
-- letaknya di tengah file.
--
-- Script ini AMAN dijalankan kapan saja, tidak menghapus/mengubah
-- data apa pun, hanya membuat ulang 3 policy tabel `orders` yang
-- dibutuhkan supaya proses booking bisa insert order baru.
-- =========================================================

alter table public.orders enable row level security;

drop policy if exists "Orders: owner reads" on public.orders;
create policy "Orders: owner reads" on public.orders
  for select using (customer_id = auth.uid() or public.is_admin());

drop policy if exists "Orders: owner creates" on public.orders;
create policy "Orders: owner creates" on public.orders
  for insert with check (customer_id = auth.uid() or customer_id is null);

drop policy if exists "Orders: admin updates" on public.orders;
create policy "Orders: admin updates" on public.orders
  for update using (public.is_admin());

-- Cek hasilnya — harus muncul 3 baris (select, insert, update):
select policyname, cmd from pg_policies where tablename = 'orders';
