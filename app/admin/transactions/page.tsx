import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Order, formatIDR } from "@/lib/types";
import { draftStaleOrders, syncPendingOrdersWithMidtrans } from "@/lib/midtrans";
import TransactionRowActions from "@/components/TransactionRowActions";
import TableSearch from "@/components/TableSearch";
import SortableTh from "@/components/SortableTh";
import Pagination from "@/components/Pagination";
import TableFilter from "@/components/TableFilter";
import { paginate, parseTableParams, type RawParams } from "@/lib/table-query";

const BASE = "/admin/transactions";
const SORT_KEYS = ["date", "code", "customer", "wisata", "status", "total"] as const;
const FILTER_KEYS = ["pending", "paid", "failed", "expired", "refunded"] as const;
const FILTER_LABEL: Record<(typeof FILTER_KEYS)[number], string> = {
  pending: "Menunggu",
  paid: "Lunas",
  failed: "Gagal",
  expired: "Kedaluwarsa",
  refunded: "Refund",
};
const STATUS_BADGE: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-700",
  expired: "bg-slate-100 text-slate-600",
  refunded: "bg-sky-100 text-sky-800",
};

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: RawParams;
}) {
  const params = parseTableParams(searchParams, {
    sortKeys: SORT_KEYS,
    defaultSort: "date",
    defaultDir: "desc",
    filterKeys: FILTER_KEYS,
  });
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  const isWisataAdmin = profile?.role === "admin_wisata";

  // Admin Wisata cuma boleh lihat transaksi dari wisata yang ditugaskan
  // padanya. Sama seperti halaman Kelola Tiket: jangan andalkan RLS saja
  // (kolom SELECT tiket/orders punya policy publik yang ikut ter-OR-kan),
  // paksa filter di query lewat daftar tiket_id milik wisatanya sendiri.
  let ownTiketIds: string[] | null = null;
  if (isWisataAdmin) {
    const { data: ownWisata } = await supabase.from("wisata").select("id").eq("admin_id", user?.id).maybeSingle();
    if (ownWisata) {
      const { data: ownTiket } = await supabase.from("tiket").select("id").eq("wisata_id", ownWisata.id);
      ownTiketIds = (ownTiket ?? []).map((t) => t.id);
    } else {
      ownTiketIds = [];
    }
  }
  const scopeIds = ownTiketIds && ownTiketIds.length ? ownTiketIds : ["00000000-0000-0000-0000-000000000000"];

  // Sebelum menampilkan daftar, tanya langsung ke Midtrans status TERKINI
  // dari setiap transaksi yang masih 'pending' — begitu pengunjung memang
  // sudah bayar, statusnya otomatis ter-update di sini jadi "Paid" tanpa
  // admin perlu klik "Verifikasi" manual (lihat penjelasan lengkap di
  // lib/midtrans.ts, fungsi syncPendingOrdersWithMidtrans).
  let pendingQuery = supabase
    .from("orders")
    .select("id, midtrans_order_id, total_price, payment_method")
    .eq("payment_status", "pending");
  if (isWisataAdmin) pendingQuery = pendingQuery.in("tiket_id", scopeIds);
  const { data: stillPending } = await pendingQuery;
  await syncPendingOrdersWithMidtrans(supabase, stillPending ?? []);
  await draftStaleOrders();

  let query = supabase.from("orders").select("*, tiket(name, wisata(name))");
  if (isWisataAdmin) {
    query = query.in("tiket_id", scopeIds);
  }
  const { data } = await query;
  const all = (data ?? []) as Order[];

  // Cari (kode / pelanggan / wisata / paket) → filter status bayar → urutkan → potong per halaman.
  const needle = params.q.toLowerCase();
  const searched = needle
    ? all.filter((o) =>
        [o.order_code, o.customer_name, o.customer_email, o.tiket?.wisata?.name, o.tiket?.name]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(needle))
      )
    : all;
  const countBy = (st: string) => searched.filter((o) => o.payment_status === st).length;
  const filtered = params.filter ? searched.filter((o) => o.payment_status === params.filter) : [...searched];

  const dirMul = params.dir === "asc" ? 1 : -1;
  const collator = new Intl.Collator("id", { sensitivity: "base" });
  filtered.sort((a, b) => {
    let cmp = 0;
    switch (params.sort) {
      case "code": cmp = collator.compare(a.order_code, b.order_code); break;
      case "customer": cmp = collator.compare(a.customer_name ?? "", b.customer_name ?? ""); break;
      case "wisata": cmp = collator.compare(a.tiket?.wisata?.name ?? "", b.tiket?.wisata?.name ?? ""); break;
      case "status": cmp = collator.compare(a.payment_status, b.payment_status); break;
      case "total": cmp = Number(a.total_price) - Number(b.total_price); break;
      default: cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return (cmp || new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dirMul;
  });
  const { rows, total, pages, page, offset } = paginate(filtered, params);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-forest-900">Kelola Transaksi</h1>
      <p className="mt-1 text-sm text-ink/60">
        Verifikasi pembayaran manual atau ubah status transaksi bila diperlukan.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
        <TableSearch basePath={BASE} params={params} placeholder="Cari kode, pelanggan, atau destinasi…" />
        <TableFilter
          basePath={BASE}
          params={params}
          label="Status Bayar"
          options={[
            { value: "", label: "Semua", count: searched.length },
            ...FILTER_KEYS.map((k) => ({ value: k, label: FILTER_LABEL[k], count: countBy(k) })),
          ]}
        />
      </div>

      <div className="card mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-forest-50 text-ink/60">
              <tr>
                <th className="w-16 px-4 py-3 font-medium">No</th>
                <SortableTh basePath={BASE} params={params} sortKey="code">Kode</SortableTh>
                <SortableTh basePath={BASE} params={params} sortKey="date">Tanggal</SortableTh>
                <SortableTh basePath={BASE} params={params} sortKey="customer">Pelanggan</SortableTh>
                <SortableTh basePath={BASE} params={params} sortKey="wisata">Destinasi</SortableTh>
                <SortableTh basePath={BASE} params={params} sortKey="status">Status Bayar</SortableTh>
                <SortableTh basePath={BASE} params={params} sortKey="total">Total</SortableTh>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o, i) => (
                <tr key={o.id} className="border-t border-forest-50">
                  <td className="px-4 py-3 tabular-nums text-ink/50">{offset + i + 1}</td>
                  <td className="px-4 py-3">
                    <Link href={`/orders/${o.id}`} className="font-medium text-forest-800 hover:underline">
                      {o.order_code}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink/70">
                    {new Date(o.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">{o.customer_name}</td>
                  <td className="px-4 py-3">{o.tiket?.wisata?.name} <span className="text-ink/40">· {o.tiket?.name}</span></td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[o.payment_status] ?? "bg-slate-100 text-slate-600"}`}>
                      {o.payment_status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{formatIDR(o.total_price)}</td>
                  <td className="px-4 py-3">
                    <TransactionRowActions order={o} />
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-ink/50">
                    {params.q || params.filter ? "Tidak ada transaksi yang cocok dengan pencarian/filter ini." : "Belum ada transaksi."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination basePath={BASE} params={params} total={total} pages={pages} page={page} offset={offset} shown={rows.length} />
      </div>
    </div>
  );
}
