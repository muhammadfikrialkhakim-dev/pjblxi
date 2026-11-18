/**
 * Daftar provinsi (38) dan kabupaten/kota (514) di Indonesia untuk isian
 * domisili. Disimpan sebagai data statis (tanpa memanggil API luar) supaya
 * cepat dan tetap jalan walau layanan pihak ketiga sedang bermasalah.
 *
 * Sumber data: kode wilayah administrasi Kemendagri (dihimpun dari
 * dataset terbuka), disesuaikan dengan pembentukan provinsi baru di Papua
 * (Papua Selatan, Papua Tengah, Papua Pegunungan, Papua Barat Daya).
 *
 * Nilai yang disimpan di profiles.city berbentuk "Kota Malang, Jawa Timur".
 */

type Raw = { name: string; kab: string[]; kota: string[] };

const RAW: Raw[] = [
  {
    name: "Aceh",
    kab: ["Aceh Barat", "Aceh Barat Daya", "Aceh Besar", "Aceh Jaya", "Aceh Selatan", "Aceh Singkil", "Aceh Tamiang", "Aceh Tengah", "Aceh Tenggara", "Aceh Timur", "Aceh Utara", "Bener Meriah", "Bireuen", "Gayo Lues", "Nagan Raya", "Pidie", "Pidie Jaya", "Simeulue"],
    kota: ["Banda Aceh", "Langsa", "Lhokseumawe", "Sabang", "Subulussalam"],
  },
  {
    name: "Sumatera Utara",
    kab: ["Asahan", "Batu Bara", "Dairi", "Deli Serdang", "Humbang Hasundutan", "Karo", "Labuhanbatu", "Labuhanbatu Selatan", "Labuhanbatu Utara", "Langkat", "Mandailing Natal", "Nias", "Nias Barat", "Nias Selatan", "Nias Utara", "Padang Lawas", "Padang Lawas Utara", "Pakpak Bharat", "Samosir", "Serdang Bedagai", "Simalungun", "Tapanuli Selatan", "Tapanuli Tengah", "Tapanuli Utara", "Toba"],
    kota: ["Binjai", "Gunungsitoli", "Medan", "Padangsidimpuan", "Pematangsiantar", "Sibolga", "Tanjungbalai", "Tebing Tinggi"],
  },
  {
    name: "Sumatera Barat",
    kab: ["Agam", "Dharmasraya", "Kepulauan Mentawai", "Lima Puluh Kota", "Padang Pariaman", "Pasaman", "Pasaman Barat", "Pesisir Selatan", "Sijunjung", "Solok", "Solok Selatan", "Tanah Datar"],
    kota: ["Bukittinggi", "Padang", "Padang Panjang", "Pariaman", "Payakumbuh", "Sawahlunto", "Solok"],
  },
  {
    name: "Riau",
    kab: ["Bengkalis", "Indragiri Hilir", "Indragiri Hulu", "Kampar", "Kepulauan Meranti", "Kuantan Singingi", "Pelalawan", "Rokan Hilir", "Rokan Hulu", "Siak"],
    kota: ["Dumai", "Pekanbaru"],
  },
  {
    name: "Jambi",
    kab: ["Batanghari", "Bungo", "Kerinci", "Merangin", "Muaro Jambi", "Sarolangun", "Tanjung Jabung Barat", "Tanjung Jabung Timur", "Tebo"],
    kota: ["Jambi", "Sungai Penuh"],
  },
  {
    name: "Sumatera Selatan",
    kab: ["Banyuasin", "Empat Lawang", "Lahat", "Muara Enim", "Musi Banyuasin", "Musi Rawas", "Musi Rawas Utara", "Ogan Ilir", "Ogan Komering Ilir", "Ogan Komering Ulu", "Ogan Komering Ulu Selatan", "Ogan Komering Ulu Timur", "Penukal Abab Lematang Ilir"],
    kota: ["Lubuklinggau", "Pagar Alam", "Palembang", "Prabumulih"],
  },
  {
    name: "Bengkulu",
    kab: ["Bengkulu Selatan", "Bengkulu Tengah", "Bengkulu Utara", "Kaur", "Kepahiang", "Lebong", "Mukomuko", "Rejang Lebong", "Seluma"],
    kota: ["Bengkulu"],
  },
  {
    name: "Lampung",
    kab: ["Lampung Barat", "Lampung Selatan", "Lampung Tengah", "Lampung Timur", "Lampung Utara", "Mesuji", "Pesawaran", "Pesisir Barat", "Pringsewu", "Tanggamus", "Tulang Bawang", "Tulang Bawang Barat", "Way Kanan"],
    kota: ["Bandar Lampung", "Metro"],
  },
  {
    name: "Kepulauan Bangka Belitung",
    kab: ["Bangka", "Bangka Barat", "Bangka Selatan", "Bangka Tengah", "Belitung", "Belitung Timur"],
    kota: ["Pangkalpinang"],
  },
  {
    name: "Kepulauan Riau",
    kab: ["Bintan", "Karimun", "Kepulauan Anambas", "Lingga", "Natuna"],
    kota: ["Batam", "Tanjungpinang"],
  },
  {
    name: "DKI Jakarta",
    kab: ["Kepulauan Seribu"],
    kota: ["Jakarta Barat", "Jakarta Pusat", "Jakarta Selatan", "Jakarta Timur", "Jakarta Utara"],
  },
  {
    name: "Jawa Barat",
    kab: ["Bandung", "Bandung Barat", "Bekasi", "Bogor", "Ciamis", "Cianjur", "Cirebon", "Garut", "Indramayu", "Karawang", "Kuningan", "Majalengka", "Pangandaran", "Purwakarta", "Subang", "Sukabumi", "Sumedang", "Tasikmalaya"],
    kota: ["Bandung", "Banjar", "Bekasi", "Bogor", "Cimahi", "Cirebon", "Depok", "Sukabumi", "Tasikmalaya"],
  },
  {
    name: "Jawa Tengah",
    kab: ["Banjarnegara", "Banyumas", "Batang", "Blora", "Boyolali", "Brebes", "Cilacap", "Demak", "Grobogan", "Jepara", "Karanganyar", "Kebumen", "Kendal", "Klaten", "Kudus", "Magelang", "Pati", "Pekalongan", "Pemalang", "Purbalingga", "Purworejo", "Rembang", "Semarang", "Sragen", "Sukoharjo", "Tegal", "Temanggung", "Wonogiri", "Wonosobo"],
    kota: ["Magelang", "Pekalongan", "Salatiga", "Semarang", "Surakarta", "Tegal"],
  },
  {
    name: "DI Yogyakarta",
    kab: ["Bantul", "Gunungkidul", "Kulon Progo", "Sleman"],
    kota: ["Yogyakarta"],
  },
  {
    name: "Jawa Timur",
    kab: ["Bangkalan", "Banyuwangi", "Blitar", "Bojonegoro", "Bondowoso", "Gresik", "Jember", "Jombang", "Kediri", "Lamongan", "Lumajang", "Madiun", "Magetan", "Malang", "Mojokerto", "Nganjuk", "Ngawi", "Pacitan", "Pamekasan", "Pasuruan", "Ponorogo", "Probolinggo", "Sampang", "Sidoarjo", "Situbondo", "Sumenep", "Trenggalek", "Tuban", "Tulungagung"],
    kota: ["Batu", "Blitar", "Kediri", "Madiun", "Malang", "Mojokerto", "Pasuruan", "Probolinggo", "Surabaya"],
  },
  {
    name: "Banten",
    kab: ["Lebak", "Pandeglang", "Serang", "Tangerang"],
    kota: ["Cilegon", "Serang", "Tangerang", "Tangerang Selatan"],
  },
  {
    name: "Bali",
    kab: ["Badung", "Bangli", "Buleleng", "Gianyar", "Jembrana", "Karangasem", "Klungkung", "Tabanan"],
    kota: ["Denpasar"],
  },
  {
    name: "Nusa Tenggara Barat",
    kab: ["Bima", "Dompu", "Lombok Barat", "Lombok Tengah", "Lombok Timur", "Lombok Utara", "Sumbawa", "Sumbawa Barat"],
    kota: ["Bima", "Mataram"],
  },
  {
    name: "Nusa Tenggara Timur",
    kab: ["Alor", "Belu", "Ende", "Flores Timur", "Kupang", "Lembata", "Malaka", "Manggarai", "Manggarai Barat", "Manggarai Timur", "Nagekeo", "Ngada", "Rote Ndao", "Sabu Raijua", "Sikka", "Sumba Barat", "Sumba Barat Daya", "Sumba Tengah", "Sumba Timur", "Timor Tengah Selatan", "Timor Tengah Utara"],
    kota: ["Kupang"],
  },
  {
    name: "Kalimantan Barat",
    kab: ["Bengkayang", "Kapuas Hulu", "Kayong Utara", "Ketapang", "Kubu Raya", "Landak", "Melawi", "Mempawah", "Sambas", "Sanggau", "Sekadau", "Sintang"],
    kota: ["Pontianak", "Singkawang"],
  },
  {
    name: "Kalimantan Tengah",
    kab: ["Barito Selatan", "Barito Timur", "Barito Utara", "Gunung Mas", "Kapuas", "Katingan", "Kotawaringin Barat", "Kotawaringin Timur", "Lamandau", "Murung Raya", "Pulang Pisau", "Seruyan", "Sukamara"],
    kota: ["Palangka Raya"],
  },
  {
    name: "Kalimantan Selatan",
    kab: ["Balangan", "Banjar", "Barito Kuala", "Hulu Sungai Selatan", "Hulu Sungai Tengah", "Hulu Sungai Utara", "Kotabaru", "Tabalong", "Tanah Bumbu", "Tanah Laut", "Tapin"],
    kota: ["Banjarbaru", "Banjarmasin"],
  },
  {
    name: "Kalimantan Timur",
    kab: ["Berau", "Kutai Barat", "Kutai Kartanegara", "Kutai Timur", "Mahakam Ulu", "Paser", "Penajam Paser Utara"],
    kota: ["Balikpapan", "Bontang", "Samarinda"],
  },
  {
    name: "Kalimantan Utara",
    kab: ["Bulungan", "Malinau", "Nunukan", "Tana Tidung"],
    kota: ["Tarakan"],
  },
  {
    name: "Sulawesi Utara",
    kab: ["Bolaang Mongondow", "Bolaang Mongondow Selatan", "Bolaang Mongondow Timur", "Bolaang Mongondow Utara", "Kepulauan Sangihe", "Kepulauan Siau Tagulandang Biaro (Sitaro)", "Kepulauan Talaud", "Minahasa", "Minahasa Selatan", "Minahasa Tenggara", "Minahasa Utara"],
    kota: ["Bitung", "Kotamobagu", "Manado", "Tomohon"],
  },
  {
    name: "Sulawesi Tengah",
    kab: ["Banggai", "Banggai Kepulauan", "Banggai Laut", "Buol", "Donggala", "Morowali", "Morowali Utara", "Parigi Moutong", "Poso", "Sigi", "Tojo Una-Una", "Tolitoli"],
    kota: ["Palu"],
  },
  {
    name: "Sulawesi Selatan",
    kab: ["Bantaeng", "Barru", "Bone", "Bulukumba", "Enrekang", "Gowa", "Jeneponto", "Kepulauan Selayar", "Luwu", "Luwu Timur", "Luwu Utara", "Maros", "Pangkajene dan Kepulauan", "Pinrang", "Sidenreng Rappang", "Sinjai", "Soppeng", "Takalar", "Tana Toraja", "Toraja Utara", "Wajo"],
    kota: ["Makassar", "Palopo", "Parepare"],
  },
  {
    name: "Sulawesi Tenggara",
    kab: ["Bombana", "Buton", "Buton Selatan", "Buton Tengah", "Buton Utara", "Kolaka", "Kolaka Timur", "Kolaka Utara", "Konawe", "Konawe Kepulauan", "Konawe Selatan", "Konawe Utara", "Muna", "Muna Barat", "Wakatobi"],
    kota: ["Baubau", "Kendari"],
  },
  {
    name: "Gorontalo",
    kab: ["Boalemo", "Bone Bolango", "Gorontalo", "Gorontalo Utara", "Pohuwato"],
    kota: ["Gorontalo"],
  },
  {
    name: "Sulawesi Barat",
    kab: ["Majene", "Mamasa", "Mamuju", "Mamuju Tengah", "Pasangkayu (Mamuju Utara)", "Polewali Mandar"],
    kota: [],
  },
  {
    name: "Maluku",
    kab: ["Buru", "Buru Selatan", "Kepulauan Aru", "Kepulauan Tanimbar (Maluku Tenggara Barat)", "Maluku Barat Daya", "Maluku Tengah", "Maluku Tenggara", "Seram Bagian Barat", "Seram Bagian Timur"],
    kota: ["Ambon", "Tual"],
  },
  {
    name: "Maluku Utara",
    kab: ["Halmahera Barat", "Halmahera Selatan", "Halmahera Tengah", "Halmahera Timur", "Halmahera Utara", "Kepulauan Sula", "Pulau Morotai", "Pulau Taliabu"],
    kota: ["Ternate", "Tidore Kepulauan"],
  },
  {
    name: "Papua",
    kab: ["Biak Numfor", "Jayapura", "Keerom", "Kepulauan Yapen", "Mamberamo Raya", "Sarmi", "Supiori", "Waropen"],
    kota: ["Jayapura"],
  },
  {
    name: "Papua Barat",
    kab: ["Fakfak", "Kaimana", "Manokwari", "Manokwari Selatan", "Pegunungan Arfak", "Teluk Bintuni", "Teluk Wondama"],
    kota: [],
  },
  {
    name: "Papua Selatan",
    kab: ["Asmat", "Boven Digoel", "Mappi", "Merauke"],
    kota: [],
  },
  {
    name: "Papua Tengah",
    kab: ["Deiyai", "Dogiyai", "Intan Jaya", "Mimika", "Nabire", "Paniai", "Puncak", "Puncak Jaya"],
    kota: [],
  },
  {
    name: "Papua Pegunungan",
    kab: ["Jayawijaya", "Lanny Jaya", "Mamberamo Tengah", "Nduga", "Pegunungan Bintang", "Tolikara", "Yahukimo", "Yalimo"],
    kota: [],
  },
  {
    name: "Papua Barat Daya",
    kab: ["Maybrat", "Raja Ampat", "Sorong", "Sorong Selatan", "Tambrauw"],
    kota: ["Sorong"],
  },
];

export type Province = { name: string; cities: string[] };

const collator = new Intl.Collator("id", { sensitivity: "base" });

/** Provinsi (urut abjad) beserta daftar "Kabupaten X" / "Kota X" (urut abjad per nama, Kabupaten sebelum Kota). */
export const PROVINCES: Province[] = RAW.map((p) => {
  const items = [
    ...p.kab.map((n) => ({ n, label: `Kabupaten ${n}`, rank: 0 })),
    ...p.kota.map((n) => ({ n, label: `Kota ${n}`, rank: 1 })),
  ].sort((a, b) => collator.compare(a.n, b.n) || a.rank - b.rank);
  return { name: p.name, cities: items.map((i) => i.label) };
}).sort((a, b) => collator.compare(a.name, b.name));

const PROVINCE_MAP = new Map(PROVINCES.map((p) => [p.name, new Set(p.cities)]));

/** Nilai yang disimpan di database: "Kota Malang, Jawa Timur". */
export function formatDomicile(city: string, province: string): string {
  return `${city}, ${province}`;
}

/** Pecah nilai tersimpan jadi { province, city } kalau cocok persis dengan data resmi; selain itu null. */
export function parseDomicile(value: string | null | undefined): { province: string; city: string } | null {
  if (!value) return null;
  const i = value.lastIndexOf(", ");
  if (i < 0) return null;
  const city = value.slice(0, i);
  const province = value.slice(i + 2);
  return PROVINCE_MAP.get(province)?.has(city) ? { province, city } : null;
}

export function isValidDomicile(value: string | null | undefined): boolean {
  return parseDomicile(value) !== null;
}

/**
 * Domisili lama yang diketik bebas (mis. "Malang") dicocokkan ke satu
 * kabupaten/kota kalau hasilnya TIDAK ambigu. "Malang" cocok dengan Kota dan
 * Kabupaten Malang, jadi dikembalikan null (pengguna diminta memilih ulang).
 */
export function matchLegacyDomicile(value: string | null | undefined): { province: string; city: string } | null {
  const v = (value ?? "").trim().toLowerCase();
  if (!v) return null;
  const hits: { province: string; city: string }[] = [];
  for (const p of PROVINCES) {
    for (const city of p.cities) {
      const base = city.replace(/^(Kabupaten|Kota) /, "").toLowerCase();
      if (city.toLowerCase() === v || base === v) hits.push({ province: p.name, city });
    }
  }
  return hits.length === 1 ? hits[0] : null;
}
