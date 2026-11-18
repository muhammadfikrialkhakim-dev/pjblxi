-- =========================================================
-- PERBAIKAN: admin_wisata tidak bisa menyimpan perubahan (foto, dll)
--
-- Penyebab: file migration_v1_to_v2.sql (migrasi lama, sekali pakai) sempat
-- dijalankan ULANG setelah migration_add_admin_wisata_role.sql, sehingga
-- policy "Wisata: admin write" & "Tiket: admin write" ketimpa balik ke
-- versi LAMA yang cuma mengizinkan role admin/super_admin. Akibatnya
-- admin_wisata (mis. Peter) tetap bisa MELIHAT wisatanya, tapi setiap kali
-- menyimpan (termasuk ganti foto), RLS menolak UPDATE-nya secara diam-diam
-- — form terlihat "berhasil" (redirect normal), tapi data sebenarnya tidak
-- pernah tersimpan.
--
-- File ini aman dijalankan kapan saja & berkali-kali — cukup pastikan
-- kondisi AKHIR policy-nya benar, dijalankan SETELAH file mana pun.
-- =========================================================

drop policy if exists "Wisata: public read published" on public.wisata;
create policy "Wisata: public read published" on public.wisata
  for select using (status = 'published' or public.is_admin() or public.is_wisata_owner(id));

drop policy if exists "Wisata: admin write" on public.wisata;
create policy "Wisata: admin write" on public.wisata
  for all using (public.is_admin() or public.is_wisata_owner(id))
  with check (public.is_admin() or public.is_wisata_owner(id));

drop policy if exists "Tiket: public read active" on public.tiket;
create policy "Tiket: public read active" on public.tiket
  for select using (
    is_active = true
    or public.is_admin()
    or public.is_wisata_owner(wisata_id)
    or exists (select 1 from public.wisata w where w.id = tiket.wisata_id and w.status = 'published')
  );

drop policy if exists "Tiket: admin write" on public.tiket;
create policy "Tiket: admin write" on public.tiket
  for all using (public.is_admin() or public.is_wisata_owner(wisata_id))
  with check (public.is_admin() or public.is_wisata_owner(wisata_id));
