"use client";

import { updateOrderStatus } from "@/app/admin/transactions/actions";

const STATUS_OPTIONS = [
  { value: "awaiting_payment", label: "Menunggu Pembayaran" },
  { value: "confirmed", label: "Dikonfirmasi" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

export default function OrderStatusSelect({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  return (
    <form action={updateOrderStatus} className="flex items-center gap-1.5">
      <input type="hidden" name="orderId" value={orderId} />
      <select
        name="order_status"
        defaultValue={currentStatus}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded border border-forest-200 bg-white px-2 py-1 text-xs"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </form>
  );
}
