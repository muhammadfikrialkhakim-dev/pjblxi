import { BookingDraft } from "./types";

const DRAFT_KEY = "explore_malang_booking_draft";

/**
 * Mengambil draft pemesanan dari localStorage browser (database client-side).
 * Aman dipanggil di lingkungan SSR maupun browser.
 */
export function getLocalDraft(): Partial<BookingDraft> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error("Gagal membaca draft dari localStorage:", err);
    return null;
  }
}

/**
 * Menyimpan atau memperbarui sebagian data draft ke localStorage.
 * Memastikan jika user menekan Back, data tidak hilang.
 */
export function saveLocalDraft(patch: Partial<BookingDraft>): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalDraft() || {};
    const updated = {
      ...existing,
      ...patch,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Gagal menyimpan draft ke localStorage:", err);
  }
}

/**
 * Menghapus draft dari localStorage setelah pemesanan berhasil disubmit.
 */
export function clearLocalDraft(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (err) {
    console.error("Gagal menghapus draft dari localStorage:", err);
  }
}

