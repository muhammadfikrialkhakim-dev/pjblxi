-- =========================================================
-- Perbaikan bug pembayaran: "transaction_details.order_id sudah digunakan"
--
-- Penyebab: order_id yang dikirim ke Midtrans selalu sama persis dengan
-- orders.order_code (tetap/tidak berubah). Midtrans menolak order_id yang
-- sama dipakai lebih dari sekali, jadi begitu pengunjung mencoba bayar lagi
-- (ganti metode pembayaran, reload halaman, atau popup Snap ditutup lalu
-- klik "Bayar Sekarang" lagi), request kedua selalu gagal dengan 400.
--
-- Perbaikan: setiap kali membuat transaksi Snap baru, generate order_id
-- yang unik per PERCOBAAN bayar (order_code + suffix waktu), simpan di
-- kolom midtrans_order_id, lalu webhook mencocokkan balik lewat kolom ini
-- (bukan order_code lagi).
-- =========================================================

alter table public.orders
  add column if not exists midtrans_order_id text;

create index if not exists orders_midtrans_order_id_idx
  on public.orders (midtrans_order_id);

-- Muat ulang schema cache API Supabase agar kolom baru langsung dikenali.
notify pgrst, 'reload schema';
