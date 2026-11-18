import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Ticket, CreditCard, CalendarDays, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Order, formatIDR } from "@/lib/types";
import { fmtDate, todayWIB } from "@/lib/profile-utils";

function OrderRow({ o, highlight }: { o: Order; highlight?: boolean }) {
  return (
    <Link
      href={`/orders/${o.id}`}
      className={`group card flex items-center gap-4 p-4 hover:shadow-md ${highlight ? "border-2 border-clay-300 bg-clay-50/70" : ""}`}
    >
      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded bg-forest-50">
        {o.tiket?.wisata?.cover_image_url && (
          <Image src={o.tiket.wisata.cover_image_url} alt={o.tiket.wisata.name} fill className="object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-forest-900">{o.tiket?.wisata?.name}</p>
        <p className="truncate text-xs text-ink/60">
          {o.tiket?.name} · {o.ticket_quantity} tiket · {o.order_code}
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs text-forest-700">
          <CalendarDays className="h-3.5 w-3.5" /> {fmtDate(o.visit_date)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5 text-right">
        <span className="font-medium text-forest-900">{formatIDR(o.total_price)}</span>
        {highlight ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-clay-500 px-3 py-1 text-xs font-semibold text-white group-hover:bg-clay-600">
            <CreditCard className="h-3.5 w-3.5" /> Bayar Sekarang
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-clay-600">
            Lihat e-tiket <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </div>
    </Link>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  if (count === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 font-display text-lg font-semibold text-forest-900">
        {title} <span className="text-sm font-normal text-ink/50">({count})</span>
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export default async function MyBookingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/profile/bookings");

  const { data } = await supabase
    .from("orders")
    .select("*, tiket(*, wisata(*))")
    .eq("customer_id", user.id)
    .neq("order_status", "cancelled")
    .order("visit_date", { ascending: true });

  const orders = (data ?? []) as Order[];
  const today = todayWIB();

  const awaiting = orders.filter((o) => o.order_status === "awaiting_payment" && o.payment_status !== "paid");
  const upcoming = orders.filter((o) => o.order_status === "confirmed" && o.visit_date >= today);
  const past = orders
    .filter((o) => o.order_status === "completed" || (o.order_status === "confirmed" && o.visit_date < today))
    .sort((a, b) => b.visit_date.localeCompare(a.visit_date));

  const empty = awaiting.length + upcoming.length + past.length === 0;

  return (
    <>
      <h1 className="font-display text-3xl font-semibold text-forest-900">Pesanan Saya</h1>
      <p className="mt-1 text-sm text-ink/60">Tiket yang sedang aktif dan riwayat kunjungan Anda.</p>

      <Section title="Menunggu Pembayaran" count={awaiting.length}>
        {awaiting.map((o) => <OrderRow key={o.id} o={o} highlight />)}
      </Section>
      <Section title="Akan Datang" count={upcoming.length}>
        {upcoming.map((o) => <OrderRow key={o.id} o={o} />)}
      </Section>
      <Section title="Riwayat Kunjungan" count={past.length}>
        {past.map((o) => <OrderRow key={o.id} o={o} />)}
      </Section>

      {empty && (
        <div className="card mt-8 flex flex-col items-center gap-3 px-6 py-14 text-center">
          <Ticket className="h-10 w-10 text-forest-300" />
          <p className="font-medium text-forest-900">Belum ada pesanan</p>
          <p className="text-sm text-ink/60">Pesan tiket wisata favorit Anda dan e-tiketnya akan muncul di sini.</p>
          <Link href="/destinations" className="btn-primary mt-2">Jelajahi Destinasi</Link>
        </div>
      )}
      <p className="mt-8 text-xs text-ink/50">
        Pesanan yang dibatalkan ada di <Link href="/profile/purchases?status=cancelled" className="underline">Daftar Pembelian</Link>.
      </p>
    </>
  );
}
