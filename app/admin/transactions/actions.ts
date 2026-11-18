"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * "Verifikasi pembayaran" — dipakai admin untuk menandai transaksi
 * lunas secara manual (mis. pembayaran transfer bank yang buktinya
 * dicek manual, di luar alur otomatis webhook Midtrans).
 */
export async function verifyPayment(orderId: string) {
  const supabase = createClient();

  const { data: order } = await supabase.from("orders").select("total_price, payment_method").eq("id", orderId).single();
  if (!order) throw new Error("Transaksi tidak ditemukan");

  await supabase
    .from("orders")
    .update({ payment_status: "paid", order_status: "completed" })
    .eq("id", orderId);

  await supabase.from("payments").insert({
    order_id: orderId,
    provider: order.payment_method ?? "manual",
    amount: order.total_price,
    status: "success",
    paid_at: new Date().toISOString(),
  });

  revalidatePath("/admin/transactions");
  revalidatePath(`/orders/${orderId}`);
}

/** "Ubah status transaksi" — admin mengubah status pesanan secara manual. */
export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = createClient();
  await supabase.from("orders").update({ order_status: status }).eq("id", orderId);

  // Pesanan yang dibatalkan sebelum lunas melepaskan voucher yang dipakainya.
  if (status === "cancelled") {
    const { data: o } = await supabase.from("orders").select("payment_status").eq("id", orderId).maybeSingle();
    if (o && o.payment_status !== "paid") {
      await supabase.from("user_promos").update({ used_at: null, order_id: null }).eq("order_id", orderId);
    }
  }
  revalidatePath("/admin/transactions");
  revalidatePath(`/orders/${orderId}`);
}
