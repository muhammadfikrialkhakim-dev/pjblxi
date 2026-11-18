import Link from "next/link";
import { redirect } from "next/navigation";
import { Wallet, Undo2, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Order, formatIDR } from "@/lib/types";
import { METHOD_LABEL, PAYMENT_STATUS, fmtDate } from "@/lib/profile-utils";

const TABS = [
  { value: "all", label: "Semua" },
  { value: "paid", label: "Berhasil" },
  { value: "pending", label: "Menunggu" },
  { value: "refunded", label: "Refund" },
  { value: "failed", label: "Gagal / Kedaluwarsa" },
] as const;

export default async function PaymentsPage({ searchParams }: { searchParams?: { status?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/profile/payments");

  const { data } = await supabase
    .from("orders")
    .select("*, tiket(*, wisata(*))")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as Order[];
  const sum = (list: Order[]) => list.reduce((acc, o) => acc + Number(o.total_price), 0);

  const paid = orders.filter((o) => o.payment_status === "paid");
  const refunded = orders.filter((o) => o.payment_status === "refunded");
  const pending = orders.filter((o) => o.payment_status === "pending" && o.order_status === "awaiting_payment");

  const active = TABS.some((t) => t.value === searchParams?.status) ? (searchParams!.status as string) : "all";
  const shown = orders.filter((o) => {
    if (active === "all") return true;
    if (active === "failed") return o.payment_status === "failed" || o.payment_status === "expired";
    return o.payment_status === active;
  });

  const stats = [
    { label: "Total Dibayar", value: formatIDR(sum(paid)), sub: `${paid.length} transaksi`, icon: Wallet, tone: "text-forest-700 bg-forest-50" },
    { label: "Total Refund", value: formatIDR(sum(refunded)), sub: `${refunded.length} transaksi`, icon: Undo2, tone: "text-blue-700 bg-blue-50" },
    { label: "Menunggu Pembayaran", value: formatIDR(sum(pending)), sub: `${pending.length} pesanan`, icon: Clock, tone: "text-clay-700 bg-clay-50" },
  ];

  return (
    <>
      <h1 className="font-display text-3xl font-semibold text-forest-900">Pembayaran & Refund</h1>
      <p className="mt-1 text-sm text-ink/60">Rekap pembayaran tiket dan pengembalian dana Anda.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, sub, icon: Icon, tone }) => (
          <div key={label} className="card p-4">
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
              <Icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-xs text-ink/60">{label}</p>
            <p className="font-display text-lg font-semibold text-forest-900">{value}</p>
            <p className="text-xs text-ink/50">{sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={t.value === "all" ? "/profile/payments" : `/profile/payments?status=${t.value}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active === t.value ? "bg-forest-800 text-white" : "bg-forest-50 text-forest-700 hover:bg-forest-100"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="card mt-4 divide-y divide-forest-100 overflow-hidden">
        {shown.map((o) => {
          const st = PAYMENT_STATUS[o.payment_status];
          return (
            <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-forest-50/50">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-forest-900">{o.tiket?.wisata?.name}</p>
                <p className="truncate text-xs text-ink/60">
                  {o.order_code} · {o.payment_method ? METHOD_LABEL[o.payment_method] : "Belum memilih metode"} · {fmtDate(o.created_at)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`font-medium ${o.payment_status === "refunded" ? "text-blue-700" : "text-forest-900"}`}>
                  {o.payment_status === "refunded" ? "+ " : ""}
                  {formatIDR(o.total_price)}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span>
              </div>
            </Link>
          );
        })}
        {shown.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-ink/60">Tidak ada transaksi pada kategori ini.</p>
        )}
      </div>
      <p className="mt-4 text-xs text-ink/50">
        Refund diproses sesuai ketentuan metode pembayaran Anda; dana biasanya kembali dalam beberapa hari kerja.
      </p>
    </>
  );
}
