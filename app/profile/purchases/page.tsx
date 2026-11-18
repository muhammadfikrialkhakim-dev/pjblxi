import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { CreditCard, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Order, formatIDR } from "@/lib/types";

const statusStyles: Record<Order["order_status"], string> = {
  awaiting_payment: "bg-clay-100 text-clay-700",
  confirmed: "bg-forest-100 text-forest-800",
  completed: "bg-forest-100 text-forest-800",
  cancelled: "bg-red-100 text-red-700",
};

const FILTER_TABS: { value: Order["order_status"] | "all"; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "awaiting_payment", label: "Menunggu Pembayaran" },
  { value: "confirmed", label: "Terkonfirmasi" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

export default async function PurchaseListPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/profile/purchases");

  // Jaring pengaman: kalau akun staf (admin/super admin) entah bagaimana
  // mendarat di halaman ini (mis. sesi lama sebelum role diubah, atau
  // link redirectTo basi), tetap arahkan ke dashboard admin.
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role === "admin" || profile?.role === "admin_wisata" || profile?.role === "super_admin") redirect("/admin");

  const validStatuses = FILTER_TABS.map((f) => f.value).filter((v) => v !== "all");
  const activeStatus =
    searchParams?.status && (validStatuses as string[]).includes(searchParams.status)
      ? (searchParams.status as Order["order_status"])
      : "all";

  let query = supabase
    .from("orders")
    .select("*, tiket(*, wisata(*))")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (activeStatus !== "all") {
    query = query.eq("order_status", activeStatus);
  }

  const { data: orders } = await query;

  return (
    <>
      <h1 className="font-display text-3xl font-semibold text-forest-900">Daftar Pembelian</h1>
      <p className="mt-1 text-sm text-ink/60">Semua pesanan tiket Anda beserta statusnya.</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => {
          const isActive = tab.value === activeStatus;
          const href = tab.value === "all" ? "/profile/purchases" : `/profile/purchases?status=${tab.value}`;
          return (
            <Link
              key={tab.value}
              href={href}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-forest-800 text-white"
                  : "bg-forest-50 text-forest-700 hover:bg-forest-100"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 space-y-4">
        {(orders as Order[] | null)?.map((o) => {
          const needsPayment = o.order_status === "awaiting_payment" && o.payment_status !== "paid";
          return (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className={`group card flex items-center gap-4 p-4 hover:shadow-md ${
                needsPayment ? "border-2 border-clay-300 bg-clay-50/70 hover:border-clay-400" : ""
              }`}
            >
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded">
                {o.tiket?.wisata?.cover_image_url && (
                  <Image src={o.tiket.wisata.cover_image_url} alt={o.tiket.wisata.name} fill className="object-cover" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-forest-900">{o.tiket?.wisata?.name}</p>
                <p className="text-xs text-ink/60">{o.tiket?.name} · {o.order_code} · {o.visit_date}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusStyles[o.order_status]}`}>
                    {needsPayment && (
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay-500 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-clay-600" />
                      </span>
                    )}
                    {o.order_status.replace("_", " ")}
                  </span>
                  {needsPayment && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-clay-500 px-3 py-1 text-xs font-semibold text-white shadow-sm transition-colors group-hover:bg-clay-600">
                      <CreditCard className="h-3.5 w-3.5" />
                      Lanjutkan Pembayaran
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  )}
                </div>
              </div>
              <span className="w-28 text-right font-medium text-forest-900">{formatIDR(o.total_price)}</span>
            </Link>
          );
        })}
        {!orders?.length && (
          <p className="text-sm text-ink/60">
            {activeStatus === "all"
              ? "Belum ada transaksi."
              : "Tidak ada transaksi dengan status ini."}
          </p>
        )}
      </div>
    </>
  );
}
