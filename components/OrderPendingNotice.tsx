"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

/**
 * Ditampilkan setelah pengunjung menutup popup Midtrans dengan status
 * "pending/berhasil" tapi konfirmasi dari Midtrans belum masuk. Halaman
 * di-refresh otomatis (OrderStatusPoller); tombol di sini untuk cek manual.
 */
export default function OrderPendingNotice({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-xl border border-clay-200 bg-clay-50 p-5" role="status">
      <div className="flex items-start gap-3">
        <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-clay-600 motion-reduce:animate-none" aria-hidden />
        <div>
          <h2 className="font-semibold text-forest-900">Menunggu konfirmasi pembayaran</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink/70">
            Pembayaran Anda sedang kami cek ke Midtrans. Halaman ini diperbarui otomatis begitu pembayaran
            terkonfirmasi. Untuk transfer bank atau QRIS, selesaikan dulu pembayarannya di aplikasi bank atau
            e-wallet Anda.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => startTransition(() => router.refresh())}
          disabled={isPending}
          className="btn-primary"
        >
          <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} aria-hidden />
          {isPending ? "Mengecek…" : "Cek status sekarang"}
        </button>
        <Link href={`/orders/${orderId}`} className="text-sm font-semibold text-forest-700 hover:underline">
          Ganti metode pembayaran
        </Link>
      </div>
    </div>
  );
}
