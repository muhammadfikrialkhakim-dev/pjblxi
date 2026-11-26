"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, CreditCard, LifeBuoy, Mail, MessageCircle, QrCode, RotateCcw, Send, Sparkles, Ticket } from "lucide-react";

type Locale = "id" | "en";
type BotLink = { label: string; href: string };
type BotReply = { text: string; links?: BotLink[]; handoff?: boolean };
type Message = {
  id: number;
  from: "bot" | "user";
  text: string;
  time?: string;
  links?: BotLink[];
  handoff?: boolean;
  topics?: boolean;
};

type Intent = { keywords: string[]; reply: Record<Locale, BotReply> };

const INTENTS: Intent[] = [
  {
    keywords: ["pesan", "memesan", "booking", "beli", "order tiket", "book", "buy", "cara"],
    reply: {
      id: {
        text:
          "Cara memesan tiket:\n1. Masuk atau daftar akun dulu (pemesanan butuh login).\n2. Pilih wisata di halaman Destinasi, lalu pilih jenis tiket, tanggal kunjungan, dan jumlahnya.\n3. Lanjut ke pembayaran dan selesaikan sebelum batas waktu.\n4. E-tiket muncul di halaman Pesanan Saya setelah pembayaran berhasil.",
        links: [{ label: "Lihat Destinasi", href: "/destinations" }],
      },
      en: {
        text:
          "How to book tickets:\n1. Log in or sign up first (booking requires an account).\n2. Pick an attraction on the Destinations page, then choose the ticket type, visit date, and quantity.\n3. Continue to payment and finish before the deadline.\n4. Your e-ticket appears in My Orders once payment succeeds.",
        links: [{ label: "Browse Destinations", href: "/destinations" }],
      },
    },
  },
  {
    keywords: ["bayar", "pembayaran", "payment", "pay", "midtrans", "transfer", "qris", "ewallet", "e-wallet", "kartu", "card", "gopay", "ovo", "dana"],
    reply: {
      id: {
        text:
          "Pembayaran diproses lewat Midtrans. Metode yang tersedia bisa berupa transfer bank, e-wallet, kartu kredit, dan QRIS (sesuai yang diaktifkan saat ini). Kalau batas waktu pembayaran terlewat, pesanan tidak dibatalkan tetapi disimpan sebagai draf; Anda bisa melanjutkan pembayarannya dari halaman Pesanan Saya selama kuota tanggal kunjungan masih tersedia.",
      },
      en: {
        text:
          "Payments are processed through Midtrans. Available methods may include bank transfer, e-wallet, credit card, and QRIS (depending on what is currently enabled). If the payment deadline passes, the order is not cancelled but saved as a draft; you can resume payment from My Orders as long as tickets for your visit date are still available.",
      },
    },
  },
  {
    keywords: ["e-tiket", "etiket", "eticket", "e-ticket", "tiket saya", "my ticket", "qr", "tunjukkan", "bukti", "ticket"],
    reply: {
      id: {
        text:
          "E-tiket Anda tersedia di halaman Pesanan Saya setelah pembayaran berhasil, dan kami juga mengirim email konfirmasi. Tunjukkan e-tiket saat tiba di lokasi. Tiket hanya berlaku pada tanggal dan jenis tiket yang dipesan.",
        links: [{ label: "Buka Pesanan Saya", href: "/account" }],
      },
      en: {
        text:
          "Your e-ticket is available in My Orders once payment succeeds, and we also send a confirmation email. Show the e-ticket when you arrive. Tickets are valid only for the booked date and ticket type.",
        links: [{ label: "Open My Orders", href: "/account" }],
      },
    },
  },
  {
    keywords: ["status", "menunggu", "pending", "lunas", "paid", "pesanan", "order", "dibatalkan", "expired", "kedaluwarsa"],
    reply: {
      id: {
        text:
          "Arti status pesanan:\n• Menunggu pembayaran: pesanan dibuat tapi belum dibayar.\n• Draf: pembayaran tidak diselesaikan sampai batas waktu; pesanan tersimpan dan bisa dilanjutkan.\n• Selesai: pembayaran diterima, e-tiket siap dipakai.\n• Dibatalkan: pembayaran ditolak, dibatalkan, atau direfund.\nKami mengirim email setiap status pembayaran berubah; cek folder spam kalau belum masuk.",
        links: [{ label: "Pesanan Saya", href: "/account" }],
      },
      en: {
        text:
          "Order statuses:\n• Awaiting payment: the order was created but not paid yet.\n• Draft: payment was not completed by the deadline; the order is saved and can be resumed.\n• Completed: payment received, e-ticket ready.\n• Cancelled: payment was declined, cancelled, or refunded.\nWe email you whenever a payment status changes; check your spam folder if nothing arrives.",
        links: [{ label: "My Orders", href: "/account" }],
      },
    },
  },
  {
    keywords: ["refund", "batal", "pembatalan", "cancel", "kembali dana", "uang kembali", "pengembalian", "reschedule", "jadwal ulang"],
    reply: {
      id: {
        text:
          "Ketentuan pembatalan dan refund mengikuti kebijakan pengelola wisata terkait serta metode pembayaran yang Anda pakai. Dana yang direfund dikembalikan sesuai aturan metode pembayaran tersebut. Untuk kasus khusus, hubungi tim kami dengan menyertakan kode pesanan.",
        handoff: true,
        links: [{ label: "Syarat & Ketentuan", href: "/syarat-ketentuan" }],
      },
      en: {
        text:
          "Cancellation and refund terms follow the policy of the relevant attraction and the payment method you used. Refunded amounts are returned according to that payment method's rules. For special cases, contact our team and include your order code.",
        handoff: true,
        links: [{ label: "Terms & Conditions", href: "/syarat-ketentuan" }],
      },
    },
  },
  {
    keywords: ["akun", "account", "login", "masuk", "daftar", "register", "google", "sandi", "password", "lupa", "profil", "profile"],
    reply: {
      id: {
        text:
          "Anda bisa daftar dengan email atau masuk dengan akun yang sudah ada. Nama, nomor telepon, dan kata sandi bisa diubah di halaman Profil. Kalau lupa kata sandi dan tidak bisa masuk, hubungi tim kami supaya dibantu.",
        handoff: true,
        links: [
          { label: "Masuk", href: "/login" },
          { label: "Daftar", href: "/register" },
          { label: "Profil", href: "/profile" },
        ],
      },
      en: {
        text:
          "You can sign up with email or log in with an existing account. Your name, phone number, and password can be changed on the Profile page. If you forgot your password and can't log in, contact our team for help.",
        handoff: true,
        links: [
          { label: "Log in", href: "/login" },
          { label: "Sign up", href: "/register" },
          { label: "Profile", href: "/profile" },
        ],
      },
    },
  },
  {
    keywords: ["wishlist", "simpan", "favorit", "favorite", "save", "ulasan", "review", "rating", "bintang"],
    reply: {
      id: {
        text:
          "Tekan ikon hati pada kartu wisata untuk menyimpannya ke Wishlist. Ulasan bertanda \"Pembelian terverifikasi\" berasal dari pengunjung yang pernah memesan tiket wisata tersebut, dan Anda bisa memberi jempol atau membalas ulasan.",
        links: [{ label: "Buka Wishlist", href: "/wishlist" }],
      },
      en: {
        text:
          "Tap the heart icon on an attraction card to save it to your Wishlist. Reviews marked \"Verified purchase\" come from visitors who booked tickets for that attraction, and you can like or reply to reviews.",
        links: [{ label: "Open Wishlist", href: "/wishlist" }],
      },
    },
  },
  {
    keywords: ["rekomendasi", "recommend", "wisata", "destinasi", "destination", "kategori", "category", "murah", "cheap", "trending", "populer", "popular", "tempat"],
    reply: {
      id: {
        text:
          "Anda bisa menjelajah berdasarkan kategori, lalu menyaring lewat harga tiket dan rating. Wisata yang sedang ramai ditandai TRENDING, dan Anda bisa mengurutkan hasil berdasarkan rating tertinggi.",
        links: [
          { label: "Semua Destinasi", href: "/destinations" },
          { label: "Kategori", href: "/categories" },
        ],
      },
      en: {
        text:
          "You can browse by category, then filter by ticket price and rating. Popular spots carry a TRENDING label, and you can sort results by top rated.",
        links: [
          { label: "All Destinations", href: "/destinations" },
          { label: "Categories", href: "/categories" },
        ],
      },
    },
  },
  {
    keywords: ["admin", "cs", "manusia", "orang", "human", "agent", "hubungi", "kontak", "contact", "whatsapp", "wa", "email", "telepon", "bantuan", "help", "komplain", "keluhan"],
    reply: {
      id: { text: "Tentu, tim kami siap membantu langsung. Pilih saluran yang paling nyaman untuk Anda di bawah ini, dan sertakan kode pesanan kalau pertanyaannya soal transaksi.", handoff: true },
      en: { text: "Of course, our team is happy to help directly. Pick the channel that suits you below, and include your order code if it's about a transaction.", handoff: true },
    },
  },
  {
    keywords: ["halo", "hai", "hi", "hello", "hey", "selamat pagi", "selamat siang", "selamat sore", "selamat malam", "assalamualaikum"],
    reply: {
      id: { text: "Halo! 👋 Ada yang bisa saya bantu? Pilih topik di bawah atau ketik pertanyaan Anda." },
      en: { text: "Hello! 👋 How can I help? Pick a topic below or type your question." },
    },
  },
  {
    keywords: ["terima kasih", "makasih", "thanks", "thank you", "thx"],
    reply: {
      id: { text: "Sama-sama! 😊 Kalau masih ada yang ingin ditanyakan, saya di sini." },
      en: { text: "You're welcome! 😊 If you have more questions, I'm right here." },
    },
  },
];

const COPY = {
  id: {
    botName: "Asisten Explore Malang",
    online: "Online · membalas instan",
    placeholder: "Ketik pertanyaan Anda...",
    greeting:
      "Halo! Saya asisten virtual Explore Malang. Saya bisa membantu soal cara memesan, pembayaran, e-tiket, dan pembatalan. Mau tanya apa?",
    fallback:
      "Maaf, saya belum menemukan jawaban yang pas untuk itu. Coba pilih salah satu topik di bawah, atau hubungi tim kami langsung.",
    handoffTitle: "Ingin bicara dengan tim kami?",
    handoffNote: "Jawaban dari tim bisa memakan waktu; sertakan kode pesanan agar lebih cepat.",
    quick: ["Cara memesan", "Metode pembayaran", "E-tiket saya", "Pembatalan & refund", "Hubungi admin"],
    send: "Kirim",
    reset: "Mulai ulang",
    today: "Hari ini",
    asideTopics: "Topik populer",
    asideDirect: "Hubungi langsung",
    asideDirectNote: "Untuk urusan transaksi, sertakan kode pesanan Anda.",
    asideHelpTitle: "Pusat Bantuan",
    asideHelpNote: "Panduan lengkap seputar pemesanan.",
    welcomeTopics: "Pilih topik yang ingin Anda tanyakan:",
    aiBadge: "AI",
    aiNote: "Dijawab oleh AI dan bisa keliru. Untuk urusan transaksi, hubungi tim kami.",
  },
  en: {
    botName: "Explore Malang Assistant",
    online: "Online · replies instantly",
    placeholder: "Type your question...",
    greeting:
      "Hi! I'm the Explore Malang virtual assistant. I can help with booking, payments, e-tickets, and cancellations. What would you like to know?",
    fallback:
      "Sorry, I couldn't find a good answer for that. Try one of the topics below, or contact our team directly.",
    handoffTitle: "Want to talk to our team?",
    handoffNote: "Replies from the team may take a while; include your order code to speed things up.",
    quick: ["How to book", "Payment methods", "My e-ticket", "Cancellation & refund", "Contact admin"],
    send: "Send",
    reset: "Restart",
    today: "Today",
    asideTopics: "Popular topics",
    asideDirect: "Contact directly",
    asideDirectNote: "For transaction issues, include your order code.",
    asideHelpTitle: "Help Center",
    asideHelpNote: "Full guides about booking.",
    welcomeTopics: "Pick a topic you'd like to ask about:",
    aiBadge: "AI",
    aiNote: "Answered by AI and may be wrong. For transaction issues, contact our team.",
  },
} as const;

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

function answer(input: string, locale: Locale): BotReply | null {
  const q = normalize(input);
  let best: { score: number; intent: Intent } | null = null;
  for (const intent of INTENTS) {
    let score = 0;
    for (const k of intent.keywords) {
      // kata pendek (hi, wa, cs, qr) dicocokkan sebagai kata utuh supaya tidak salah tangkap
      const hit = k.length <= 3 ? new RegExp(`(^|\\s)${k}(\\s|$)`).test(q) : q.includes(k);
      if (hit) score += k.length > 5 ? 2 : 1;
    }
    if (score > 0 && (!best || score > best.score)) best = { score, intent };
  }
  return best ? best.intent.reply[locale] : null;
}

const TOPIC_ICONS = [Ticket, CreditCard, QrCode, RotateCcw, LifeBuoy];

const nowTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function ChatBot({
  locale,
  whatsapp,
  email,
}: {
  locale: Locale;
  whatsapp: string | null;
  email: string | null;
}) {
  const c = COPY[locale];
  const greeting = (): Message[] => [
    { id: 0, from: "bot", text: c.greeting },
    { id: 1, from: "bot", text: c.welcomeTopics, topics: true },
  ];
  const [messages, setMessages] = useState<Message[]>(greeting);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(2);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const waUrl = whatsapp ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}` : null;
  const mailUrl = email ? `mailto:${email}` : null;
  const started = messages.some((m) => m.from === "user");

  /** Minta jawaban AI. Mengembalikan null kalau AI tidak tersedia / gagal. */
  async function askAI(history: Message[]): Promise<BotReply | null> {
    try {
      const payload = history
        .filter((m) => !m.topics)
        .map((m) => ({ role: m.from === "user" ? ("user" as const) : ("assistant" as const), content: m.text }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: payload, locale }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { text?: string; links?: BotLink[]; handoff?: boolean };
      if (!data.text) return null;
      return { text: data.text, links: data.links?.length ? data.links : undefined, handoff: data.handoff };
    } catch {
      return null;
    }
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    const userMsg: Message = { id: idRef.current++, from: "user", text: trimmed, time: nowTime() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setTyping(true);

    // Utamakan AI; kalau belum dikonfigurasi / error / lambat, pakai jawaban
    // kata kunci bawaan supaya pengunjung tetap mendapat bantuan.
    const aiReply = await askAI(history);
    const reply = aiReply ?? answer(trimmed, locale);
    if (!aiReply) await new Promise((r) => window.setTimeout(r, 450));

    setTyping(false);
    setMessages((m) => [
      ...m,
      reply
        ? { id: idRef.current++, from: "bot", text: reply.text, time: nowTime(), links: reply.links, handoff: reply.handoff }
        : { id: idRef.current++, from: "bot", text: c.fallback, time: nowTime(), handoff: true },
    ]);
  }

  function reset() {
    setMessages(greeting());
    idRef.current = 2;
    setTyping(false);
    setInput("");
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Jendela chat */}
      <div className="flex h-[620px] max-h-[80vh] flex-col overflow-hidden rounded-2xl bg-white shadow-xl shadow-forest-900/10 ring-1 ring-forest-100">
        <div className="flex items-center gap-3 bg-gradient-to-r from-forest-900 via-forest-800 to-forest-700 px-5 py-4 text-white">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-clay-500 shadow-lg shadow-clay-500/30">
            <Bot className="h-6 w-6" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-400 ring-2 ring-forest-800" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 truncate font-semibold leading-tight">
              {c.botName}
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                <Sparkles className="h-3 w-3" /> {c.aiBadge}
              </span>
            </p>
            <p className="text-xs text-forest-100/80">{c.online}</p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
          >
            <RotateCcw className="h-3.5 w-3.5" /> {c.reset}
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto bg-sand/70 bg-[radial-gradient(#dcebe0_1px,transparent_1px)] px-4 py-5 [background-size:18px_18px] sm:px-6"
        >
          <div className="flex justify-center">
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-ink/45 shadow-sm ring-1 ring-forest-100">
              {c.today}
            </span>
          </div>

          {messages.map((m) => (
            <div key={m.id} className={`flex gap-2.5 ${m.from === "user" ? "justify-end" : ""}`}>
              {m.from === "bot" && (
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-800 text-white">
                  <Bot className="h-4 w-4" />
                </span>
              )}

              <div className={`max-w-[85%] ${m.from === "user" ? "text-right" : ""}`}>
                <div
                  className={`whitespace-pre-line rounded-2xl px-4 py-3 text-left text-[15px] leading-relaxed ${
                    m.from === "user"
                      ? "rounded-br-sm bg-gradient-to-br from-clay-500 to-clay-600 text-white shadow-md shadow-clay-500/20"
                      : "rounded-tl-sm bg-white text-ink/85 shadow-sm ring-1 ring-forest-100"
                  }`}
                >
                  {m.text}
                </div>

                {m.topics && (
                  <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                    {c.quick.slice(0, 4).map((q, i) => {
                      const Icon = TOPIC_ICONS[i] ?? LifeBuoy;
                      return (
                        <button
                          key={q}
                          type="button"
                          onClick={() => send(q)}
                          disabled={typing}
                          className="flex items-center gap-2.5 rounded-xl border border-forest-100 bg-white p-3 text-left text-sm font-semibold text-forest-900 shadow-sm transition-all hover:-translate-y-0.5 hover:border-clay-300 hover:shadow-md disabled:opacity-60"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-clay-50 text-clay-600">
                            <Icon className="h-[18px] w-[18px]" />
                          </span>
                          {q}
                        </button>
                      );
                    })}
                  </div>
                )}

                {m.links && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.links.map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        className="rounded-full border border-clay-300 bg-white px-3.5 py-1.5 text-sm font-semibold text-clay-600 transition-colors hover:bg-clay-50"
                      >
                        {l.label} →
                      </Link>
                    ))}
                  </div>
                )}

                {m.handoff && (
                  <div className="mt-3 rounded-xl border border-forest-100 bg-white p-4 text-left shadow-sm">
                    <p className="text-sm font-semibold text-forest-900">{c.handoffTitle}</p>
                    <p className="mt-0.5 text-xs text-ink/55">{c.handoffNote}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
                        >
                          <MessageCircle className="h-4 w-4" /> WhatsApp
                        </a>
                      )}
                      {mailUrl && (
                        <a
                          href={mailUrl}
                          className="flex items-center gap-2 rounded-lg bg-clay-500 px-4 py-2 text-sm font-semibold text-white hover:bg-clay-600"
                        >
                          <Mail className="h-4 w-4" /> Email
                        </a>
                      )}
                      {!waUrl && !mailUrl && (
                        <Link href="/bantuan" className="rounded-lg bg-clay-500 px-4 py-2 text-sm font-semibold text-white hover:bg-clay-600">
                          {locale === "en" ? "Help Center" : "Pusat Bantuan"}
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                {m.time && <p className="mt-1 px-1 text-[11px] text-ink/35">{m.time}</p>}
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex gap-2.5">
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-800 text-white">
                <Bot className="h-4 w-4" />
              </span>
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white px-4 py-3.5 shadow-sm ring-1 ring-forest-100" aria-label="Mengetik">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="chat-dot h-2 w-2 rounded-full bg-forest-400" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-forest-100 bg-white px-4 pb-4 pt-3 sm:px-6">
          {started && (
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-3">
              {c.quick.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  disabled={typing}
                  className="shrink-0 rounded-full border border-forest-200 bg-white px-3.5 py-1.5 text-sm font-medium text-forest-800 transition-colors hover:bg-forest-50 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={c.placeholder}
              maxLength={300}
              className="min-w-0 flex-1 rounded-full border border-forest-200 bg-sand/60 px-5 py-3 text-sm text-ink outline-none transition-colors focus:border-clay-500 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              aria-label={c.send}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-clay-500 text-white shadow-md shadow-clay-500/25 transition-colors hover:bg-clay-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-2 px-1 text-center text-[11px] text-ink/40">{c.aiNote}</p>
        </div>
      </div>
    </div>
  );
}
