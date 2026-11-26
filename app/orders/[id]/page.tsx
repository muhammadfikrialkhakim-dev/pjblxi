import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Ticket,
  User,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { draftStaleOrders, syncPendingOrdersWithMidtrans } from "@/lib/midtrans";
import { formatOrderTime, formatVisitDate } from "@/lib/date";
import { Order, formatIDR } from "@/lib/types";
import BookingSteps from "@/components/BookingSteps";
import OrderStatusPoller from "@/components/OrderStatusPoller";
import OrderPendingNotice from "@/components/OrderPendingNotice";
import PaymentMethodForm from "@/components/PaymentMethodForm";
import ClearBookingDraft from "@/components/ClearBookingDraft";
import PrintButton from "@/components/PrintButton";
import CopyCodeButton from "@/components/CopyCodeButton";

const STATUS_UI: Record<Order["order_status"], { label: string; badge: string; icon: LucideIcon }> = {
  awaiting_payment: { label: "Menunggu Pembayaran", badge: "bg-clay-100 text-clay-700", icon: Clock },
  confirmed: { label: "Terkonfirmasi", badge: "bg-forest-100 text-forest-800", icon: CheckCircle2 },
  completed: { label: "Selesai", badge: "bg-forest-100 text-forest-800", icon: CheckCircle2 },
  cancelled: { label: "Dibatalkan", badge: "bg-red-100 text-red-700", icon: XCircle },
  draft: { label: "Draf", badge: "bg-slate-100 text-slate-700", icon: FileText },
};

const METHOD_LABEL: Record<NonNullable<Order["payment_method"]>, string> = {
  bank_transfer: "Transfer Bank / VA",
  e_wallet: "E-Wallet",
  credit_card: "Kartu Kredit",
  qris: "QRIS",
};

const CANCEL_COPY: Record<string, { title: string; body: string }> = {
  expired: {
    title: "Batas waktu pembayaran habis",
    body: "Pesanan ini dibatalkan karena pembayaran tidak diselesaikan tepat waktu. Silakan buat pesanan baru.",
  },
  failed: {
    title: "Pembayaran tidak berhasil",
    body: "Pembayaran ditolak atau dibatalkan, sehingga pesanan ini tidak dilanjutkan. Silakan buat pesanan baru.",
  },
  refunded: {
    title: "Pembayaran dikembalikan",
    body: "Pembayaran untuk pesanan ini sudah di-refund dan pesanan dibatalkan.",
  },
};

const ORDER_SELECT = "*, tiket(*, wisata(*))";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { justPaid?: string };
}) {
  const supabase = createClient();
  // Pesanan yang menggantung >60 menit tanpa transaksi pembayaran -> draf.
  await draftStaleOrders();
  let { data: order } = await supabase.from("orders").select(ORDER_SELECT).eq("id", params.id).single();

  if (!order) notFound();

  // Jaring pengaman selain webhook: kalau pesanan masih 'pending' dan sudah
  // pernah membuat transaksi di Midtrans, tanya langsung statusnya sekarang.
  // Tanpa ini, status tidak pernah berubah selama aplikasi berjalan di
  // localhost (webhook Midtrans tidak bisa menjangkau komputer lokal).
  // Kepemilikan pesanan sudah dipastikan oleh RLS pada query di atas; client
  // service-role hanya dipakai untuk menulis hasil sinkronisasi.
  if (order.payment_status === "pending" && order.order_status === "awaiting_payment" && order.midtrans_order_id) {
    try {
      await syncPendingOrdersWithMidtrans(createAdminClient(), [order]);
      const { data: fresh } = await supabase.from("orders").select(ORDER_SELECT).eq("id", params.id).single();
      if (fresh) order = fresh;
    } catch {
      // Gagal sinkron (mis. SUPABASE_SERVICE_ROLE_KEY belum diset) — tampilkan data yang ada.
    }
  }

  const o = order as Order;
  const wisata = o.tiket?.wisata;
  const isPaid = o.payment_status === "paid";
  const isCancelled = o.order_status === "cancelled";
  const isAwaiting = o.order_status === "awaiting_payment" && o.payment_status === "pending";
  // Draf: QR/VA sudah pernah keluar tetapi tidak dibayar — pesanan tetap ada dan bisa dilanjutkan.
  const isDraft = o.order_status === "draft" && o.payment_status !== "paid";

  // Begitu pengunjung baru saja menyelesaikan popup Snap (onSuccess/onPending),
  // sembunyikan dulu form pembayaran dan tampilkan pesan menunggu konfirmasi
  // webhook, supaya tidak terlihat seperti diminta bayar dua kali.
  const justPaid = searchParams?.justPaid === "1";
  const showPaymentForm = (isAwaiting || isDraft) && !justPaid;
  const showPendingNotice = isAwaiting && justPaid;

  // Metode pembayaran yang diaktifkan Super Admin lewat menu Pengaturan
  // Situs. Kalau baris pengaturannya belum ada (mis. migration belum
  // dijalankan), enabledMethods dibiarkan undefined supaya PaymentMethodForm
  // fallback menampilkan semua metode seperti sebelumnya.
  let enabledMethods: (keyof typeof METHOD_LABEL)[] | undefined;
  if (showPaymentForm) {
    const { data: settings } = await supabase
      .from("site_settings")
      .select(
        "payment_bank_transfer_enabled, payment_ewallet_enabled, payment_credit_card_enabled, payment_qris_enabled"
      )
      .eq("id", true)
      .maybeSingle();
    if (settings) {
      enabledMethods = [
        ...(settings.payment_bank_transfer_enabled ? (["bank_transfer"] as const) : []),
        ...(settings.payment_ewallet_enabled ? (["e_wallet"] as const) : []),
        ...(settings.payment_credit_card_enabled ? (["credit_card"] as const) : []),
        ...(settings.payment_qris_enabled ? (["qris"] as const) : []),
      ];
    }
  }

  const status = STATUS_UI[o.order_status];
  const StatusIcon = status.icon;
  const cancelCopy = CANCEL_COPY[o.payment_status] ?? {
    title: "Pesanan dibatalkan",
    body: "Pesanan ini sudah dibatalkan. Silakan buat pesanan baru jika Anda masih ingin berkunjung.",
  };
  const rebookHref = wisata?.slug ? `/destinations/${wisata.slug}` : "/destinations";

  // Poll hanya kalau memang ada yang ditunggu: pembayaran baru saja dilakukan
  // atau transaksi Midtrans sudah pernah dibuat untuk pesanan ini.
  const shouldPoll = isAwaiting && (justPaid || !!o.midtrans_order_id);

  return (
    <div>
      <BookingSteps current={isPaid ? 3 : 2} failed={isCancelled} />
      <OrderStatusPoller isPending={shouldPoll} />
      <ClearBookingDraft wisataSlug={wisata?.slug} />

      <div className="container-page py-8">
        <Link
          href="/account"
          className="no-print mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Pesanan Saya
        </Link>

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
          {/* ───────── Kolom kiri: status & aksi ───────── */}
          <section className="space-y-5">
            <header className="overflow-hidden rounded-2xl border border-forest-100 bg-white shadow-sm">
              <div className="h-1.5 bg-gradient-to-r from-forest-600 via-forest-400 to-clay-400" aria-hidden />
              <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-widest text-ink/50">Kode pesanan</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3">
                    <h1 className="break-all font-display text-2xl font-semibold tracking-tight text-forest-900 sm:text-3xl">
                      {o.order_code}
                    </h1>
                    <CopyCodeButton code={o.order_code} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status.badge}`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" aria-hidden /> {status.label}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm text-ink/60">
                      <Calendar className="h-4 w-4 text-ink/40" aria-hidden /> Dipesan {formatOrderTime(o.created_at)}
                    </span>
                  </div>
                </div>
                {isPaid && <PrintButton />}
              </div>
              {showPaymentForm && (
                <div className="flex items-center gap-2.5 border-t border-clay-100 bg-clay-50 px-5 py-3 text-sm text-clay-800 sm:px-6">
                  <Clock className="h-4 w-4 shrink-0" aria-hidden />
                  {isDraft
                    ? "Pesanan ini tersimpan sebagai draf karena pembayaran belum diselesaikan. Lanjutkan pembayaran selama kuota tanggal kunjungan masih tersedia."
                    : "Selesaikan pembayaran agar pesanan Anda segera diproses."}
                </div>
              )}
            </header>

            {showPaymentForm && (
              <PaymentMethodForm orderId={o.id} total={o.total_price} enabledMethods={enabledMethods} resume={isDraft} />
            )}

            {showPendingNotice && <OrderPendingNotice orderId={o.id} />}

            {isCancelled && !isPaid && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-5">
                <div className="flex items-start gap-3">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
                  <div>
                    <h2 className="font-semibold text-red-800">{cancelCopy.title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-red-900/80">{cancelCopy.body}</p>
                  </div>
                </div>
                <Link href={rebookHref} className="btn-primary mt-4">
                  Pesan lagi
                </Link>
              </div>
            )}

            {isPaid && justPaid && (
              <p role="status" className="rounded-lg bg-forest-50 px-4 py-3 text-sm text-forest-800">
                Pembayaran Anda sudah terkonfirmasi otomatis. Terima kasih!
              </p>
            )}

            {isPaid && (
              <article className="overflow-hidden rounded-xl border border-forest-100 bg-white shadow-sm print:shadow-none">
                <div className="flex items-center gap-3 bg-forest-600 px-5 py-4 text-white sm:px-6">
                  <CheckCircle2 className="h-6 w-6 shrink-0" aria-hidden />
                  <div>
                    <h2 className="font-semibold">Pembayaran berhasil</h2>
                    <p className="text-sm text-forest-50/90">E-tiket Anda sudah siap. Tunjukkan saat tiba di lokasi.</p>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <p className="text-sm text-ink/60">E-tiket</p>
                  <h3 className="font-display text-2xl font-semibold text-forest-900">{wisata?.name}</h3>
                  <p className="text-sm text-ink/70">{o.tiket?.name}</p>

                  <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-ink/55">Tanggal kunjungan</dt>
                      <dd className="mt-0.5 font-semibold text-ink">{formatVisitDate(o.visit_date)}</dd>
                    </div>
                    <div>
                      <dt className="text-ink/55">Jumlah tiket</dt>
                      <dd className="mt-0.5 font-semibold text-ink">{o.ticket_quantity}</dd>
                    </div>
                    <div>
                      <dt className="text-ink/55">Atas nama</dt>
                      <dd className="mt-0.5 font-semibold text-ink">{o.customer_name}</dd>
                    </div>
                  </dl>
                </div>

                {/* Garis sobekan tiket */}
                <div className="relative">
                  <div className="mx-6 border-t-2 border-dashed border-forest-200" />
                  <span aria-hidden className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-sand" />
                  <span aria-hidden className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-sand" />
                </div>

                <div className="bg-forest-50/60 px-5 py-5 text-center sm:px-6">
                  <p className="text-sm text-ink/60">Kode tiket</p>
                  <p className="mt-1 text-2xl font-bold tracking-wider text-forest-900">{o.order_code}</p>
                  <p className="mt-2 text-xs text-ink/55">
                    Berlaku hanya pada tanggal dan jenis tiket yang dipesan. Salinan juga dikirim ke {o.customer_email}.
                  </p>
                </div>
              </article>
            )}
          </section>

          {/* ───────── Kolom kanan: ringkasan ───────── */}
          <aside className="space-y-4 lg:sticky lg:top-24 print:hidden">
            <div className="overflow-hidden rounded-xl border border-forest-100 bg-white shadow-sm">
              <div className="relative h-36 w-full bg-forest-50">
                {wisata?.cover_image_url && (
                  <Image
                    src={wisata.cover_image_url}
                    alt={wisata.name}
                    fill
                    sizes="(min-width: 1024px) 380px, 100vw"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="p-5">
                <h2 className="font-display text-lg font-semibold leading-snug text-forest-900">{wisata?.name}</h2>
                {wisata?.location && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-ink/60">
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden /> {wisata.location}
                  </p>
                )}

                <dl className="mt-4 space-y-2.5 border-t border-forest-100 pt-4 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="flex items-center gap-1.5 text-ink/60">
                      <Ticket className="h-4 w-4" aria-hidden /> Paket
                    </dt>
                    <dd className="text-right font-medium text-ink">{o.tiket?.name}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="flex items-center gap-1.5 text-ink/60">
                      <Calendar className="h-4 w-4" aria-hidden /> Kunjungan
                    </dt>
                    <dd className="text-right font-medium text-ink">{formatVisitDate(o.visit_date)}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-ink/60">Jumlah tiket</dt>
                    <dd className="font-medium text-ink">{o.ticket_quantity}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="rounded-xl border border-forest-100 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 font-semibold text-forest-900">
                <User className="h-4 w-4" aria-hidden /> Data pemesan
              </h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink/60">Nama</dt>
                  <dd className="text-right font-medium">{o.customer_name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink/60">Email</dt>
                  <dd className="break-all text-right font-medium">{o.customer_email}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink/60">Telepon</dt>
                  <dd className="text-right font-medium">{o.customer_phone || "-"}</dd>
                </div>
                {o.notes && (
                  <div className="border-t border-forest-100 pt-2">
                    <dt className="text-ink/60">Catatan</dt>
                    <dd className="mt-0.5 whitespace-pre-line font-medium">{o.notes}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="rounded-xl border border-forest-100 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-forest-900">Rincian harga</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4 text-ink/70">
                  <dt>
                    {formatIDR(o.unit_price)} × {o.ticket_quantity}
                  </dt>
                  <dd>{formatIDR(o.unit_price * o.ticket_quantity)}</dd>
                </div>
                {Number(o.discount_amount) > 0 && (
                  <div className="flex justify-between gap-4 font-medium text-forest-700">
                    <dt>Diskon{o.promo_code ? ` (${o.promo_code})` : ""}</dt>
                    <dd>−{formatIDR(Number(o.discount_amount))}</dd>
                  </div>
                )}
                {o.payment_method && (
                  <div className="flex justify-between gap-4 text-ink/70">
                    <dt>Metode</dt>
                    <dd>{METHOD_LABEL[o.payment_method]}</dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between gap-4 border-t border-forest-100 pt-3">
                  <dt className="font-medium text-ink">{isPaid ? "Total dibayar" : "Total"}</dt>
                  <dd className="text-lg font-bold text-clay-600">{formatIDR(o.total_price)}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
