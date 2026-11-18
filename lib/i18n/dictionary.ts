export type Locale = "id" | "en";

export const LOCALE_COOKIE = "locale";
export const DEFAULT_LOCALE: Locale = "id";

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "id", label: "Indonesia", flag: "🇮🇩" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

/**
 * Kamus terjemahan untuk teks UI statis (bukan konten dari database, seperti
 * nama wisata/kategori — itu tetap mengikuti data yang diinput admin).
 * Tambahkan key baru di sini kalau ada teks baru yang perlu diterjemahkan.
 */
export const dictionary = {
  id: {
    nav: {
      home: "Home",
      destinations: "Destinasi",
      promos: "Promo",
      categories: "Kategori",
      myOrders: "Pesanan Saya",
      wishlist: "Wishlist",
      profile: "Profil",
      adminPanel: "Panel Admin",
      login: "Masuk",
      register: "Daftar",
      logout: "Keluar",
      logoutConfirmTitle: "Keluar dari akun?",
      logoutConfirmText: "Anda akan keluar dari akun ini. Anda bisa masuk kembali kapan saja.",
      logoutConfirmYes: "Ya, keluar",
      logoutCancel: "Batal",
    },
    footer: {
      tagline:
        "Platform pemesanan tiket wisata terpadu untuk wilayah Malang Raya — dibangun untuk agen travel dan wisatawan.",
      exploreTitle: "Jelajahi",
      exploreDestinations: "Destinasi",
      exploreCategories: "Kategori",
      supportTitle: "Dukungan",
      supportHelp: "Pusat Bantuan",
      supportTerms: "Syarat & Ketentuan",
      supportPrivacy: "Kebijakan Privasi",
      rights: "Seluruh hak cipta dilindungi.",
      aboutTitle: "Tentang Kami",
      howToBook: "Cara Memesan",
      contactUs: "Hubungi Kami",
      categoriesTitle: "Kategori Wisata",
      othersTitle: "Lainnya",
      myWishlist: "Wishlist Saya",
      myOrders: "Pesanan Saya",
      paymentTitle: "Metode Pembayaran",
      payBank: "Transfer Bank",
      payEwallet: "E-Wallet",
      payCard: "Kartu Kredit",
      payQris: "QRIS",
      badgeSecure: "Pembayaran aman",
      badgeInstant: "E-tiket instan",
      madeFor: "Dibuat untuk wisata Malang Raya 🌿",
    },
    home: {
      heroTitle: "Jelajahi Pesona Malang Raya",
      heroSubtitle:
        "Pesan tiket wisata alam, budaya, dan petualangan di Malang — mudah, cepat, dan terpercaya untuk wisatawan maupun agen travel.",
      searchPlaceholder: "Cari wisata, mis. Gunung Bromo...",
      searchButton: "Cari",
      searchTab: "Tiket Wisata",
      searchDestinationLabel: "Nama wisata atau destinasi",
      searchCategoryLabel: "Kategori",
      allCategories: "Semua kategori",
      tabTrending: "Trending",
      tabTopRated: "Rating Tertinggi",
      priceLabel: "Harga tiket",
      anyPrice: "Semua harga",
      priceUpTo: (n: string) => `Maks. ${n}`,
      ratingLabel: "Rating",
      anyRating: "Semua rating",
      ratingAtLeast: (n: string) => `${n}+ bintang`,
      categoriesTitle: "Jelajahi Berdasarkan Kategori",
      trendingTitle: "Destinasi Trending",
      seeAll: "Lihat semua",
      trendingEmpty: "Belum ada wisata. Tambahkan lewat panel Admin → Kelola Wisata.",
      recommendedTitle: "Tempat yang Disarankan",
      recommendedByRating: "Dipilih berdasarkan rating tertinggi dari wisatawan lain.",
      recommendedNew: "Destinasi baru yang layak dipertimbangkan untuk perjalanan Anda.",
    },
    destinations: {
      resultsFor: (q: string) => `Hasil untuk "${q}"`,
      allDestinations: "Semua Destinasi",
      allFilter: "Semua",
      sortTrending: "Diurutkan: Trending",
      sortRating: "Diurutkan: Rating tertinggi",
      found: (n: number) => `${n} wisata ditemukan`,
      empty: "Tidak ada wisata yang cocok.",
      heroText:
        "Dari wisata alam, budaya, kuliner, sampai taman rekreasi — pilih destinasi favorit Anda di Malang Raya dan pesan tiketnya dalam hitungan menit.",
      sortLabel: "Urutkan",
      sortNewest: "Terbaru",
      sortTrendingShort: "Trending",
      sortTopRated: "Rating tertinggi",
    },
    wisataCard: {
      trending: "Trending",
      startingFrom: (price: string) => `Mulai ${price}`,
      fromLabel: "Mulai dari",
      noReviews: "Belum ada ulasan",
      contactUs: "Hubungi kami",
      viewDetail: "Lihat detail →",
    },
  },
  en: {
    nav: {
      home: "Home",
      destinations: "Destinations",
      promos: "Promos",
      categories: "Categories",
      myOrders: "My Orders",
      wishlist: "Wishlist",
      profile: "Profile",
      adminPanel: "Admin Panel",
      login: "Log In",
      register: "Sign Up",
      logout: "Log Out",
      logoutConfirmTitle: "Log out of your account?",
      logoutConfirmText: "You will be signed out of this account. You can log back in anytime.",
      logoutConfirmYes: "Yes, log out",
      logoutCancel: "Cancel",
    },
    footer: {
      tagline:
        "An all-in-one tour ticket booking platform for the Greater Malang area — built for travel agents and tourists alike.",
      exploreTitle: "Explore",
      exploreDestinations: "Destinations",
      exploreCategories: "Categories",
      supportTitle: "Support",
      supportHelp: "Help Center",
      supportTerms: "Terms & Conditions",
      supportPrivacy: "Privacy Policy",
      rights: "All rights reserved.",
      aboutTitle: "About Us",
      howToBook: "How to Book",
      contactUs: "Contact Us",
      categoriesTitle: "Categories",
      othersTitle: "Others",
      myWishlist: "My Wishlist",
      myOrders: "My Orders",
      paymentTitle: "Payment Methods",
      payBank: "Bank Transfer",
      payEwallet: "E-Wallet",
      payCard: "Credit Card",
      payQris: "QRIS",
      badgeSecure: "Secure payment",
      badgeInstant: "Instant e-ticket",
      madeFor: "Made for Greater Malang tourism 🌿",
    },
    home: {
      heroTitle: "Discover the Beauty of Greater Malang",
      heroSubtitle:
        "Book tickets for nature, cultural, and adventure attractions in Malang — easy, fast, and reliable for tourists and travel agents alike.",
      searchPlaceholder: "Search attractions, e.g. Mount Bromo...",
      searchButton: "Search",
      searchTab: "Attraction Tickets",
      searchDestinationLabel: "Attraction or destination name",
      searchCategoryLabel: "Category",
      allCategories: "All categories",
      tabTrending: "Trending",
      tabTopRated: "Top Rated",
      priceLabel: "Ticket price",
      anyPrice: "Any price",
      priceUpTo: (n: string) => `Up to ${n}`,
      ratingLabel: "Rating",
      anyRating: "Any rating",
      ratingAtLeast: (n: string) => `${n}+ stars`,
      categoriesTitle: "Explore by Category",
      trendingTitle: "Trending Destinations",
      seeAll: "See all",
      trendingEmpty: "No attractions yet. Add one via Admin Panel → Manage Attractions.",
      recommendedTitle: "Recommended Places",
      recommendedByRating: "Picked based on the highest ratings from other travelers.",
      recommendedNew: "New destinations worth considering for your next trip.",
    },
    destinations: {
      resultsFor: (q: string) => `Results for "${q}"`,
      allDestinations: "All Destinations",
      allFilter: "All",
      sortTrending: "Sorted by: Trending",
      sortRating: "Sorted by: Top rated",
      found: (n: number) => `${n} attraction${n === 1 ? "" : "s"} found`,
      empty: "No matching attractions found.",
      heroText:
        "From nature and culture to food and theme parks — pick your favorite spots in Greater Malang and book tickets in minutes.",
      sortLabel: "Sort by",
      sortNewest: "Newest",
      sortTrendingShort: "Trending",
      sortTopRated: "Top rated",
    },
    wisataCard: {
      trending: "Trending",
      startingFrom: (price: string) => `From ${price}`,
      fromLabel: "From",
      noReviews: "No reviews yet",
      contactUs: "Contact us",
      viewDetail: "View detail →",
    },
  },
} as const;

export type Dictionary = (typeof dictionary)[Locale];

export function getDictionary(locale: Locale): Dictionary {
  return dictionary[locale] ?? dictionary[DEFAULT_LOCALE];
}

/**
 * Nama kategori (mis. "Alam", "Pantai") tersimpan sebagai data di database
 * (tabel categories, diisi lewat seed/panel Admin), bukan teks statis UI —
 * jadi tidak otomatis ikut kamus `dictionary` di atas. Supaya kategori
 * bawaan tetap berganti bahasa, kita cocokkan lewat slug-nya (slug tidak
 * berubah walau admin mengedit nama tampilannya).
 *
 * Kalau ada kategori baru yang dibuat admin dan slug-nya belum terdaftar
 * di sini, nama aslinya (Bahasa Indonesia) akan tetap dipakai sebagai
 * fallback — jadi tidak ada teks yang hilang.
 */
const categoryNameByLocale: Record<string, { id: string; en: string }> = {
  alam: { id: "Alam", en: "Nature" },
  budaya: { id: "Budaya", en: "Culture" },
  kuliner: { id: "Kuliner", en: "Culinary" },
  petualangan: { id: "Petualangan", en: "Adventure" },
  "taman-rekreasi": { id: "Taman Rekreasi", en: "Recreation Park" },
  pantai: { id: "Pantai", en: "Beach" },
  "air-terjun": { id: "Air Terjun", en: "Waterfall" },
  "gunung-perkemahan": { id: "Gunung & Perkemahan", en: "Mountain & Camping" },
  "edukasi-museum": { id: "Edukasi & Museum", en: "Education & Museum" },
};

export function translateCategoryName(name: string, slug: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return name;
  const entry = categoryNameByLocale[slug];
  return entry?.en ?? name;
}
