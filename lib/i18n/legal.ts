import type { Locale } from "./dictionary";

export type LegalBlock = string | { list: string[] };
export type LegalSection = { title: string; body: LegalBlock[]; contact?: boolean };

type LegalContent = {
  help: {
    title: string;
    intro: (siteName: string) => string;
    faqs: { q: string; a: string }[];
    stillNeedHelp: string;
    includeCode: string;
  };
  terms: {
    title: string;
    intro: (siteName: string) => string;
    updatedAt: string;
    sections: (siteName: string) => LegalSection[];
  };
  privacy: {
    title: string;
    intro: (siteName: string) => string;
    updatedAt: string;
    sections: LegalSection[];
  };
};

const id: LegalContent = {
  help: {
    title: "Pusat Bantuan",
    intro: (n) => `Jawaban untuk pertanyaan yang sering diajukan seputar pemesanan tiket di ${n}.`,
    faqs: [
      {
        q: "Bagaimana cara memesan tiket?",
        a: "Pilih wisata di halaman Destinasi, pilih paket tiket, tentukan tanggal kunjungan dan jumlah tiket, isi data pemesan, lalu pilih metode pembayaran. Anda perlu masuk ke akun terlebih dahulu sebelum memesan.",
      },
      {
        q: "Metode pembayaran apa saja yang tersedia?",
        a: "Pembayaran diproses lewat Midtrans dan dapat berupa transfer bank / virtual account, e-wallet, kartu kredit, atau QRIS. Metode yang tampil di halaman pembayaran bisa berbeda tergantung pengaturan platform.",
      },
      {
        q: "Kapan e-tiket saya terbit?",
        a: "E-tiket tersedia di halaman pesanan setelah pembayaran terkonfirmasi. Biasanya hanya butuh beberapa saat setelah Anda membayar. Halaman pesanan akan memperbarui statusnya secara otomatis.",
      },
      {
        q: "Pembayaran sudah berhasil tetapi status masih menunggu pembayaran. Apa yang harus dilakukan?",
        a: "Tunggu beberapa menit lalu muat ulang halaman pesanan. Jika status belum berubah, hubungi kami dengan menyertakan kode pesanan dan bukti pembayaran.",
      },
      {
        q: "Bagaimana cara melihat riwayat pesanan?",
        a: "Masuk ke akun Anda, lalu buka menu Pesanan Saya untuk melihat semua pesanan beserta statusnya.",
      },
      {
        q: "Bagaimana cara menggunakan e-tiket di lokasi wisata?",
        a: "Tunjukkan e-tiket (kode pesanan) dari halaman pesanan Anda kepada petugas di lokasi. Pastikan tanggal kunjungan sesuai dengan tiket.",
      },
      {
        q: "Apakah tiket bisa dibatalkan atau dijadwal ulang?",
        a: "Kebijakan pembatalan dan perubahan jadwal mengikuti Syarat & Ketentuan serta ketentuan masing-masing pengelola wisata. Hubungi kami sesegera mungkin jika Anda membutuhkan perubahan.",
      },
      {
        q: "Apakah ada batasan usia, tinggi, atau berat badan?",
        a: 'Beberapa wisata memiliki rekomendasi pengunjung. Lihat tombol "Rekomendasi Pengunjung" di halaman detail wisata sebelum memesan.',
      },
      {
        q: "Bagaimana cara memberi ulasan?",
        a: "Masuk ke akun Anda, buka halaman detail wisata, lalu isi penilaian dan komentar pada bagian Penilaian Publik.",
      },
    ],
    stillNeedHelp: "Masih butuh bantuan?",
    includeCode: "Sertakan kode pesanan Anda agar kami dapat membantu lebih cepat.",
  },
  terms: {
    title: "Syarat & Ketentuan",
    intro: (n) =>
      `Dengan menggunakan ${n} dan memesan tiket melalui platform ini, Anda menyetujui syarat dan ketentuan berikut.`,
    updatedAt: "10 Oktober 2026",
    sections: (n) => [
      {
        title: "1. Tentang layanan",
        body: [
          `${n} adalah platform pemesanan tiket wisata di kawasan Malang Raya. Kami menyediakan informasi destinasi dan memfasilitasi pembelian tiket. Layanan wisata itu sendiri diselenggarakan oleh masing-masing pengelola destinasi.`,
        ],
      },
      {
        title: "2. Akun pengguna",
        body: [
          "Anda perlu membuat akun untuk memesan tiket. Anda bertanggung jawab menjaga kerahasiaan kata sandi dan seluruh aktivitas yang terjadi pada akun Anda, serta memberikan data yang benar dan terkini.",
        ],
      },
      {
        title: "3. Pemesanan dan pembayaran",
        body: [
          "Harga, paket, dan ketersediaan kuota tiket ditampilkan pada halaman detail wisata dan dapat berubah sewaktu-waktu. Pesanan dianggap sah setelah pembayaran berhasil dikonfirmasi. Pembayaran diproses oleh penyedia pembayaran pihak ketiga (Midtrans); kami tidak menyimpan data kartu atau kredensial pembayaran Anda.",
          "Pesanan yang tidak dibayar dalam batas waktu yang ditentukan akan kedaluwarsa secara otomatis.",
        ],
      },
      {
        title: "4. E-tiket dan penggunaan",
        body: [
          "E-tiket berlaku untuk tanggal kunjungan dan jumlah pengunjung yang tertera pada pesanan. Tunjukkan e-tiket kepada petugas di lokasi. Tiket tidak boleh diperjualbelikan kembali tanpa izin.",
        ],
      },
      {
        title: "5. Pembatalan, perubahan jadwal, dan pengembalian dana",
        body: [
          "Kebijakan pembatalan, perubahan jadwal, dan pengembalian dana mengikuti ketentuan masing-masing pengelola wisata dan dapat berbeda antar paket tiket. Permohonan diajukan melalui kontak kami dengan menyertakan kode pesanan. Pengembalian dana, jika disetujui, diproses melalui metode pembayaran yang sama.",
        ],
      },
      {
        title: "6. Keselamatan dan rekomendasi pengunjung",
        body: [
          "Beberapa destinasi memiliki rekomendasi usia, tinggi badan, berat badan, atau kondisi kesehatan. Rekomendasi ini disediakan demi keselamatan Anda; pengunjung bertanggung jawab menilai kesesuaian kondisi dirinya dan mengikuti arahan petugas di lokasi.",
        ],
      },
      {
        title: "7. Ulasan pengguna",
        body: [
          "Ulasan yang Anda kirim harus jujur, relevan, dan tidak mengandung unsur SARA, ujaran kebencian, atau konten yang melanggar hukum. Kami berhak menghapus ulasan yang melanggar ketentuan ini.",
        ],
      },
      {
        title: "8. Batasan tanggung jawab",
        body: [
          "Kami berupaya menjaga informasi tetap akurat, namun tidak menjamin bahwa seluruh informasi bebas dari kesalahan. Kami tidak bertanggung jawab atas perubahan jam operasional, cuaca, penutupan sementara destinasi, atau kejadian di luar kendali kami, selain sebagaimana diwajibkan oleh hukum yang berlaku.",
        ],
      },
      {
        title: "9. Perubahan ketentuan",
        body: [
          "Syarat dan ketentuan ini dapat diperbarui sewaktu-waktu. Versi terbaru selalu tersedia di halaman ini, dan penggunaan layanan setelah pembaruan berarti Anda menyetujuinya.",
        ],
      },
      { title: "10. Kontak", body: [], contact: true },
    ],
  },
  privacy: {
    title: "Kebijakan Privasi",
    intro: (n) =>
      `${n} menghargai privasi Anda. Halaman ini menjelaskan data apa yang kami kumpulkan dan bagaimana data tersebut digunakan.`,
    updatedAt: "10 Oktober 2026",
    sections: [
      {
        title: "1. Data yang kami kumpulkan",
        body: [
          {
            list: [
              "Data akun: nama lengkap, alamat email, dan kata sandi (disimpan dalam bentuk terenkripsi oleh penyedia autentikasi).",
              "Data pemesanan: nama pemesan, email, nomor telepon, tanggal kunjungan, jumlah tiket, dan catatan pesanan.",
              "Data pembayaran: status dan metode pembayaran. Data kartu atau akun pembayaran diproses langsung oleh Midtrans dan tidak disimpan oleh kami.",
              "Konten yang Anda kirim, seperti penilaian dan ulasan.",
            ],
          },
        ],
      },
      {
        title: "2. Cara kami menggunakan data",
        body: [
          {
            list: [
              "Memproses pesanan dan menerbitkan e-tiket.",
              "Memverifikasi pembayaran dan mencegah penyalahgunaan.",
              "Menghubungi Anda terkait pesanan, perubahan jadwal, atau permintaan bantuan.",
              "Menampilkan ulasan Anda di halaman destinasi dan meningkatkan layanan.",
            ],
          },
        ],
      },
      {
        title: "3. Berbagi data",
        body: [
          "Kami tidak menjual data pribadi Anda. Data dibagikan hanya kepada pihak yang diperlukan untuk menjalankan layanan, yaitu penyedia pembayaran (Midtrans), penyedia basis data dan autentikasi (Supabase), serta pengelola wisata yang tiketnya Anda pesan (sebatas data pesanan), atau bila diwajibkan oleh hukum.",
        ],
      },
      {
        title: "4. Penyimpanan dan keamanan",
        body: [
          "Data disimpan pada layanan basis data dengan kontrol akses berbasis peran. Kami berupaya menjaga keamanan data, namun tidak ada sistem yang sepenuhnya bebas risiko. Data pesanan disimpan selama diperlukan untuk keperluan layanan, pelaporan, dan kewajiban hukum.",
        ],
      },
      {
        title: "5. Cookie",
        body: [
          "Kami menggunakan cookie yang diperlukan agar Anda tetap masuk ke akun dan agar preferensi seperti bahasa tersimpan. Kami tidak menggunakan cookie iklan.",
        ],
      },
      {
        title: "6. Hak Anda",
        body: [
          "Anda dapat melihat dan memperbarui data profil melalui halaman Profil. Untuk meminta penghapusan akun atau salinan data Anda, hubungi kami melalui kontak di bawah.",
        ],
      },
      {
        title: "7. Perubahan kebijakan",
        body: ["Kebijakan ini dapat diperbarui sewaktu-waktu. Versi terbaru selalu tersedia di halaman ini."],
      },
      { title: "8. Kontak", body: [], contact: true },
    ],
  },
};

const en: LegalContent = {
  help: {
    title: "Help Center",
    intro: (n) => `Answers to frequently asked questions about booking tickets on ${n}.`,
    faqs: [
      {
        q: "How do I book a ticket?",
        a: "Pick a destination on the Destinations page, choose a ticket package, set your visit date and number of tickets, fill in your details, then choose a payment method. You need to log in to your account before booking.",
      },
      {
        q: "Which payment methods are available?",
        a: "Payments are processed through Midtrans and can be bank transfer / virtual account, e-wallet, credit card, or QRIS. The methods shown on the payment page may vary depending on the platform's settings.",
      },
      {
        q: "When will my e-ticket be issued?",
        a: "Your e-ticket is available on the order page once payment is confirmed. This usually takes only a moment after you pay, and the order page updates its status automatically.",
      },
      {
        q: "My payment went through but the status still says awaiting payment. What should I do?",
        a: "Wait a few minutes and reload the order page. If the status hasn't changed, contact us with your order code and proof of payment.",
      },
      {
        q: "How can I see my order history?",
        a: "Log in to your account and open My Orders to see all your orders and their statuses.",
      },
      {
        q: "How do I use my e-ticket at the destination?",
        a: "Show your e-ticket (order code) from your order page to the staff on site. Make sure the visit date matches your ticket.",
      },
      {
        q: "Can I cancel or reschedule my ticket?",
        a: "Cancellation and rescheduling follow our Terms & Conditions and the rules of each destination operator. Please contact us as soon as possible if you need a change.",
      },
      {
        q: "Are there age, height, or weight restrictions?",
        a: 'Some destinations have visitor recommendations. Check the "Visitor Recommendations" button on the destination page before booking.',
      },
      {
        q: "How do I leave a review?",
        a: "Log in to your account, open the destination page, and fill in your rating and comment in the Public Ratings section.",
      },
    ],
    stillNeedHelp: "Still need help?",
    includeCode: "Include your order code so we can help you faster.",
  },
  terms: {
    title: "Terms & Conditions",
    intro: (n) =>
      `By using ${n} and booking tickets through this platform, you agree to the following terms and conditions.`,
    updatedAt: "10 October 2026",
    sections: (n) => [
      {
        title: "1. About the service",
        body: [
          `${n} is a tourist ticket booking platform for the Greater Malang area. We provide destination information and facilitate ticket purchases. The tourism services themselves are provided by each destination's operator.`,
        ],
      },
      {
        title: "2. User accounts",
        body: [
          "You need an account to book tickets. You are responsible for keeping your password confidential and for all activity on your account, and for providing accurate and up-to-date information.",
        ],
      },
      {
        title: "3. Bookings and payments",
        body: [
          "Prices, packages, and ticket availability are shown on each destination page and may change at any time. A booking is valid once payment has been confirmed. Payments are processed by a third-party payment provider (Midtrans); we do not store your card details or payment credentials.",
          "Orders that are not paid within the specified time limit expire automatically.",
        ],
      },
      {
        title: "4. E-tickets and use",
        body: [
          "An e-ticket is valid for the visit date and number of visitors stated on the order. Show your e-ticket to the staff on site. Tickets may not be resold without permission.",
        ],
      },
      {
        title: "5. Cancellations, rescheduling, and refunds",
        body: [
          "Cancellation, rescheduling, and refund policies follow the rules of each destination operator and may differ between ticket packages. Requests are made through our contact details, including your order code. Refunds, if approved, are processed through the original payment method.",
        ],
      },
      {
        title: "6. Safety and visitor recommendations",
        body: [
          "Some destinations have recommendations on age, height, weight, or health conditions. These are provided for your safety; visitors are responsible for judging whether they are suitable and for following staff instructions on site.",
        ],
      },
      {
        title: "7. User reviews",
        body: [
          "Reviews you submit must be honest, relevant, and free of hate speech, discrimination, or unlawful content. We reserve the right to remove reviews that violate these rules.",
        ],
      },
      {
        title: "8. Limitation of liability",
        body: [
          "We strive to keep information accurate but do not guarantee that it is free of errors. We are not responsible for changes in opening hours, weather, temporary closures, or events beyond our control, except as required by applicable law.",
        ],
      },
      {
        title: "9. Changes to these terms",
        body: [
          "These terms may be updated from time to time. The latest version is always available on this page, and continued use of the service after an update means you accept it.",
        ],
      },
      { title: "10. Contact", body: [], contact: true },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro: (n) =>
      `${n} respects your privacy. This page explains what data we collect and how it is used.`,
    updatedAt: "10 October 2026",
    sections: [
      {
        title: "1. Data we collect",
        body: [
          {
            list: [
              "Account data: full name, email address, and password (stored in encrypted form by the authentication provider).",
              "Booking data: booker's name, email, phone number, visit date, number of tickets, and order notes.",
              "Payment data: payment status and method. Card or payment account details are processed directly by Midtrans and are not stored by us.",
              "Content you submit, such as ratings and reviews.",
            ],
          },
        ],
      },
      {
        title: "2. How we use your data",
        body: [
          {
            list: [
              "To process orders and issue e-tickets.",
              "To verify payments and prevent abuse.",
              "To contact you about orders, schedule changes, or support requests.",
              "To display your reviews on destination pages and improve our service.",
            ],
          },
        ],
      },
      {
        title: "3. Sharing your data",
        body: [
          "We do not sell your personal data. Data is shared only with parties needed to run the service: the payment provider (Midtrans), the database and authentication provider (Supabase), and the destination operator whose ticket you book (limited to order data), or where required by law.",
        ],
      },
      {
        title: "4. Storage and security",
        body: [
          "Data is stored on a database service with role-based access control. We work to keep your data secure, but no system is completely risk-free. Order data is kept for as long as needed for service, reporting, and legal obligations.",
        ],
      },
      {
        title: "5. Cookies",
        body: [
          "We use the cookies required to keep you logged in and to remember preferences such as language. We do not use advertising cookies.",
        ],
      },
      {
        title: "6. Your rights",
        body: [
          "You can view and update your profile data on the Profile page. To request deletion of your account or a copy of your data, contact us using the details below.",
        ],
      },
      {
        title: "7. Changes to this policy",
        body: ["This policy may be updated from time to time. The latest version is always available on this page."],
      },
      { title: "8. Contact", body: [], contact: true },
    ],
  },
};

export function getLegalContent(locale: Locale): LegalContent {
  return locale === "en" ? en : id;
}
