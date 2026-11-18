import type { SwalIcon } from "@/lib/swal";

/**
 * Pesan "flash" yang tampil sebagai dialog setelah sebuah aksi server selesai
 * dan me-redirect dengan ?flash=<kode>&n=<nama>. Teks sengaja disimpan di sini
 * (bukan dikirim lewat URL) supaya URL tidak bisa dipakai untuk memunculkan
 * pesan sembarangan; hanya nama item (n) yang ikut dari URL dan itu pun
 * ditampilkan sebagai teks biasa.
 */
export type FlashDef = {
  icon: SwalIcon;
  title: string;
  text: (name: string | null) => string;
  /** Versi bahasa Inggris untuk pesan di halaman publik (bahasa mengikuti <html lang>). */
  en?: { title: string; text: string };
};

const q = (name: string | null) => (name ? `“${name}”` : "ini");

export const FLASHES: Record<string, FlashDef> = {
  "spot-created": { icon: "success", title: "Wisata ditambahkan", text: (n) => `Wisata ${q(n)} berhasil ditambahkan.` },
  "spot-updated": { icon: "success", title: "Perubahan disimpan", text: (n) => `Data wisata ${q(n)} berhasil diperbarui.` },
  "spot-deleted": { icon: "success", title: "Wisata dihapus", text: (n) => `Wisata ${q(n)} berhasil dihapus.` },
  "spot-delete-failed": {
    icon: "error",
    title: "Wisata gagal dihapus",
    text: (n) =>
      `Wisata ${q(n)} tidak bisa dihapus. Biasanya karena sudah ada pesanan yang terkait dengan tiketnya — ubah status wisata menjadi Draft sebagai gantinya.`,
  },
  "logged-out": {
    icon: "success",
    title: "Anda telah keluar",
    text: () => "Sampai jumpa lagi di Explore Malang!",
    en: { title: "You have been logged out", text: "See you again at Explore Malang!" },
  },
  "settings-saved": { icon: "success", title: "Pengaturan disimpan", text: () => "Perubahan pengaturan situs berhasil disimpan." },
};
