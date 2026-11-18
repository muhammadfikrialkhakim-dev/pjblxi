"use client";

import { useEffect, useState, useTransition, type InvalidEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { BadgePercent, Calendar, ChevronDown, Plus, Ticket, UserPlus, X } from "lucide-react";
import { createOrder } from "@/app/booking/actions";
import { claimPromoByCode } from "@/app/promo/actions";
import { formatIDR } from "@/lib/types";
import { checkEligibility, describeDiscount, type Promo } from "@/lib/promo";

const DRAFT_KEY = "booking_draft_v1";

type Draft = {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  notes: string;
};

/** Voucher milik pengunjung yang bisa dipertimbangkan untuk pesanan ini. */
export type VoucherOption = { claimId: string; promo: Promo };

export type BookingSummary = {
  wisataName: string;
  coverUrl: string | null;
  tiketName: string;
  dateLabel: string;
};

/** Kolom isian dengan label yang naik ke atas saat diisi/difokus. */
type FieldProps = {
  id: string;
  label: string;
  name: string;
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  required?: boolean;
  type?: string;
  inputMode?: "tel";
  autoComplete?: string;
};

function FloatingField({
  id,
  label,
  multiline,
  ...props
}: FieldProps & { multiline?: boolean }) {
  const box =
    "peer w-full rounded-lg border border-forest-200 bg-white px-4 text-sm text-ink focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500";
  const floated =
    "peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs";

  return (
    <div className="relative">
      {multiline ? (
        <textarea id={id} placeholder=" " rows={3} className={`${box} resize-none pb-2 pt-7`} {...props} />
      ) : (
        <input id={id} placeholder=" " className={`${box} h-14 pb-1 pt-5`} {...props} />
      )}
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-4 text-sm text-ink/50 transition-all ${
          multiline ? "top-4" : "top-1/2 -translate-y-1/2"
        } ${floated}`}
      >
        {label}
      </label>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-clay-500 px-6 py-3.5 text-base font-semibold text-white shadow-sm ring-2 ring-clay-200 ring-offset-2 transition hover:bg-clay-600 focus-visible:outline-none focus-visible:ring-clay-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Memproses…" : "Lanjut ke Pembayaran"}
    </button>
  );
}

export default function BookingForm({
  tiketId,
  wisataId,
  visitDate,
  quantity,
  unitPrice,
  defaults,
  summary,
  vouchers,
  errorMessage,
}: {
  tiketId: string;
  wisataId: string;
  visitDate: string;
  quantity: number;
  unitPrice: number;
  defaults: { full_name: string; phone: string; email: string };
  summary: BookingSummary;
  vouchers: VoucherOption[];
  errorMessage?: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>({
    customer_name: defaults.full_name,
    customer_phone: defaults.phone,
    customer_email: defaults.email,
    notes: "",
  });
  const [contactOpen, setContactOpen] = useState(true);
  const [notesOpen, setNotesOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(false);

  const subtotal = unitPrice * quantity;

  // Voucher: pratinjau diskon di sini hanya untuk tampilan — server menghitung
  // ulang dari database saat pesanan dibuat (lihat createOrder).
  const evaluated = vouchers.map((v) => ({ ...v, result: checkEligibility(v.promo, { wisataId, subtotal }) }));
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    // Pilih otomatis voucher yang paling menguntungkan; pengunjung bisa melepasnya.
    let best: { id: string; discount: number } | null = null;
    for (const v of evaluated) {
      if (v.result.ok && (!best || v.result.discount > best.discount)) best = { id: v.claimId, discount: v.result.discount };
    }
    return best?.id ?? null;
  });
  const selected = evaluated.find((v) => v.claimId === selectedId && v.result.ok) ?? null;
  const discount = selected && selected.result.ok ? selected.result.discount : 0;
  const total = subtotal - discount;

  const [code, setCode] = useState("");
  const [codeMsg, setCodeMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [claiming, startClaim] = useTransition();

  function claimByCode() {
    setCodeMsg(null);
    startClaim(async () => {
      const res = await claimPromoByCode(code);
      if (res.ok) {
        setCodeMsg({ ok: true, text: `“${res.title}” berhasil diklaim.` });
        setCode("");
        setSelectedId(res.claimId);
        router.refresh(); // muat ulang daftar voucher dari server
      } else if (res.needLogin) {
        router.push("/login?redirectTo=/booking");
      } else {
        setCodeMsg({ ok: false, text: res.error });
      }
    });
  }

  // Begitu komponen tampil, cek dulu apakah ada isian tersimpan dari
  // sebelumnya (mis. sempat diketik lalu user klik tombol Back lalu balik
  // lagi ke sini). Kalau ada, pakai itu — kalau tidak, tetap pakai
  // data profil sebagai default.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Draft>;
        setDraft((prev) => ({ ...prev, ...parsed }));
        if (parsed.notes) setNotesOpen(true);
      }
    } catch {
      // sessionStorage tidak tersedia (mis. mode privat ketat) — abaikan saja.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next));
    } catch {
      // abaikan kalau storage penuh/tidak tersedia.
    }
  }

  // Kolom wajib yang tersembunyi tidak bisa menampilkan pesan validasi
  // browser, jadi buka lagi bagian yang tertutup saat ada yang belum valid.
  function handleInvalid(_e: InvalidEvent<HTMLFormElement>) {
    if (!contactOpen) setContactOpen(true);
  }

  return (
    <form action={createOrder} onInvalidCapture={handleInvalid} className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
      <input type="hidden" name="tiket_id" value={tiketId} />
      <input type="hidden" name="visit_date" value={visitDate} />
      <input type="hidden" name="quantity" value={quantity} />
      {selected && <input type="hidden" name="user_promo_id" value={selected.claimId} />}

      {/* ───────── Kolom kiri: isian pemesan ───────── */}
      <section>
        {errorMessage && (
          <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}
        <h1 className="font-display text-2xl font-semibold text-forest-900">Data Pemesan</h1>

        <div
          className={`mt-4 overflow-hidden rounded-xl border bg-white transition-colors ${
            contactOpen ? "border-forest-400" : "border-forest-100"
          }`}
        >
          <button
            type="button"
            onClick={() => setContactOpen((v) => !v)}
            aria-expanded={contactOpen}
            aria-controls="panel-pemesan"
            className={`flex w-full items-center justify-between px-5 py-4 text-left ${
              contactOpen ? "bg-forest-50" : "bg-white"
            }`}
          >
            <span className="flex items-center gap-3 text-lg font-semibold text-forest-900">
              <UserPlus className="h-5 w-5" aria-hidden />
              Pemesan
            </span>
            <span className="flex items-center gap-1 text-sm font-semibold text-forest-600">
              {contactOpen ? "Tutup" : "Buka"}
              <ChevronDown className={`h-4 w-4 transition-transform ${contactOpen ? "rotate-180" : ""}`} aria-hidden />
            </span>
          </button>

          <div id="panel-pemesan" hidden={!contactOpen}>
            <div className="space-y-5 px-5 pb-6 pt-5">
              <p className="text-[15px] leading-relaxed text-ink/80">
                Isi data sesuai identitas Anda. E-tiket dan konfirmasi pesanan akan dikirim ke email di bawah ini.
              </p>

              <FloatingField
                id="customer_name"
                name="customer_name"
                label="Nama lengkap (sesuai identitas)"
                required
                autoComplete="name"
                value={draft.customer_name}
                onChange={(e) => update("customer_name", e.target.value)}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <FloatingField
                  id="customer_phone"
                  name="customer_phone"
                  label="Nomor telepon (08xxxxxxxxxx)"
                  required
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={draft.customer_phone}
                  onChange={(e) => update("customer_phone", e.target.value)}
                />
                <FloatingField
                  id="customer_email"
                  name="customer_email"
                  label="Email"
                  required
                  type="email"
                  autoComplete="email"
                  value={draft.customer_email}
                  onChange={(e) => update("customer_email", e.target.value)}
                />
              </div>

              {/* Catatan opsional — selalu ada di form (hanya disembunyikan) supaya nilainya tetap terkirim. */}
              <div className="rounded-xl border border-forest-100 bg-forest-50/50">
                <button
                  type="button"
                  onClick={() => setNotesOpen((v) => !v)}
                  aria-expanded={notesOpen}
                  aria-controls="panel-catatan"
                  className="flex w-full items-center justify-between px-4 py-3.5 text-left"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-forest-800">
                    <Plus className="h-4 w-4" aria-hidden />
                    Tambah catatan khusus <span className="font-normal text-ink/50">(opsional)</span>
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-forest-600 transition-transform ${notesOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                <div id="panel-catatan" hidden={!notesOpen}>
                  <div className="px-4 pb-4">
                    <FloatingField
                      id="notes"
                      name="notes"
                      label="Permintaan khusus"
                      multiline
                      value={draft.notes}
                      onChange={(e) => update("notes", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Kolom kanan: ringkasan & harga ───────── */}
      <aside className="space-y-4 lg:sticky lg:top-24">
        <div className="overflow-hidden rounded-xl border border-forest-100 bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-display text-xl font-semibold text-forest-900">Ringkasan Pesanan</h2>
            <button
              type="button"
              onClick={() => setSummaryOpen((v) => !v)}
              aria-expanded={summaryOpen}
              className="text-sm font-semibold text-forest-600 hover:underline"
            >
              {summaryOpen ? "Sembunyikan" : "Detail"}
            </button>
          </div>

          <div hidden={!summaryOpen}>
            <div className="mx-4 mb-4 rounded-lg border border-forest-100 bg-white p-4 shadow-sm">
              <div className="flex gap-3">
                <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md bg-forest-50">
                  {summary.coverUrl && (
                    <Image src={summary.coverUrl} alt={summary.wisataName} fill sizes="80px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold leading-snug text-forest-900">{summary.wisataName}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink/60">
                    <Ticket className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{summary.tiketName}</span>
                  </p>
                </div>
              </div>

              <dl className="mt-4 space-y-2 border-t border-forest-100 pt-4 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="flex items-center gap-1.5 text-ink/60">
                    <Calendar className="h-4 w-4" aria-hidden />
                    Tanggal kunjungan
                  </dt>
                  <dd className="text-right font-medium text-ink">{summary.dateLabel}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-ink/60">Jumlah tiket</dt>
                  <dd className="font-medium text-ink">{quantity}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Voucher */}
        <div className="rounded-xl border border-forest-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-forest-900">
              <BadgePercent className="h-5 w-5 text-clay-500" aria-hidden /> Voucher
            </h2>
            <Link href="/promo" className="text-sm font-semibold text-forest-700 hover:underline">
              Cari promo
            </Link>
          </div>

          {evaluated.length > 0 ? (
            <fieldset className="mt-3 space-y-2">
              <legend className="sr-only">Pilih voucher</legend>
              {evaluated.map((v) => {
                const usable = v.result.ok;
                const on = selected?.claimId === v.claimId;
                return (
                  <label
                    key={v.claimId}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                      usable ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                    } ${on ? "border-forest-500 bg-forest-50" : "border-forest-100 hover:border-forest-300"}`}
                  >
                    <input
                      type="radio"
                      name="voucher_choice"
                      className="mt-1 accent-forest-600"
                      checked={on}
                      disabled={!usable}
                      onChange={() => setSelectedId(v.claimId)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-forest-900">{v.promo.title}</span>
                      <span className="block text-xs text-clay-700">{describeDiscount(v.promo)}</span>
                      <span className="mt-1 block text-xs text-ink/55">
                        {v.result.ok ? (
                          <>Hemat {formatIDR(v.result.discount)} · kode {v.promo.code}</>
                        ) : (
                          v.result.reason
                        )}
                      </span>
                    </span>
                  </label>
                );
              })}
              {selected && (
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-ink/55 hover:text-red-600"
                >
                  <X className="h-3.5 w-3.5" aria-hidden /> Lepas voucher
                </button>
              )}
            </fieldset>
          ) : (
            <p className="mt-3 text-sm text-ink/60">
              Anda belum punya voucher untuk pesanan ini. Klaim promo atau masukkan kode di bawah.
            </p>
          )}

          <div className="mt-4 border-t border-forest-100 pt-4">
            <label htmlFor="booking-promo-code" className="mb-1.5 block text-sm font-medium text-forest-900">
              Punya kode promo?
            </label>
            <div className="flex gap-2">
              <input
                id="booking-promo-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  // Enter di sini tidak boleh mengirim form pemesanan.
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (code.trim() && !claiming) claimByCode();
                  }
                }}
                placeholder="Masukkan kode"
                className="input-field flex-1"
                maxLength={40}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={claimByCode}
                disabled={claiming || !code.trim()}
                className="btn-secondary disabled:opacity-60"
              >
                {claiming ? "…" : "Klaim"}
              </button>
            </div>
            {codeMsg && (
              <p role="status" className={`mt-2 text-xs ${codeMsg.ok ? "text-forest-700" : "text-red-600"}`}>
                {codeMsg.text}
              </p>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-forest-100 bg-white shadow-sm">
          <h2 className="px-5 pt-4 font-display text-xl font-semibold text-forest-900">Rincian Harga</h2>

          <div className="mt-3 border-t border-forest-100 px-5 py-4">
            <button
              type="button"
              onClick={() => setPriceOpen((v) => !v)}
              aria-expanded={priceOpen}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <span className="text-base font-medium text-ink">Harga yang Anda bayar</span>
              <span className="flex items-center gap-1.5 text-lg font-bold text-clay-600">
                {formatIDR(total)}
                <ChevronDown
                  className={`h-4 w-4 text-ink/60 transition-transform ${priceOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </span>
            </button>

            <div hidden={!priceOpen}>
              <div className="mt-3 space-y-1.5 border-t border-dashed border-forest-100 pt-3 text-sm text-ink/70">
                <div className="flex justify-between gap-4">
                  <span>
                    {summary.tiketName} ({formatIDR(unitPrice)} × {quantity})
                  </span>
                  <span className="shrink-0">{formatIDR(subtotal)}</span>
                </div>
                {selected && discount > 0 && (
                  <div className="flex justify-between gap-4 font-medium text-forest-700">
                    <span>Diskon ({selected.promo.code})</span>
                    <span className="shrink-0">−{formatIDR(discount)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="bg-forest-50 px-5 py-3 text-sm text-forest-800">
            E-tiket tersedia di halaman Pesanan Saya setelah pembayaran berhasil.
          </p>

          <div className="p-4">
            <SubmitButton />
          </div>
        </div>
      </aside>
    </form>
  );
}
