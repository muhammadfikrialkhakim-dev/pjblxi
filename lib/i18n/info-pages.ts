import type { Locale } from "./dictionary";

export type InfoSection = { heading: string; paragraphs?: string[]; bullets?: string[] };
export type InfoPageContent = { title: string; intro: string; sections: InfoSection[] };
export type InfoPageKey = "help" | "terms" | "privacy";

/**
 * Isi halaman info publik yang ditautkan dari footer (Dukungan & Jelajahi).
 * Isinya disusun dari cara kerja aplikasi saat ini (login wajib untuk pesan,
 * pembayaran via Midtrans, email via Resend). Teks Syarat & Privasi adalah
 * draf umum — tolong ditinjau (idealnya oleh pihak hukum) sebelum rilis.
 */
export const infoPages: Record<Locale, Record<InfoPageKey, InfoPageContent>> = {
  id: {
    help: {
      title: "Pusat Bantuan",
      intro: "Jawaban singkat untuk pertanyaan yang paling sering muncul seputar pemesanan tiket.",
      sections: [
        {
          heading: "Cara memesan tiket",
          bullets: [
            "Masuk atau daftar akun terlebih dahulu — pemesanan hanya bisa dilakukan setelah login.",
            "Pilih wisata di halaman Destinasi, lalu pilih jenis tiket, tanggal kunjungan, dan jumlahnya.",
            "Lanjut ke pembayaran dan selesaikan sebelum batas waktu yang ditampilkan.",
            "Setelah pembayaran berhasil, e-tiket tersedia di halaman Pesanan Saya.",
          ],
        },
        {
          heading: "Pembayaran",
          paragraphs: [
            "Pembayaran diproses lewat Midtrans. Metode yang tersedia dapat berupa transfer bank, e-wallet, kartu kredit, dan QRIS, tergantung pengaturan situs saat ini.",
            "Jika batas waktu pembayaran terlewat, pesanan tidak dibatalkan melainkan disimpan sebagai draf dan dapat dilanjutkan dari halaman Pesanan Saya selama kuota masih tersedia.",
          ],
        },
        {
          heading: "Status pesanan",
          bullets: [
            "Menunggu pembayaran: pesanan dibuat tetapi belum dibayar.",
            "Terkonfirmasi: pembayaran diterima, e-tiket siap dipakai.",
            "Draf: pembayaran tidak diselesaikan sampai batas waktu; pesanan tersimpan dan dapat dilanjutkan. Dibatalkan: pembayaran ditolak, dibatalkan, atau direfund.",
          ],
        },
        {
          heading: "Notifikasi email",
          paragraphs: [
            "Kami mengirim email saat pembayaran berhasil, gagal, kedaluwarsa, atau direfund. Jika email tidak masuk, periksa folder spam.",
          ],
        },
        {
          heading: "Wishlist dan ulasan",
          bullets: [
            "Tekan ikon hati pada kartu wisata untuk menyimpannya ke Wishlist.",
            "Ulasan bertanda terverifikasi berasal dari pengunjung yang pernah memesan tiket wisata tersebut.",
          ],
        },
      ],
    },
    terms: {
      title: "Syarat & Ketentuan",
      intro: "Dengan menggunakan situs ini, Anda menyetujui ketentuan berikut.",
      sections: [
        {
          heading: "1. Akun",
          paragraphs: [
            "Anda bertanggung jawab atas keakuratan data akun dan kerahasiaan kata sandi. Pemesanan memerlukan akun yang sudah login.",
          ],
        },
        {
          heading: "2. Pemesanan dan pembayaran",
          paragraphs: [
            "Pesanan dianggap sah setelah pembayaran diterima melalui penyedia pembayaran. Pesanan yang tidak dibayar sampai batas waktu disimpan sebagai draf dan dapat dilanjutkan selama kuota tersedia.",
            "Harga, ketersediaan, dan informasi tiket ditentukan oleh pengelola masing-masing wisata dan dapat berubah sewaktu-waktu.",
          ],
        },
        {
          heading: "3. Pembatalan dan refund",
          paragraphs: [
            "Ketentuan pembatalan dan refund mengikuti kebijakan pengelola wisata terkait dan metode pembayaran yang digunakan. Dana yang direfund dikembalikan sesuai ketentuan metode pembayaran tersebut.",
          ],
        },
        {
          heading: "4. Penggunaan e-tiket",
          paragraphs: [
            "E-tiket bersifat pribadi dan hanya berlaku sesuai tanggal dan jenis tiket yang dipesan. Jangan membagikannya ke pihak yang tidak berwenang.",
          ],
        },
        {
          heading: "5. Ulasan dan konten pengguna",
          paragraphs: [
            "Ulasan, balasan, dan reaksi harus sopan, jujur, dan tidak melanggar hukum. Kami berhak menghapus konten yang melanggar ketentuan ini.",
          ],
        },
        {
          heading: "6. Perubahan ketentuan",
          paragraphs: ["Ketentuan ini dapat diperbarui sewaktu-waktu. Penggunaan situs setelah pembaruan berarti Anda menyetujuinya."],
        },
      ],
    },
    privacy: {
      title: "Kebijakan Privasi",
      intro: "Penjelasan singkat tentang data apa yang kami kumpulkan dan untuk apa.",
      sections: [
        {
          heading: "Data yang kami kumpulkan",
          bullets: [
            "Data akun: nama, alamat email, dan data profil yang Anda isi.",
            "Data pesanan: wisata, tiket, tanggal kunjungan, jumlah, dan status pembayaran.",
            "Aktivitas di situs: wishlist, ulasan, balasan, dan reaksi ulasan.",
          ],
        },
        {
          heading: "Untuk apa data digunakan",
          bullets: [
            "Memproses pesanan dan menerbitkan e-tiket.",
            "Mengirim notifikasi email terkait status pesanan.",
            "Menampilkan wishlist dan ulasan Anda, serta menjaga keamanan layanan.",
          ],
        },
        {
          heading: "Pihak ketiga",
          paragraphs: [
            "Pembayaran diproses oleh Midtrans; data kartu atau rekening Anda ditangani oleh penyedia tersebut, bukan disimpan di situs ini. Data akun dan pesanan disimpan di Supabase, dan email dikirim lewat Resend.",
          ],
        },
        {
          heading: "Akses admin",
          paragraphs: [
            "Admin wisata hanya melihat pesanan untuk wisata yang dikelolanya. Super admin memiliki akses ke data seluruh platform untuk keperluan pengelolaan.",
          ],
        },
        {
          heading: "Hak Anda",
          paragraphs: [
            "Anda dapat memperbarui data di halaman Profil. Untuk pertanyaan atau permintaan terkait data pribadi, hubungi kami lewat kontak di footer.",
          ],
        },
      ],
    },
  },
  en: {
    help: {
      title: "Help Center",
      intro: "Quick answers to the most common questions about booking tickets.",
      sections: [
        {
          heading: "How to book tickets",
          bullets: [
            "Log in or sign up first — booking is only available after logging in.",
            "Pick an attraction on the Destinations page, then choose the ticket type, visit date, and quantity.",
            "Continue to payment and complete it before the displayed deadline.",
            "Once paid, your e-ticket is available on the My Orders page.",
          ],
        },
        {
          heading: "Payment",
          paragraphs: [
            "Payments are processed through Midtrans. Available methods may include bank transfer, e-wallet, credit card, and QRIS, depending on the current site settings.",
            "If the payment deadline passes, the order is not cancelled but saved as a draft, and you can resume it from My Orders while tickets remain available.",
          ],
        },
        {
          heading: "Order status",
          bullets: [
            "Awaiting payment: the order was created but not yet paid.",
            "Confirmed: payment received, e-ticket ready to use.",
            "Draft: payment was not completed by the deadline; the order is saved and can be resumed. Cancelled: payment was declined, cancelled, or refunded.",
          ],
        },
        {
          heading: "Email notifications",
          paragraphs: [
            "We send an email when a payment succeeds, fails, expires, or is refunded. If it doesn't arrive, check your spam folder.",
          ],
        },
        {
          heading: "Wishlist and reviews",
          bullets: [
            "Tap the heart icon on an attraction card to save it to your Wishlist.",
            "Verified reviews come from visitors who have booked tickets for that attraction.",
          ],
        },
      ],
    },
    terms: {
      title: "Terms & Conditions",
      intro: "By using this site, you agree to the following terms.",
      sections: [
        {
          heading: "1. Accounts",
          paragraphs: [
            "You are responsible for the accuracy of your account data and the confidentiality of your password. Booking requires a logged-in account.",
          ],
        },
        {
          heading: "2. Booking and payment",
          paragraphs: [
            "An order is valid once payment is received through the payment provider. Orders not paid by the deadline are saved as drafts and can be resumed while tickets remain available.",
            "Prices, availability, and ticket information are set by each attraction's operator and may change at any time.",
          ],
        },
        {
          heading: "3. Cancellation and refunds",
          paragraphs: [
            "Cancellation and refund terms follow the policy of the relevant attraction and the payment method used. Refunded amounts are returned according to that payment method's rules.",
          ],
        },
        {
          heading: "4. Using e-tickets",
          paragraphs: [
            "E-tickets are personal and valid only for the booked date and ticket type. Do not share them with unauthorized parties.",
          ],
        },
        {
          heading: "5. Reviews and user content",
          paragraphs: [
            "Reviews, replies, and reactions must be respectful, honest, and lawful. We may remove content that violates these terms.",
          ],
        },
        {
          heading: "6. Changes to these terms",
          paragraphs: ["These terms may be updated at any time. Continued use of the site after an update means you accept it."],
        },
      ],
    },
    privacy: {
      title: "Privacy Policy",
      intro: "A short explanation of what data we collect and why.",
      sections: [
        {
          heading: "Data we collect",
          bullets: [
            "Account data: name, email address, and profile details you provide.",
            "Order data: attraction, tickets, visit date, quantity, and payment status.",
            "Activity on the site: wishlist, reviews, replies, and review reactions.",
          ],
        },
        {
          heading: "How data is used",
          bullets: [
            "Processing orders and issuing e-tickets.",
            "Sending email notifications about order status.",
            "Showing your wishlist and reviews, and keeping the service secure.",
          ],
        },
        {
          heading: "Third parties",
          paragraphs: [
            "Payments are processed by Midtrans; your card or account details are handled by that provider and not stored on this site. Account and order data are stored in Supabase, and email is sent through Resend.",
          ],
        },
        {
          heading: "Admin access",
          paragraphs: [
            "Attraction admins only see orders for the attraction they manage. Super admins can access platform-wide data for management purposes.",
          ],
        },
        {
          heading: "Your rights",
          paragraphs: [
            "You can update your details on the Profile page. For questions or requests about your personal data, contact us using the details in the footer.",
          ],
        },
      ],
    },
  },
};
