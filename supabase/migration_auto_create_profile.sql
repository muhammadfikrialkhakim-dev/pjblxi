-- =========================================================
-- FIX: "insert or update on table orders violates foreign key
-- constraint orders_customer_id_fkey"
-- =========================================================
-- Penyebab: user berhasil login (ada di auth.users), tapi row-nya
-- di public.profiles tidak pernah terbuat (insert profile dari
-- app/register/page.tsx gagal diam-diam / user dibuat manual lewat
-- Supabase Dashboard). Karena orders.customer_id wajib merujuk ke
-- profiles(id), booking pun gagal.
--
-- Script ini AMAN dijalankan kapan saja, tidak menghapus data:
-- 1. Membuat trigger di auth.users supaya profiles SELALU otomatis
--    terbuat begitu ada user baru (tidak bergantung lagi ke kode
--    di sisi client yang bisa gagal tanpa ketahuan).
-- 2. Memperbaiki akun-akun lama yang sudah telanjur tidak punya
--    profile (termasuk akun yang dipakai untuk booking tadi).
-- =========================================================

-- 1. Function + trigger: auto-create profile setiap ada user baru.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Backfill: buatkan profile untuk user lama yang belum punya.
insert into public.profiles (id, full_name, role)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', ''),
  'customer'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- Cek hasilnya — jumlah user di auth.users dan public.profiles
-- harus sama sekarang:
select
  (select count(*) from auth.users) as total_auth_users,
  (select count(*) from public.profiles) as total_profiles;
