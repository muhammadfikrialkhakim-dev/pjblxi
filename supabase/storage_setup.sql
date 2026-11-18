-- =========================================================
-- Storage bucket untuk gambar wisata (cover + galeri)
-- Jalankan di Supabase SQL Editor SETELAH schema.sql.
-- =========================================================

-- Buat bucket publik bernama 'wisata-images' jika belum ada.
-- Publik di sini artinya siapa pun bisa MELIHAT gambarnya (perlu, karena
-- ditampilkan di halaman publik) — upload/hapus tetap dibatasi lewat
-- policy di bawah, hanya admin yang bisa.
insert into storage.buckets (id, name, public)
values ('wisata-images', 'wisata-images', true)
on conflict (id) do nothing;

-- Siapa pun boleh membaca (menampilkan) file di bucket ini.
drop policy if exists "Wisata images: public read" on storage.objects;
create policy "Wisata images: public read"
  on storage.objects for select
  using (bucket_id = 'wisata-images');

-- Hanya admin (lihat fungsi public.is_admin() di schema.sql) yang boleh
-- upload, mengganti, atau menghapus file di bucket ini.
drop policy if exists "Wisata images: admin insert" on storage.objects;
create policy "Wisata images: admin insert"
  on storage.objects for insert
  with check (bucket_id = 'wisata-images' and public.is_admin());

drop policy if exists "Wisata images: admin update" on storage.objects;
create policy "Wisata images: admin update"
  on storage.objects for update
  using (bucket_id = 'wisata-images' and public.is_admin());

drop policy if exists "Wisata images: admin delete" on storage.objects;
create policy "Wisata images: admin delete"
  on storage.objects for delete
  using (bucket_id = 'wisata-images' and public.is_admin());
