-- =========================================================
-- Kuota tiket harian yang NYATA
--
-- Sebelumnya kolom tiket.quota_per_day cuma angka tampilan: tidak pernah
-- dihitung terhadap pesanan, jadi kuota tidak berkurang dan bisa dipesan
-- melebihi batas. Migrasi ini membuatnya berfungsi:
--
--   sisa kuota = quota_per_day - jumlah tiket terpesan pada tanggal kunjungan
--
-- Yang dihitung sebagai "terpesan" per paket per tanggal kunjungan:
--   * pesanan yang SUDAH DIBAYAR (payment_status = 'paid'), dan
--   * pesanan yang MASIH MENUNGGU pembayaran selama <= 60 menit sejak dibuat
--     (kursi "ditahan" sebentar supaya tidak keduluan orang lain saat
--     pengunjung membayar).
-- Pesanan gagal / kedaluwarsa / dibatalkan / refund otomatis mengembalikan
-- kuota. Pesanan tertunda lebih dari 60 menit juga tidak lagi menahan kuota
-- (Snap diberi masa berlaku 60 menit di app/checkout/actions.ts, jadi
-- konsisten).
--
-- Pengecekan dilakukan di DATABASE (trigger) dengan mengunci baris tiket,
-- sehingga dua pembeli yang memesan bersamaan tidak bisa sama-sama lolos.
-- Aman dijalankan berulang kali.
-- =========================================================

-- Jumlah tiket terpesan (menahan kuota) untuk 1 paket pada 1 tanggal.
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
        and o.order_status = 'awaiting_payment'
        and o.created_at > now() - interval '60 minutes'
      )
    );
$$;

-- Sisa kuota (tidak pernah negatif). Boleh dipanggil siapa saja (halaman
-- publik perlu menampilkannya); hanya mengembalikan angka, bukan data pesanan.
create or replace function public.tiket_remaining(p_tiket uuid, p_date date)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select greatest(
    t.quota_per_day - public.tiket_sold(t.id, p_date),
    0
  )
  from public.tiket t
  where t.id = p_tiket;
$$;

grant execute on function public.tiket_sold(uuid, date) to anon, authenticated;
grant execute on function public.tiket_remaining(uuid, date) to anon, authenticated;

-- Tolak pesanan yang melebihi sisa kuota. Baris tiket dikunci (FOR UPDATE)
-- supaya pengecekan + insert berjalan berurutan untuk paket yang sama.
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
  select quota_per_day into v_quota
  from public.tiket
  where id = new.tiket_id
  for update;

  if v_quota is null then
    return new; -- paket tidak ditemukan: biarkan foreign key yang menolak
  end if;

  v_left := greatest(v_quota - public.tiket_sold(new.tiket_id, new.visit_date), 0);

  if new.ticket_quantity > v_left then
    raise exception 'KUOTA_HABIS|%', v_left using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_tiket_quota on public.orders;
create trigger trg_enforce_tiket_quota
  before insert on public.orders
  for each row execute function public.enforce_tiket_quota();

-- Mempercepat penghitungan kuota.
create index if not exists orders_tiket_visit_idx
  on public.orders (tiket_id, visit_date);

notify pgrst, 'reload schema';
