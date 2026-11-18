-- =========================================================
-- Backfill contoh "Info Penting untuk Wisatawan" untuk destinasi
-- yang sudah ada di seed data (seed_wisata_malang_raya.sql &
-- seed_wisata_malang_raya_v2.sql). OPSIONAL — jalankan kalau mau
-- fitur ini langsung terisi tanpa input manual satu per satu di
-- Admin > Kelola Wisata. Jalankan SETELAH migration_add_wisata_info.sql.
-- Aman dijalankan berkali-kali (cuma UPDATE, tidak menambah data baru).
-- Silakan sesuaikan lagi angka/jam pastinya lewat Admin kapan saja.
-- =========================================================

update public.wisata set
  opening_hours = 'Setiap hari, 08.00 - 16.00 WIB',
  estimated_duration = '4-6 jam',
  best_time_to_visit = 'Pagi hari (08.00-10.00) supaya tidak terlalu ramai dan panas',
  tips = array['Gunakan sepatu yang nyaman untuk jalan kaki jauh','Bawa topi/payung, sebagian besar area outdoor','Datang lebih pagi saat akhir pekan karena ramai']
where slug in ('jatim-park-1', 'jatim-park-2', 'museum-angkut', 'eco-green-park', 'predator-fun-park', 'museum-d-topeng-kingdom');

update public.wisata set
  opening_hours = 'Setiap hari, 07.00 - 17.00 WIB',
  estimated_duration = '2-3 jam',
  best_time_to_visit = 'Pagi hari sebelum jam 09.00 untuk menghindari kabut naik',
  tips = array['Bawa jaket, suhu cukup dingin di area air terjun','Gunakan alas kaki anti-licin, jalur bisa becek','Jaga jarak dari tepian saat musim hujan']
where slug in ('coban-rondo', 'coban-pelangi', 'coban-talun');

update public.wisata set
  opening_hours = '24 jam (loket tiket 06.00 - 18.00 WIB)',
  estimated_duration = '3-5 jam',
  best_time_to_visit = 'Pagi hari untuk cahaya terbaik dan air laut yang lebih tenang',
  tips = array['Perhatikan papan peringatan ombak, jangan berenang di zona terlarang','Bawa sunscreen dan air minum, minim tempat berteduh','Siapkan uang tunai untuk retribusi & parkir tambahan']
where slug in ('pantai-balekambang', 'pantai-goa-cina', 'pantai-tiga-warna', 'pulau-sempu');

update public.wisata set
  opening_hours = 'Setiap hari, 08.00 - 20.00 WIB',
  estimated_duration = '1-2 jam',
  best_time_to_visit = 'Sore hingga malam hari untuk suasana lampu dan udara sejuk',
  tips = array['Cocok untuk foto, siapkan kamera/HP dengan baterai penuh','Area cukup ramai saat akhir pekan malam']
where slug in ('kampung-warna-warni-jodipan', 'alun-alun-tugu-malang', 'kayutangan-heritage', 'batu-night-spectacular', 'taman-selecta');

update public.wisata set
  opening_hours = 'Setiap hari, 08.00 - 16.00 WIB',
  estimated_duration = '1-2 jam',
  best_time_to_visit = 'Pagi hari saat pengunjung belum ramai',
  tips = array['Ikuti aturan/etika berkunjung yang berlaku di lokasi','Tanyakan pemandu lokal untuk cerita sejarah lebih lengkap']
where slug in ('museum-brawijaya', 'gunung-kawi-wisata-religi');

update public.wisata set
  opening_hours = 'Setiap hari, 06.00 - 17.00 WIB',
  estimated_duration = '2-4 jam',
  best_time_to_visit = 'Pagi hari, udara masih sejuk dan cerah',
  tips = array['Kenakan pakaian yang mudah bergerak','Bawa air minum yang cukup']
where slug in ('paralayang-gunung-banyak', 'kusuma-agrowisata-batu');
