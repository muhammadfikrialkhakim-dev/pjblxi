-- =========================================================
-- Status pesanan "draft".
--
-- Pesanan yang sudah masuk ke halaman pembayaran (QR / VA sudah keluar) tetapi
-- tidak jadi dibayar TIDAK lagi dibatalkan, melainkan disimpan sebagai DRAF:
--   * order_status = 'draft', payment_status tetap 'pending'
--   * tidak menahan kuota tiket
--   * pengunjung bisa "Lanjutkan Pembayaran" dari halaman Pesanan Saya
--     (kuota diperiksa ulang saat dilanjutkan)
--
-- Jalankan sekali di Supabase SQL Editor.
-- =========================================================

-- 1) Izinkan nilai 'draft' pada order_status.
alter table public.orders drop constraint if exists orders_order_status_check;
alter table public.orders
  add constraint orders_order_status_check
  check (order_status in ('awaiting_payment', 'confirmed', 'completed', 'cancelled', 'draft'));

-- 2) Kapan kuota mulai ditahan. Draf yang dilanjutkan menahan kuota lagi
--    selama 60 menit sejak dilanjutkan (bukan sejak pesanan pertama dibuat).
alter table public.orders add column if not exists hold_started_at timestamptz;

create or replace function public.tiket_sold(p_tiket uuid, p_date date)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(o.ticket_quantity), 0)::integer
  from public.orders o
  where o.tiket_id = p_tiket
    and o.visit_date = p_date
    and (
      o.payment_status = 'paid'
      or (
        o.payment_status = 'pending'
        and o.order_status = 'awaiting_payment'   -- draf tidak menahan kuota
        and coalesce(o.hold_started_at, o.created_at) > now() - interval '60 minutes'
      )
    );
$$;

-- 3) Periksa kuota juga saat draf dilanjutkan (draft -> awaiting_payment).
create or replace function public.enforce_tiket_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quota integer;
  v_left  integer;
begin
  if tg_op = 'UPDATE' and not (old.order_status = 'draft' and new.order_status = 'awaiting_payment') then
    return new;
  end if;

  select quota_per_day into v_quota
  from public.tiket
  where id = new.tiket_id
  for update;

  if v_quota is null then
    return new;
  end if;

  v_left := greatest(v_quota - public.tiket_sold(new.tiket_id, new.visit_date), 0);

  if new.ticket_quantity > v_left then
    raise exception 'KUOTA_HABIS|%', v_left using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_tiket_quota_resume on public.orders;
create trigger trg_enforce_tiket_quota_resume
  before update of order_status on public.orders
  for each row execute function public.enforce_tiket_quota();

-- 4) Pesanan lama yang menggantung (belum pernah membuat transaksi pembayaran)
--    dan sudah lewat 60 menit -> jadikan draf.
update public.orders
   set order_status = 'draft'
 where order_status = 'awaiting_payment'
   and payment_status = 'pending'
   and midtrans_order_id is null
   and created_at < now() - interval '60 minutes';

notify pgrst, 'reload schema';
