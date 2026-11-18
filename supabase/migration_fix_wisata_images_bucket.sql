-- =========================================================
-- Perbaikan upload gambar wisata:
-- 1) Membuat bucket Storage 'wisata-images' kalau belum ada sama sekali
--    (penyebab error "Bucket not found").
-- 2) Memperluas policy upload/update/hapus supaya admin_wisata juga bisa
--    mengunggah foto wisata & tiket miliknya sendiri, tidak cuma
--    admin/super_admin seperti sebelumnya.
--
-- Aman dijalankan berkali-kali & aman dijalankan walau
-- supabase/storage_setup.sql sudah pernah dijalankan sebelumnya.
-- =========================================================

insert into storage.buckets (id, name, public)
values ('wisata-images', 'wisata-images', true)
on conflict (id) do nothing;

-- Helper: true kalau user yang login berrole 'admin_wisata' (siapa pun,
-- tidak dicek wisata mana — storage.objects tidak menyimpan wisata_id
-- jadi tidak bisa dibatasi per-wisata di level ini; scoping per-wisata
-- tetap dijaga di RLS tabel wisata/tiket itu sendiri). Didefinisikan DI
-- SINI (sebelum policy di bawah memakainya) supaya urutan eksekusi benar.
create or replace function public.is_wisata_admin_role()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin_wisata'
  );
$$;

-- Siapa pun boleh membaca (menampilkan) file di bucket ini — dibutuhkan
-- karena foto wisata ditampilkan di halaman publik.
drop policy if exists "Wisata images: public read" on storage.objects;
create policy "Wisata images: public read"
  on storage.objects for select
  using (bucket_id = 'wisata-images');

-- Admin, Super Admin, MAUPUN Admin Wisata boleh upload/ganti/hapus file
-- di bucket ini (sebelumnya cuma admin/super_admin, jadi admin_wisata
-- selalu gagal upload dengan "row-level security policy" walau bucket-nya
-- sudah ada).
drop policy if exists "Wisata images: admin insert" on storage.objects;
create policy "Wisata images: admin insert"
  on storage.objects for insert
  with check (
    bucket_id = 'wisata-images'
    and (public.is_admin() or public.is_wisata_admin_role())
  );

drop policy if exists "Wisata images: admin update" on storage.objects;
create policy "Wisata images: admin update"
  on storage.objects for update
  using (
    bucket_id = 'wisata-images'
    and (public.is_admin() or public.is_wisata_admin_role())
  );

drop policy if exists "Wisata images: admin delete" on storage.objects;
create policy "Wisata images: admin delete"
  on storage.objects for delete
  using (
    bucket_id = 'wisata-images'
    and (public.is_admin() or public.is_wisata_admin_role())
  );
