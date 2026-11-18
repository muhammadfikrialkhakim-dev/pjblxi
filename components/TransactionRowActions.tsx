"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Order } from "@/lib/types";
import { verifyPayment, updateOrderStatus } from "@/app/admin/transactions/actions";

const STATUS_OPTIONS: Order["order_status"][] = [
  "awaiting_payment",
  "confirmed",
  "completed",
  "cancelled",
];

const statusLabel: Record<Order["order_status"], string> = {
  awaiting_payment: "Menunggu Bayar",
  confirmed: "Terkonfirmasi",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

/** Warna per status agar mudah dibedakan sekilas. */
const statusColor: Record<Order["order_status"], string> = {
  awaiting_payment: "border-amber-300 bg-amber-50 text-amber-800 focus:ring-amber-200",
  confirmed: "border-sky-300 bg-sky-50 text-sky-800 focus:ring-sky-200",
  completed: "border-emerald-300 bg-emerald-50 text-emerald-800 focus:ring-emerald-200",
  cancelled: "border-red-300 bg-red-50 text-red-700 focus:ring-red-200",
};

export default function TransactionRowActions({ order }: { order: Order }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<Order["order_status"]>(order.order_status);

  return (
    <div className="flex items-center justify-end gap-2">
      {order.payment_status !== "paid" && (
        <button
          disabled={isPending}
          onClick={() => startTransition(() => verifyPayment(order.id))}
          className="flex items-center gap-1 rounded border border-forest-600 px-2.5 py-1 text-xs font-medium text-forest-700 hover:bg-forest-50 disabled:opacity-50"
          title="Verifikasi Pembayaran"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          Verifikasi
        </button>
      )}

      <select
        disabled={isPending}
        value={status}
        onChange={(e) => {
          const next = e.target.value as Order["order_status"];
          setStatus(next);
          startTransition(() => updateOrderStatus(order.id, next));
        }}
        className={`rounded border px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 disabled:opacity-50 ${statusColor[status]}`}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s} className="bg-white text-ink">{statusLabel[s]}</option>
        ))}
      </select>
    </div>
  );
}
