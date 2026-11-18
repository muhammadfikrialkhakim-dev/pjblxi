-- =========================================================
-- Tambah akses TRANSAKSI (orders & payments) untuk admin_wisata,
-- dibatasi HANYA transaksi yang tiket-nya berasal dari wisata yang
-- ditugaskan padanya. Sebelumnya tabel orders/payments cuma bisa
-- diakses oleh is_admin() (role 'admin'/'super_admin'), jadi
-- admin_wisata selalu mendapat hasil kosong walau query di halaman
-- sudah difilter benar.
-- Jalankan di Supabase SQL Editor SETELAH
-- migration_enforce_one_wisata_per_admin.sql.
-- =========================================================

-- 1. Helper: true kalau order dengan tiket_id tertentu berasal dari
--    wisata yang dimiliki admin_wisata yang sedang login.
create or replace function public.is_order_wisata_owner(target_tiket_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.tiket t
    where t.id = target_tiket_id
      and public.is_wisata_owner(t.wisata_id)
  );
$$;

-- 2. ORDERS — admin_wisata boleh baca & update HANYA order yang
--    tiket-nya milik wisatanya sendiri (selain akses pemilik order &
--    admin/super admin yang sudah ada sebelumnya).
drop policy if exists "Orders: owner reads" on public.orders;
create policy "Orders: owner reads" on public.orders
  for select using (
    customer_id = auth.uid()
    or public.is_admin()
    or public.is_order_wisata_owner(tiket_id)
  );

drop policy if exists "Orders: admin updates" on public.orders;
create policy "Orders: admin updates" on public.orders
  for update using (
    public.is_admin()
    or public.is_order_wisata_owner(tiket_id)
  );

-- 3. PAYMENTS — ikut diperluas dengan cara yang sama supaya proses
--    "Verifikasi Pembayaran" (insert ke payments) juga bisa dipakai
--    admin_wisata untuk transaksi wisatanya sendiri.
drop policy if exists "Payments: owner reads" on public.payments;
create policy "Payments: owner reads" on public.payments
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = payments.order_id
      and (
        o.customer_id = auth.uid()
        or public.is_admin()
        or public.is_order_wisata_owner(o.tiket_id)
      )
    )
  );

drop policy if exists "Payments: admin writes" on public.payments;
create policy "Payments: admin writes" on public.payments
  for all using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = payments.order_id
      and public.is_order_wisata_owner(o.tiket_id)
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = payments.order_id
      and public.is_order_wisata_owner(o.tiket_id)
    )
  );
