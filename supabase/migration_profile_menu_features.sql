-- ============================================================
-- Fitur menu Profil: Pengaturan Notifikasi.
-- Jalankan di Supabase SQL Editor.
-- ============================================================

-- Preferensi notifikasi
alter table public.profiles add column if not exists notify_order_email boolean not null default true;
alter table public.profiles add column if not exists notify_promo_email boolean not null default false;
