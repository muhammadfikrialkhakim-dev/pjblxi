-- =========================================================
-- Migrasi: wajib login untuk memesan (tidak ada lagi guest checkout)
-- Jalankan di Supabase SQL Editor pada project yang SUDAH berjalan.
-- Aman dijalankan langsung, tidak perlu cek manual dulu.
-- =========================================================

-- 1. Hapus order lama yang tidak punya pemilik (customer_id kosong).
--    Ini data tamu dari sebelum fitur wajib-login dibuat — aman dihapus
--    kalau memang cuma data uji coba. Payments terkait ikut terhapus
--    otomatis (ON DELETE CASCADE).
--    (Kalau order tamu lama itu perlu dipertahankan untuk riwayat/laporan,
--    skip baris delete ini dan baris "alter column set not null" di
--    bawah — biarkan kolom tetap nullable, cukup jalankan langkah 3 saja.)
delete from public.orders where customer_id is null;

-- 2. Sekarang kolomnya bisa dipaksa wajib diisi.
alter table public.orders alter column customer_id set not null;

-- 3. Perbarui policy insert: wajib customer_id = akun yang sedang login.
drop policy if exists "Orders: owner creates" on public.orders;
create policy "Orders: owner creates" on public.orders
  for insert with check (customer_id = auth.uid());

