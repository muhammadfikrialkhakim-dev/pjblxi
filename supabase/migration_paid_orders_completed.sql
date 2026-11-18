-- Ubah pesanan lama yang sudah dibayar (status "Terkonfirmasi") menjadi "Selesai".
-- Jalankan sekali di Supabase → SQL Editor.
update public.orders
set order_status = 'completed',
    updated_at = now()
where payment_status = 'paid'
  and order_status = 'confirmed';
