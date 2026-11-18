-- =========================================================
-- Explore Malang — Seed data tambahan v2: 12 wisata baru
-- Melengkapi supabase/seed_wisata_malang_raya.sql (Kota Malang,
-- Kota Batu, Kabupaten Malang).
-- Jalankan SETELAH schema.sql dan seed_wisata_malang_raya.sql.
-- Aman dijalankan berkali-kali (pakai "where not exists").
--
-- Harga & kuota tiket di sini adalah CONTOH/PERKIRAAN — silakan
-- sesuaikan lagi lewat halaman Admin > Kelola Tiket sesuai harga
-- resmi terbaru dari masing-masing tempat wisata.
-- =========================================================

-- ---------------------------------------------------------
-- KOTA BATU
-- ---------------------------------------------------------

insert into public.wisata
  (category_id, name, slug, location, short_description, description, cover_image_url, gallery_urls, facilities, is_trending, status)
select
  (select id from public.categories where slug = 'taman-rekreasi'),
  'Jatim Park 1', 'jatim-park-1', 'Kota Batu, Malang',
  'Taman rekreasi edukasi pelopor dengan wahana sains, agro, dan permainan keluarga.',
  'Jatim Park 1 adalah cikal bakal kawasan wisata edukasi di Kota Batu, memadukan wahana sains interaktif, area agro, dan berbagai permainan keluarga dalam satu kompleks. Cocok untuk kunjungan sehari penuh bersama anak-anak.',
  'https://images.unsplash.com/photo-1502301197179-65228ab57f78',
  array['https://images.unsplash.com/photo-1502301197179-65228ab57f78'],
  array['Area parkir luas','Foodcourt','Musholla','Toilet','Wahana indoor & outdoor'],
  false, 'published'
where not exists (select 1 from public.wisata where slug = 'jatim-park-1');

insert into public.wisata
  (category_id, name, slug, location, short_description, description, cover_image_url, gallery_urls, facilities, is_trending, status)
select
  (select id from public.categories where slug = 'edukasi-museum'),
  'Eco Green Park', 'eco-green-park', 'Kota Batu, Malang',
  'Taman edukasi lingkungan dengan koleksi burung, satwa, dan wahana daur ulang kreatif.',
  'Eco Green Park mengusung konsep wisata edukasi ramah lingkungan, menampilkan koleksi burung dan satwa dari berbagai belahan dunia serta instalasi seni dari barang daur ulang. Satu kompleks dengan Jatim Park 1, cocok untuk edukasi lingkungan bagi anak-anak.',
  'https://images.unsplash.com/photo-1444464666168-49d633b86797',
  array['https://images.unsplash.com/photo-1444464666168-49d633b86797'],
  array['Area parkir','Foodcourt','Toilet','Spot foto edukasi'],
  false, 'published'
where not exists (select 1 from public.wisata where slug = 'eco-green-park');

insert into public.wisata
  (category_id, name, slug, location, short_description, description, cover_image_url, gallery_urls, facilities, is_trending, status)
select
  (select id from public.categories where slug = 'taman-rekreasi'),
  'Predator Fun Park', 'predator-fun-park', 'Kota Batu, Malang',
  'Taman satwa reptil dan predator dengan zona interaktif untuk anak.',
  'Predator Fun Park menghadirkan koleksi reptil, burung predator, dan satwa buas lain dalam kandang-kandang tematik yang aman dikunjungi dari dekat. Tersedia sesi edukasi dan foto bersama beberapa satwa jinak.',
  'https://images.unsplash.com/photo-1584844115436-473887b1e6f3',
  array['https://images.unsplash.com/photo-1584844115436-473887b1e6f3'],
  array['Area parkir','Musholla','Toilet','Sesi edukasi satwa'],
  false, 'published'
where not exists (select 1 from public.wisata where slug = 'predator-fun-park');

insert into public.wisata
  (category_id, name, slug, location, short_description, description, cover_image_url, gallery_urls, facilities, is_trending, status)
select
  (select id from public.categories where slug = 'edukasi-museum'),
  'Museum D''Topeng Kingdom', 'museum-d-topeng-kingdom', 'Kota Batu, Malang',
  'Museum topeng nusantara dan koleksi barang antik dalam bangunan bergaya kerajaan.',
  'Museum D''Topeng Kingdom menyimpan ratusan koleksi topeng dari berbagai daerah di Indonesia dan mancanegara, dipadukan dengan koleksi barang antik serta taman bergaya kerajaan yang instagramable.',
  'https://images.unsplash.com/photo-1580619305218-8423a7ef79b4',
  array['https://images.unsplash.com/photo-1580619305218-8423a7ef79b4'],
  array['Area parkir','Pemandu museum','Toilet','Spot foto'],
  false, 'published'
where not exists (select 1 from public.wisata where slug = 'museum-d-topeng-kingdom');

insert into public.wisata
  (category_id, name, slug, location, short_description, description, cover_image_url, gallery_urls, facilities, is_trending, status)
select
  (select id from public.categories where slug = 'petualangan'),
  'Paralayang Gunung Banyak (Omah Kayu)', 'paralayang-gunung-banyak', 'Gunung Banyak, Kota Batu',
  'Spot paralayang dan rumah pohon dengan panorama Kota Batu dari ketinggian.',
  'Gunung Banyak dikenal sebagai lokasi paralayang favorit di Jawa Timur, sekaligus rumah bagi Omah Kayu — rumah-rumah pohon unik untuk menikmati pemandangan Kota Batu dari atas. Waktu terbaik berkunjung adalah pagi hari saat kabut belum naik.',
  'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5',
  array['https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5'],
  array['Area parkir','Sewa paralayang tandem','Warung makan','Spot foto'],
  true, 'published'
where not exists (select 1 from public.wisata where slug = 'paralayang-gunung-banyak');

insert into public.wisata
  (category_id, name, slug, location, short_description, description, cover_image_url, gallery_urls, facilities, is_trending, status)
select
  (select id from public.categories where slug = 'air-terjun'),
  'Coban Talun', 'coban-talun', 'Bumiaji, Kota Batu',
  'Air terjun dengan area glamping dan taman bunga di sekitarnya.',
  'Coban Talun memadukan wisata air terjun dengan area glamping dan taman bunga (Bunga Bulan) di sekitarnya, cocok untuk wisata alam sekaligus bersantai menikmati suasana pegunungan yang sejuk.',
  'https://images.unsplash.com/photo-1467873451871-1c1e12e9c8fb',
  array['https://images.unsplash.com/photo-1467873451871-1c1e12e9c8fb'],
  array['Area parkir','Glamping','Taman bunga','Warung makan'],
  false, 'published'
where not exists (select 1 from public.wisata where slug = 'coban-talun');

-- ---------------------------------------------------------
-- KOTA MALANG
-- ---------------------------------------------------------

insert into public.wisata
  (category_id, name, slug, location, short_description, description, cover_image_url, gallery_urls, facilities, is_trending, status)
select
  (select id from public.categories where slug = 'budaya'),
  'Kayutangan Heritage', 'kayutangan-heritage', 'Kayutangan, Kota Malang',
  'Kawasan jalan bersejarah dengan bangunan kolonial dan lorong-lorong tematik.',
  'Kayutangan Heritage adalah kawasan jalan lama Kota Malang yang dipenuhi bangunan bergaya kolonial, kini ditata ulang dengan lorong-lorong tematik yang penuh warna dan spot foto. Ramai dikunjungi terutama sore hingga malam hari.',
  'https://images.unsplash.com/photo-1555400038-63f5ba517a47',
  array['https://images.unsplash.com/photo-1555400038-63f5ba517a47'],
  array['Area parkir sekitar','Kuliner kaki lima','Spot foto','Bangunan heritage'],
  false, 'published'
where not exists (select 1 from public.wisata where slug = 'kayutangan-heritage');

insert into public.wisata
  (category_id, name, slug, location, short_description, description, cover_image_url, gallery_urls, facilities, is_trending, status)
select
  (select id from public.categories where slug = 'budaya'),
  'Alun-Alun Tugu Malang', 'alun-alun-tugu-malang', 'Kota Malang',
  'Taman kota ikonik dengan tugu bersejarah, favorit untuk bersantai di sore hari.',
  'Alun-Alun Tugu terletak tepat di depan Balai Kota Malang, menjadi ruang publik favorit warga untuk bersantai, jogging, atau sekadar menikmati suasana kota di sore hari. Lokasinya strategis, dekat dengan Stasiun Malang Kota Baru.',
  'https://images.unsplash.com/photo-1596395463672-9e5a4f3a4c58',
  array['https://images.unsplash.com/photo-1596395463672-9e5a4f3a4c58'],
  array['Area terbuka','Kuliner sekitar','Area parkir sekitar'],
  false, 'published'
where not exists (select 1 from public.wisata where slug = 'alun-alun-tugu-malang');

-- ---------------------------------------------------------
-- KABUPATEN MALANG
-- ---------------------------------------------------------

insert into public.wisata
  (category_id, name, slug, location, short_description, description, cover_image_url, gallery_urls, facilities, is_trending, status)
select
  (select id from public.categories where slug = 'pantai'),
  'Pantai Tiga Warna', 'pantai-tiga-warna', 'Sitiarjo, Kabupaten Malang',
  'Pantai konservasi dengan gradasi air laut tiga warna, kuota kunjungan dibatasi.',
  'Pantai Tiga Warna berada dalam kawasan Clungup Mangrove Conservation dan terkenal dengan gradasi warna air lautnya yang jernih. Kunjungan dibatasi kuotanya per hari untuk menjaga kelestarian ekosistem, sehingga disarankan memesan jauh-jauh hari.',
  'https://images.unsplash.com/photo-1509233725247-49e657c54213',
  array['https://images.unsplash.com/photo-1509233725247-49e657c54213'],
  array['Konservasi mangrove','Snorkeling','Pemandu wajib','Kuota harian terbatas'],
  true, 'published'
where not exists (select 1 from public.wisata where slug = 'pantai-tiga-warna');

insert into public.wisata
  (category_id, name, slug, location, short_description, description, cover_image_url, gallery_urls, facilities, is_trending, status)
select
  (select id from public.categories where slug = 'pantai'),
  'Pantai Goa Cina', 'pantai-goa-cina', 'Sitiarjo, Kabupaten Malang',
  'Pantai selatan dengan gua kecil di tebing dan gugusan karang di tepi pantai.',
  'Pantai Goa Cina memiliki gua kecil di sisi tebing yang menjadi asal-usul namanya, dikelilingi gugusan karang dan pasir putih. Ombak pantai selatan cukup kuat, cocok untuk menikmati pemandangan dan berkemah di area sekitar.',
  'https://images.unsplash.com/photo-1439405326854-014607f694d7',
  array['https://images.unsplash.com/photo-1439405326854-014607f694d7'],
  array['Area parkir','Camping ground','Warung makan','Toilet'],
  false, 'published'
where not exists (select 1 from public.wisata where slug = 'pantai-goa-cina');

insert into public.wisata
  (category_id, name, slug, location, short_description, description, cover_image_url, gallery_urls, facilities, is_trending, status)
select
  (select id from public.categories where slug = 'budaya'),
  'Gunung Kawi (Wisata Religi)', 'gunung-kawi-wisata-religi', 'Wonosari, Kabupaten Malang',
  'Kawasan ziarah bersejarah yang ramai dikunjungi peziarah dari berbagai daerah.',
  'Gunung Kawi merupakan kawasan wisata religi dan ziarah yang telah dikenal luas, dengan suasana pegunungan yang sejuk dan deretan pertokoan khas sepanjang jalan menuju area makam. Cocok bagi yang tertarik wisata sejarah dan budaya spiritual.',
  'https://images.unsplash.com/photo-1600087626213-7fa4dbc6b122',
  array['https://images.unsplash.com/photo-1600087626213-7fa4dbc6b122'],
  array['Area parkir','Penginapan sekitar','Pertokoan lokal','Toilet'],
  false, 'published'
where not exists (select 1 from public.wisata where slug = 'gunung-kawi-wisata-religi');

insert into public.wisata
  (category_id, name, slug, location, short_description, description, cover_image_url, gallery_urls, facilities, is_trending, status)
select
  (select id from public.categories where slug = 'gunung-perkemahan'),
  'Kusuma Agrowisata Batu', 'kusuma-agrowisata-batu', 'Kota Batu, Malang',
  'Kebun petik apel dan buah pegunungan dengan area outbound keluarga.',
  'Kusuma Agrowisata menawarkan pengalaman memetik apel dan buah lain langsung dari kebunnya di dataran tinggi Kota Batu, dilengkapi area outbound dan penginapan bagi yang ingin bermalam menikmati udara pegunungan.',
  'https://images.unsplash.com/photo-1445052319048-99b90ad5cb60',
  array['https://images.unsplash.com/photo-1445052319048-99b90ad5cb60'],
  array['Petik buah langsung','Area outbound','Penginapan','Restoran'],
  false, 'published'
where not exists (select 1 from public.wisata where slug = 'kusuma-agrowisata-batu');

-- ---------------------------------------------------------
-- Paket TIKET untuk masing-masing wisata di atas
-- (harga contoh — sesuaikan lagi lewat Admin > Kelola Tiket)
-- ---------------------------------------------------------

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Tiket Terusan Jatim Park 1', 'Akses seluruh wahana Jatim Park 1.', 120000, 300
from public.wisata where slug = 'jatim-park-1'
and not exists (select 1 from public.tiket where name = 'Tiket Terusan Jatim Park 1');

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Tiket Masuk Eco Green Park', 'Tiket masuk reguler hari kerja.', 100000, 300
from public.wisata where slug = 'eco-green-park'
and not exists (select 1 from public.tiket where name = 'Tiket Masuk Eco Green Park');

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Tiket Masuk Predator Fun Park', 'Tiket masuk reguler.', 90000, 200
from public.wisata where slug = 'predator-fun-park'
and not exists (select 1 from public.tiket where name = 'Tiket Masuk Predator Fun Park');

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Tiket Masuk Museum D''Topeng', 'Tiket masuk reguler.', 100000, 200
from public.wisata where slug = 'museum-d-topeng-kingdom'
and not exists (select 1 from public.tiket where name = 'Tiket Masuk Museum D''Topeng');

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Paket Paralayang Tandem', 'Terbang tandem bersama instruktur berpengalaman.', 400000, 40
from public.wisata where slug = 'paralayang-gunung-banyak'
and not exists (select 1 from public.tiket where name = 'Paket Paralayang Tandem');

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Tiket Masuk Omah Kayu', 'Tiket masuk area rumah pohon & foto.', 20000, 200
from public.wisata where slug = 'paralayang-gunung-banyak'
and not exists (select 1 from public.tiket where name = 'Tiket Masuk Omah Kayu');

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Tiket Masuk Coban Talun', 'Tiket masuk kawasan air terjun & taman bunga.', 25000, 400
from public.wisata where slug = 'coban-talun'
and not exists (select 1 from public.tiket where name = 'Tiket Masuk Coban Talun');

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Tiket Masuk Kayutangan Heritage', 'Tiket masuk kawasan lorong tematik.', 5000, 500
from public.wisata where slug = 'kayutangan-heritage'
and not exists (select 1 from public.tiket where name = 'Tiket Masuk Kayutangan Heritage');

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Tiket Masuk Alun-Alun Tugu', 'Akses area taman kota (gratis, kuota simbolis untuk data kunjungan).', 0, 1000
from public.wisata where slug = 'alun-alun-tugu-malang'
and not exists (select 1 from public.tiket where name = 'Tiket Masuk Alun-Alun Tugu');

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Paket Konservasi Pantai Tiga Warna', 'Tiket masuk + pemandu wajib kawasan konservasi.', 100000, 100
from public.wisata where slug = 'pantai-tiga-warna'
and not exists (select 1 from public.tiket where name = 'Paket Konservasi Pantai Tiga Warna');

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Tiket Masuk Pantai Goa Cina', 'Tiket masuk kawasan pantai.', 15000, 400
from public.wisata where slug = 'pantai-goa-cina'
and not exists (select 1 from public.tiket where name = 'Tiket Masuk Pantai Goa Cina');

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Tiket Masuk Kawasan Gunung Kawi', 'Tiket masuk area wisata religi.', 10000, 500
from public.wisata where slug = 'gunung-kawi-wisata-religi'
and not exists (select 1 from public.tiket where name = 'Tiket Masuk Kawasan Gunung Kawi');

insert into public.tiket (wisata_id, name, description, price, quota_per_day)
select id, 'Tiket Petik Apel Kusuma Agrowisata', 'Tiket masuk + petik apel sepuasnya (sesuai musim).', 45000, 150
from public.wisata where slug = 'kusuma-agrowisata-batu'
and not exists (select 1 from public.tiket where name = 'Tiket Petik Apel Kusuma Agrowisata');
