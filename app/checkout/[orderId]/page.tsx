import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Order, formatIDR } from "@/lib/types";
import PaymentMethodForm from "@/components/PaymentMethodForm";
import ClearBookingDraft from "@/components/ClearBookingDraft";

export default async function CheckoutPage({ params }: { params: { orderId: string } }) {
  const supabase = createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, tiket(*, wisata(*))")
    .eq("id", params.orderId)
    .single();

  if (!order) notFound();
  const o = order as Order;

  return (
    <div className="container-page py-10">
      <ClearBookingDraft wisataSlug={o.tiket?.wisata?.slug} />
      <h1 className="font-display text-2xl font-semibold text-forest-900">Pembayaran</h1>
      <p className="mt-1 text-sm text-ink/60">Kode Pesanan: {o.order_code}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PaymentMethodForm orderId={o.id} total={o.total_price} />
        </div>

        <div className="card h-fit p-5">
          <h2 className="font-medium text-forest-900">Ringkasan Pesanan</h2>
          <div className="mt-4 space-y-2 border-t border-forest-100 pt-4 text-sm">
            <div className="flex justify-between text-ink/70">
              <span>Destinasi</span>
              <span className="text-right">{o.tiket?.wisata?.name}</span>
            </div>
            <div className="flex justify-between text-ink/70">
              <span>Paket</span>
              <span className="text-right">{o.tiket?.name}</span>
            </div>
            <div className="flex justify-between text-ink/70">
              <span>Tanggal</span>
              <span>{o.visit_date}</span>
            </div>
            <div className="flex justify-between text-ink/70">
              <span>Jumlah Tiket</span>
              <span>{o.ticket_quantity}</span>
            </div>
          </div>
          <div className="mt-4 flex justify-between border-t border-forest-100 pt-4">
            <span className="font-medium text-ink/80">Total Bayar</span>
            <span className="font-display text-lg font-semibold text-forest-900">{formatIDR(o.total_price)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
