"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Landmark, Wallet, CreditCard, QrCode, Lock, Check } from "lucide-react";
import { formatIDR } from "@/lib/types";
import { createSnapToken } from "@/app/checkout/actions";

const METHODS = [
  { id: "bank_transfer", label: "Transfer Bank / VA", hint: "BCA, BNI, BRI, Permata, dan bank lain lewat Virtual Account", icon: Landmark },
  { id: "e_wallet", label: "E-Wallet", hint: "GoPay dan ShopeePay", icon: Wallet },
  { id: "credit_card", label: "Kartu Kredit", hint: "Bayar langsung dengan kartu kredit", icon: CreditCard },
  { id: "qris", label: "QRIS", hint: "Scan dari aplikasi e-wallet atau mobile banking", icon: QrCode },
] as const;

type MethodId = (typeof METHODS)[number]["id"];

const SNAP_SRC =
  process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

export default function PaymentMethodForm({
  orderId,
  total,
  enabledMethods,
  resume = false,
}: {
  orderId: string;
  total: number;
  // Metode pembayaran yang diaktifkan Super Admin lewat menu Pengaturan
  // Situs. Kalau tidak diberikan sama sekali (mis. tabel site_settings
  // belum ada / gagal diambil), tampilkan SEMUA metode seperti sebelumnya
  // supaya checkout tidak tiba-tiba kosong.
  enabledMethods?: MethodId[];
  // true = pesanan berstatus draf yang dilanjutkan pembayarannya.
  resume?: boolean;
}) {
  const router = useRouter();
  const availableMethods = enabledMethods ? METHODS.filter((m) => enabledMethods.includes(m.id)) : METHODS;
  const [method, setMethod] = useState<MethodId>(availableMethods[0]?.id ?? "bank_transfer");
  const [isPending, startTransition] = useTransition();
  const [snapReady, setSnapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function handlePay() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        const res = await createSnapToken(orderId, method);
        if ("error" in res) {
          setError(res.error);
          // Kalau ternyata pesanan sudah lunas/berubah, muat ulang agar tampilan ikut berubah.
          router.refresh();
          return;
        }
        const { token } = res;

        if (!window.snap) {
          setError("Modul pembayaran belum siap, coba lagi sebentar.");
          return;
        }

        window.snap.pay(token, {
          onSuccess: () => {
            router.push(`/orders/${orderId}?justPaid=1`);
            router.refresh();
          },
          onPending: () => {
            router.push(`/orders/${orderId}?justPaid=1`);
            router.refresh();
          },
          onError: () => {
            setError("Pembayaran gagal diproses. Silakan coba lagi atau pilih metode lain.");
          },
          onClose: () => {
            // Popup ditutup sebelum pembayaran selesai. Pesanan tidak dibatalkan:
            // jika batas waktu lewat tanpa dibayar, pesanan disimpan sebagai draf.
            setNotice(
              "Pembayaran belum diselesaikan. Pesanan Anda tidak dibatalkan — jika tidak dibayar sampai batas waktu, pesanan disimpan sebagai draf dan bisa dilanjutkan dari halaman Pesanan Saya."
            );
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan, silakan coba lagi.");
      }
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-forest-100 bg-white shadow-sm">
      <Script
        src={SNAP_SRC}
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        onLoad={() => setSnapReady(true)}
        strategy="afterInteractive"
      />

      <div className="p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold text-forest-900">Pilih Metode Pembayaran</h2>

        {availableMethods.length ? (
          <fieldset className="mt-4 space-y-3">
            <legend className="sr-only">Metode pembayaran</legend>
            {availableMethods.map(({ id, label, hint, icon: Icon }) => {
              const selected = method === id;
              return (
                <label
                  key={id}
                  className={`flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-3.5 transition-colors focus-within:ring-2 focus-within:ring-forest-400 ${
                    selected ? "border-forest-500 bg-forest-50" : "border-forest-100 hover:border-forest-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={id}
                    checked={selected}
                    onChange={() => setMethod(id)}
                    className="sr-only"
                  />
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                      selected ? "bg-forest-500 text-white" : "bg-forest-50 text-forest-700"
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-forest-900">{label}</span>
                    <span className="mt-0.5 block text-sm leading-snug text-ink/60">{hint}</span>
                  </span>
                  <span
                    aria-hidden
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      selected ? "border-forest-500 bg-forest-500 text-white" : "border-forest-200"
                    }`}
                  >
                    {selected && <Check className="h-3.5 w-3.5" />}
                  </span>
                </label>
              );
            })}
          </fieldset>
        ) : (
          <p className="mt-4 rounded-lg bg-clay-50 px-4 py-3 text-sm text-clay-700">
            Belum ada metode pembayaran yang diaktifkan. Hubungi admin situs.
          </p>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {notice && !error && (
          <p role="status" className="mt-4 rounded-lg bg-forest-50 px-4 py-3 text-sm text-forest-800">
            {notice}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-forest-100 bg-forest-50/60 px-5 py-4 sm:px-6">
        <span className="text-sm text-ink/70">Total yang harus dibayar</span>
        <span className="text-xl font-bold text-clay-600">{formatIDR(total)}</span>
      </div>

      <div className="p-5 sm:p-6">
        <button
          type="button"
          disabled={isPending || !snapReady || !availableMethods.length}
          onClick={handlePay}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-clay-500 px-6 py-3.5 text-base font-semibold text-white shadow-sm ring-2 ring-clay-200 ring-offset-2 transition hover:bg-clay-600 focus-visible:outline-none focus-visible:ring-clay-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Lock className="h-4 w-4" aria-hidden />
          {isPending ? "Memproses…" : !snapReady ? "Menyiapkan pembayaran…" : resume ? "Lanjutkan Pembayaran" : "Bayar Sekarang"}
        </button>
        <p className="mt-3 text-center text-xs text-ink/50">Pembayaran diproses dengan aman melalui Midtrans.</p>
      </div>
    </div>
  );
}
