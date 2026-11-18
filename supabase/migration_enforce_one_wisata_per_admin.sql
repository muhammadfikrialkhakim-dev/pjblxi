-- =========================================================
-- Perbaikan aturan: 1 WISATA hanya punya 1 ADMIN, dan 1 ADMIN
-- hanya boleh mengelola 1 WISATA (bukan sebaliknya — sebelum
-- migration ini tidak ada yang mencegah satu akun admin_wisata
-- ditugaskan ke lebih dari satu wisata sekaligus).
-- Jalankan di Supabase SQL Editor SETELAH
-- migration_add_admin_wisata_role.sql.
-- =========================================================

-- 1. Rapikan dulu kalau kebetulan sudah ada data yang melanggar
--    (satu admin_id kepasang di lebih dari satu baris wisata).
--    Yang dipertahankan cuma wisata dengan created_at paling lama;
--    sisanya di-set admin_id = NULL supaya tidak nyangkut dan tidak
--    menggagalkan pembuatan unique index di bawah.
with duplikat as (
  select
    id,
    admin_id,
    row_number() over (
      partition by admin_id
      order by created_at asc
    ) as urutan
  from public.wisata
  where admin_id is not null
)
update public.wisata w
set admin_id = null
from duplikat d
where w.id = d.id
  and d.urutan > 1;

-- 2. Unique index (partial — abaikan baris admin_id NULL karena banyak
--    wisata yang memang belum ditugaskan). Ini jaminan di level database:
--    sebuah admin_id cuma boleh muncul di SATU baris wisata.
drop index if exists wisata_admin_id_unique_idx;
create unique index wisata_admin_id_unique_idx
  on public.wisata (admin_id)
  where admin_id is not null;

-- 3. (Opsional tapi disarankan) Pastikan admin_id yang diisi memang
--    akun ber-role 'admin_wisata', bukan role lain. Dicek lewat trigger
--    karena constraint biasa tidak bisa query tabel lain.
create or replace function public.check_wisata_admin_role()
returns trigger
language plpgsql
as $$
begin
  if new.admin_id is not null then
    if not exists (
      select 1 from public.profiles
      where id = new.admin_id and role = 'admin_wisata'
    ) then
      raise exception 'admin_id harus akun dengan role admin_wisata';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_check_wisata_admin_role on public.wisata;
create trigger trg_check_wisata_admin_role
  before insert or update of admin_id on public.wisata
  for each row execute function public.check_wisata_admin_role();
