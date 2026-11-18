import { formatIDR } from "@/lib/types";

/**
 * Logika promo yang dipakai BERSAMA oleh server (validasi & penentuan harga
 * yang sesungguhnya) dan client (pratinjau diskon di form booking). Murni
 * fungsi — tanpa akses database — jadi aman diimpor di mana saja.
 */

export type Promo = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_discount: number | null;
  min_purchase: number;
  wisata_id: string | null;
  claim_quota: number | null;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  wisata?: { name: string; slug?: string } | null;
};

/** Sisa bayar minimum setelah diskon — mencegah pesanan Rp0 yang tidak bisa diproses payment gateway. */
export const MIN_PAYABLE = 1000;

export type PromoStatus = "upcoming" | "active" | "expired" | "inactive";

export function promoStatus(p: Pick<Promo, "is_active" | "starts_at" | "ends_at">, now = new Date()): PromoStatus {
  if (!p.is_active) return "inactive";
  if (new Date(p.starts_at) > now) return "upcoming";
  if (p.ends_at && new Date(p.ends_at) <= now) return "expired";
  return "active";
}

/** Besar diskon (rupiah, bilangan bulat) untuk sebuah subtotal. */
export function calcDiscount(
  p: Pick<Promo, "discount_type" | "discount_value" | "max_discount">,
  subtotal: number
): number {
  let d = p.discount_type === "percent" ? (subtotal * Number(p.discount_value)) / 100 : Number(p.discount_value);
  if (p.discount_type === "percent" && p.max_discount) d = Math.min(d, Number(p.max_discount));
  d = Math.floor(d);
  const ceiling = Math.max(0, subtotal - MIN_PAYABLE);
  return Math.max(0, Math.min(d, ceiling));
}

export type Eligibility = { ok: true; discount: number } | { ok: false; reason: string };

/** Apakah voucher ini boleh dipakai untuk pesanan di wisata & subtotal tertentu? */
export function checkEligibility(
  p: Promo,
  ctx: { wisataId: string; subtotal: number; now?: Date }
): Eligibility {
  const now = ctx.now ?? new Date();
  const status = promoStatus(p, now);
  if (status === "inactive") return { ok: false, reason: "Promo sudah tidak aktif" };
  if (status === "upcoming") return { ok: false, reason: "Promo belum dimulai" };
  if (status === "expired") return { ok: false, reason: "Promo sudah berakhir" };
  if (p.wisata_id && p.wisata_id !== ctx.wisataId) return { ok: false, reason: "Tidak berlaku untuk wisata ini" };
  if (ctx.subtotal < Number(p.min_purchase)) {
    return { ok: false, reason: `Minimal belanja ${formatIDR(Number(p.min_purchase))}` };
  }
  const discount = calcDiscount(p, ctx.subtotal);
  if (discount <= 0) return { ok: false, reason: "Tidak ada potongan untuk pesanan ini" };
  return { ok: true, discount };
}

/** Ringkasan singkat: "Diskon 20% (maks. Rp50.000)" / "Potongan Rp10.000". */
export function describeDiscount(p: Pick<Promo, "discount_type" | "discount_value" | "max_discount">): string {
  if (p.discount_type === "percent") {
    const base = `Diskon ${Number(p.discount_value)}%`;
    return p.max_discount ? `${base} (maks. ${formatIDR(Number(p.max_discount))})` : base;
  }
  return `Potongan ${formatIDR(Number(p.discount_value))}`;
}

/** Label besar di kartu voucher: "20%" / "Rp10rb". */
export function discountBadge(p: Pick<Promo, "discount_type" | "discount_value">): string {
  if (p.discount_type === "percent") return `${Number(p.discount_value)}%`;
  const v = Number(p.discount_value);
  if (v >= 1_000_000 && v % 100_000 === 0) return `Rp${v / 1_000_000}jt`.replace(".", ",");
  if (v >= 1000 && v % 1000 === 0) return `Rp${v / 1000}rb`;
  return formatIDR(v);
}

// ─── Waktu: admin mengisi waktu dalam WIB (UTC+7) ─────────────────────────
const WIB_MS = 7 * 60 * 60 * 1000;

/** "2026-11-10T08:00" (WIB, dari <input type=datetime-local>) → ISO UTC. Kosong → null. */
export function wibLocalToIso(v: string | null | undefined): string | null {
  if (!v) return null;
  const d = new Date(`${v.length === 16 ? `${v}:00` : v}+07:00`);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/** ISO UTC → "2026-11-10T08:00" (WIB) untuk nilai awal <input type=datetime-local>. */
export function isoToWibLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(new Date(iso).getTime() + WIB_MS).toISOString().slice(0, 16);
}

export function formatPromoDate(iso: string): string {
  return (
    new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })
  );
}

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}
