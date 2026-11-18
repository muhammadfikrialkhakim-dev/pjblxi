-- =========================================================
-- Bootstrap Super Admin Pertama
-- =========================================================
-- Tidak ada cara lewat UI untuk membuat super_admin PERTAMA (karena
-- fitur "Jadikan Admin" di halaman Kelola Data Admin hanya bisa
-- dipakai OLEH super_admin yang sudah ada). Jadi super_admin pertama
-- harus di-set manual lewat SQL Editor, sekali saja.
--
-- Langkah:
-- 1. Daftar/login dulu di aplikasi dengan email yang ingin dijadikan
--    Super Admin (supaya baris di public.profiles sudah terbentuk).
-- 2. Ganti 'admin@email-anda.com' di bawah ini dengan email tersebut.
-- 3. Jalankan query ini di Supabase SQL Editor.
-- =========================================================

update public.profiles
set role = 'super_admin'
where id = (
  select id from auth.users where email = 'admin@email-anda.com'
);

-- Cek hasilnya:
select p.id, p.full_name, p.role, u.email
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'super_admin';
