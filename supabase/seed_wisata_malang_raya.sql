-- =========================================================
-- Explore Malang — Seed data tambahan: Wisata Malang Raya
-- Mencakup Kota Malang, Kota Batu, dan Kabupaten Malang.
-- Jalankan file ini di Supabase SQL Editor SETELAH schema.sql.
-- Aman dijalankan berkali-kali (pakai "where not exists").
--
-- Harga & kuota tiket di sini adalah CONTOH/PERKIRAAN — silakan
-- sesuaikan lagi lewat halaman Admin > Kelola Tiket sesuai harga
-- resmi terbaru dari masing-masing tempat wisata.
-- =========================================================

-- ---------------------------------------------------------
-- Kategori tambahan
-- ---------------------------------------------------------
insert into public.categories (name, slug, image_url) values
  ('Taman Rekreasi', 'taman-rekreasi', 'https://images.unsplash.com/photo-1533560904424-a0c61dc306fc'),
  ('Pantai', 'pantai', 'https://images.unsplash.com/photo-1519046904884-53103b34b206'),
  ('Air Terjun', 'air-terjun', 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9'),
  ('Gunung & Perkemahan', 'gunung-perkemahan', 'https://images.unsplash.com/photo-1600087626213-7fa4dbc6b122'),
  ('Edukasi & Museum', 'edukasi-museum', 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4')
on conflict (slug) do nothing;

-- ---------------------------------------------------------
-- KOTA BATU
-- ---------------------------------------------------------

insert into public.wisata
  (category_id, name, slug, location, short_description, description, cover_image_url, gallery_urls, facilities, is_trending, status)
select
  (select id from public.categories where slug = 'taman-rekreasi'),
  'Jatim Park 2', 'jatim-park-2', 'Kota Batu, Malang',
  'Kawasan wisata edukasi dengan Batu Secret Zoo dan Museum Satwa dalam satu area.',
  'Jatim Park 2 memadukan kebun binatang modern (Batu Secret Zoo) dengan Museum Satwa yang menampilkan koleksi diorama dan fosil hewan dari seluruh dunia. Cocok untuk wisata keluarga dan edukasi anak, dengan area indoor dan outdoor yang luas.',
  'https://images.unsplash.com/photo-1516426122078-c23e76319801',
  array['https://images.unsplash.com/photo-1516426122078-c23e76319801','https://images.unsplash.com/photo-1503919545889-aef636e10ad4'],
  array['Area parkir luas','Foodcourt','Musholla','Toilet','Area foto'],
  true, 'published'
where not exists (select 1 from public.wisata where slug = 'jatim-park-2');

insert into public.wisata
  (category_id, name, slug, location, short_description, description, cover_image_url, gallery_urls, facilities, is_trending, status)
select
  (select id from public.categories where slug = 'edukasi-museum'),
  'Museum Angkut', 'museum-angkut', 'Kota Batu, Malang',
  'Museum transportasi dengan ratusan koleksi kendaraan klasik dan zona foto bertema dunia.',
  'Museum Angkut menghadirkan koleksi alat transportasi dari berbagai era dan negara, dilengkapi zona-zona bertema seperti Eropa, Amerika, Hollywood, hingga Batavia yang populer untuk spot foto. Buka hingga malam hari dengan suasana lampu yang khas.',
  'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d',
  array['https://images.unsplash.com/photo-1449965408869-eaa3f722e40d'],
  array['Area parkir','Foodcourt','Musholla','Toilet','Buka malam hari'],
  true, 'published'
where not exists (select 1 from public.wisata where slug = 'museum-angkut');

insert into public.wisata
  (category_id, name, slug, location, short_description, description, cover_image_url, gallery_urls, facilities, is_trending, status)
select
  (select id from public.categories where slug = 'alam'),
  'Taman Rekreasi Selecta', 'taman-selecta', 'Kota Batu, Malang',
  'Taman bunga dan rekreasi keluarga dengan udara sejuk pegunungan.',
  'Selecta adalah taman rekreasi legendaris di Kota Batu dengan hamparan taman bunga, kolam renang, dan wahana keluarga. Udara sejuk khas pegunungan membuatnya nyaman dikunjungi sepanjang hari, terutama pagi hari.',
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946',
  array['https://images.unsplash.com/photo-1490750967868-88aa4486c946'],
  array['Kolam renang','Taman bunga','Area parkir','Penginapan sekitar'],
  false, 'published'
where not exists (select 1 from public.wisata where slug = 'taman-selecta');

insert into public.wisata
  (category_id, name, slug, location, short_description, description, cover_image_url, gallery_urls, facilities, is_trending, status)
select
  (select id from public.categories where slug = 'air-terjun'),
  'Coban Rondo', 'coban-rondo', 'Pujon, Kota Batu, Malang',
  'Air terjun ikonik dengan ketinggian sekitar 60 meter di kawasan hutan pinus.',
  'Coban Rondo merupakan salah satu air terjun paling populer di Malang Raya, dikelilingi hutan pinus yang sejuk. Tersedia jalur trekking singkat dari area parkir menuju air terjun, cocok untuk wisata alam bersama keluarga.',
  'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9',
  array['https://images.unsplash.com/photo-1432405972618-c60b0225b8f9'],
  array['Area parkir','Warung makan','Spot foto','Jalur trekking'],
  false, 'published'
where not exists (select 1 from public.wisata where slug = 'coban-rondo');

insert into public.wisata
  (category_id, name, slug, location, short_description, description, cover_image_url, gallery_urls, facilities, is_trending, status)
select
  (select id from public.categories where slug = 'taman-rekreasi'),
  'Batu Night Spectacular (BNS)', 'batu-night-spectacular', 'Kota Batu, Malang',
  'Taman rekreasi malam dengan wahana lampu, kolam renang malam, dan area kuliner.',
  'BNS adalah destinasi wisata malam khas Kota Batu, menawarkan berbagai wahana bertema lampu warna-warni, kolam renang malam, hingga pasar kuliner. Pilihan favorit untuk melengkapi liburan malam di Batu setelah wisata siang hari.',
  'https://images.unsplash.com/photo-1533560904424-a0c61dc306fc',
  array['https://images.unsplash.com/photo-1533560904424-a0c61dc306fc'],
  array['Area parkir','Kuliner malam','Kolam renang malam','Wahana permainan'],
  false, 'published'
where not exists (select 1 from public.wisata where slug = 'batu-night-spectacular');

-- ---------------------------------------------------------
-- KOTA MALANG
-- ---------------------------------------------------------

insert into public.wisata
  (category_id, name, slug, location, short_description, description, cover_image_url, gallery_urls, facilities, is_trending, status)
select
  (select id from public.categories where slug = 'budaya'),
  'Kampung Warna Warni Jodipan', 'kampung-warna-warni-jodipan', 'Jodipan, Kota Malang',
  'Perkampungan padat penduduk yang disulap penuh warna, ikon foto khas Kota Malang.',
  'Kampung Warna Warni Jodipan mengubah rumah-rumah di bantaran sungai Brantas menjadi kanvas warna-warni raksasa. Terhubung dengan jembatan kaca menuju Kampung Tridi di seberangnya, tempat ini menjadi salah satu spot foto paling ikonik di Kota Malang.',
  'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be',
  array['https://images.unsplash.com/photo-1523482580672-f109ba8cb9be'],
  array['Spot foto','Jembatan kaca','Warung setempat','Toilet'],
  true, 'published'
where not exists (select 1 from public.wisata where slug = 'kampung-warna-warni-jodipan');

insert into public.wisata
  (category_id, name, slug, location, short_description, description, cover_image_url, gallery_urls, facilities, is_trending, status)
select
  (select id from public.categories where slug = 'edukasi-museum'),
  'Museum Brawijaya', 'museum-brawijaya', 'Kota Malang',
  'Museum militer bersejarah dengan koleksi kendaraan tempur dan senjata era kemerdekaan.',
  'Museum Brawijaya menyimpan koleksi kendaraan tempur, senjata, dan dokumentasi sejarah perjuangan kemerdekaan di wilayah Jawa Timur. Cocok untuk wisata edukasi sejarah bagi pelajar maupun umum.',
  'https://images.unsplash.com/photo-1518998053901-5348d3961a04',
  array['https://images.unsplash.com/photo-1518998053901-5348d3961a04'],
  array['Area parkir','Pemandu museum','Toilet'],
  false, 'published'
where not exists (select 1 from public.wisata where slug = 'museum-brawijaya');

-- ---------------------------------------------------------
-- KABUPATEN MALANG
-- ---------------------------------------------------------

insert into public.wisata
  (category_id, name, slug, location, short_description, description, cover_image_url, gallery_urls, facilities, is_trending, status)
select
  (select id from public.categories where slug = 'pantai'),
  'Pantai Balekambang', 'pantai-balekambang', 'Bantur, Kabupaten Malang',
  'Pantai selatan Malang dengan pura di atas karang mirip Tanah Lot Bali.',
  'Pantai Balekambang terkenal dengan tiga pulau karang kecil yang terhubung jembatan, salah satunya terdapat Pura Amerta Jati yang menyerupai suasana Tanah Lot. Ombak pantai selatan cukup besar sehingga pengunjung disarankan berhati-hati saat bermain air.',
  'https://images.unsplash.com/photo-1519046904884-53103b34b206',
  array['https://images.unsplash.com/photo-1519046904884-53103b34b206'],
  array['Area parkir','Warung makan','Penginapan sekitar','Toilet'],
  true, 'published'
where not exists (select 1 from public.wisata where slug = 'pantai-balekambang');

insert into public.wisata
  (category_id, name, slug, location, short_description, description, cover_image_url, gallery_urls, facilities, is_trending, status)
select
  (select id from public.categories where slug = 'petualangan'),
  'Pulau Sempu (via Sendang Biru)', 'pulau-sempu', 'Sumbermanjing Wetan, Kabupaten Malang',
  'Cagar alam dengan laguna biru Segara Anakan, ditempuh trekking dari Pantai Sendang Biru.',
  'Pulau Sempu adalah kawasan cagar alam yang terkenal dengan laguna Segara Anakan berwarna biru jernih. Akses ke pulau ini melalui penyeberangan singkat dari Pantai Sendang Biru dilanjutkan trekking hutan, sehingga disarankan menggunakan pemandu lokal.',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1',
  array['https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1'],
  array['Pemandu lokal wajib','Perahu penyeberangan','Camping ground'],
  true, 'published'
where not exists (select 1 from public.wisata where slug = 'pulau-sempu');

insert into public.wisata
  (category_id, name, slug, location, short_description, description, cover_image_url, gallery_urls, facilities, is_trending, status)
select
  (select id from public.categories where slug = 'air-terjun'),
  'Coban Pelangi', 'coban-pelangi', 'Poncokusumo, Kabupaten Malang',
  'Air terjun setinggi sekitar 110 meter di jalur menuju kawasan Bromo Tengger Semeru.',
  'Coban Pelangi kerap menampilkan efek pelangi dari kabut air terjunnya saat cuaca cerah di pagi hari. Lokasinya berada di jalur Poncokusumo menuju kawasan Gunung Bromo, cocok dipadukan dengan itinerary wisata Bromo.',
  'https://images.unsplash.com/photo-1483168527879-c66136b56105',
  array['https://images.unsplash.com/photo-1483168527879-c66136b56105'],
  array['Area parkir','Warung makan','Jalur trekking'],
  false, 'published'
where not exists (select 1 from public.wisata where slug = 'coban-pelangi');

-- ---------------------------------------------------------
-- Paket TIKET untuk masing-masing wisata di atas
-- (harga contoh — sesuaikan lagi lewat Admin > Kelola Tiket)
-- ---------------------------------------------------------

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Tiket Terusan Jatim Park 2', 'Akses Batu Secret Zoo + Museum Satwa.', 130000, 300
from public.wisata where slug = 'jatim-park-2'
and not exists (select 1 from public.tiket where name = 'Tiket Terusan Jatim Park 2');

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Tiket Masuk Museum Angkut', 'Tiket masuk reguler hari kerja.', 100000, 300
from public.wisata where slug = 'museum-angkut'
and not exists (select 1 from public.tiket where name = 'Tiket Masuk Museum Angkut');

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Tiket Masuk Selecta', 'Tiket masuk area taman rekreasi.', 30000, 400
from public.wisata where slug = 'taman-selecta'
and not exists (select 1 from public.tiket where name = 'Tiket Masuk Selecta');

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Tiket Masuk Coban Rondo', 'Tiket masuk kawasan wisata air terjun.', 15000, 500
from public.wisata where slug = 'coban-rondo'
and not exists (select 1 from public.tiket where name = 'Tiket Masuk Coban Rondo');

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Tiket Masuk BNS', 'Tiket masuk taman rekreasi malam.', 30000, 400
from public.wisata where slug = 'batu-night-spectacular'
and not exists (select 1 from public.tiket where name = 'Tiket Masuk BNS');

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Tiket Masuk Kampung Jodipan', 'Tiket masuk + akses jembatan kaca.', 15000, 500
from public.wisata where slug = 'kampung-warna-warni-jodipan'
and not exists (select 1 from public.tiket where name = 'Tiket Masuk Kampung Jodipan');

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Tiket Masuk Museum Brawijaya', 'Tiket masuk reguler.', 10000, 200
from public.wisata where slug = 'museum-brawijaya'
and not exists (select 1 from public.tiket where name = 'Tiket Masuk Museum Brawijaya');

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Tiket Masuk Pantai Balekambang', 'Tiket masuk kawasan pantai.', 15000, 600
from public.wisata where slug = 'pantai-balekambang'
and not exists (select 1 from public.tiket where name = 'Tiket Masuk Pantai Balekambang');

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Paket Trekking + Pemandu Sempu', 'Penyeberangan perahu, pemandu lokal, trekking ke laguna.', 150000, 60
from public.wisata where slug = 'pulau-sempu'
and not exists (select 1 from public.tiket where name = 'Paket Trekking + Pemandu Sempu');

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Tiket Masuk Coban Pelangi', 'Tiket masuk kawasan air terjun.', 15000, 400
from public.wisata where slug = 'coban-pelangi'
and not exists (select 1 from public.tiket where name = 'Tiket Masuk Coban Pelangi');
