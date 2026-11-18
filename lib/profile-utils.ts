import type { Order } from "@/lib/types";

/** Tanggal "YYYY-MM-DD" hari ini di zona waktu Malang (WIB). */
export function todayWIB(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

/** Tampilkan tanggal "YYYY-MM-DD" atau ISO sebagai "14 Oktober 2026". */
export function fmtDate(value: string): string {
  const d = new Date(value.length <= 10 ? `${value}T00:00:00Z` : value);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
}

export const METHOD_LABEL: Record<NonNullable<Order["payment_method"]>, string> = {
  bank_transfer: "Transfer Bank",
  e_wallet: "E-Wallet",
  credit_card: "Kartu Kredit",
  qris: "QRIS",
};

export const PAYMENT_STATUS: Record<Order["payment_status"], { label: string; cls: string }> = {
  pending: { label: "Menunggu", cls: "bg-clay-100 text-clay-700" },
  paid: { label: "Berhasil", cls: "bg-forest-100 text-forest-800" },
  failed: { label: "Gagal", cls: "bg-red-100 text-red-700" },
  expired: { label: "Kedaluwarsa", cls: "bg-gray-100 text-gray-600" },
  refunded: { label: "Direfund", cls: "bg-blue-100 text-blue-700" },
};
