import { Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { saveSiteSettings } from "./actions";
import ImageGalleryUploadField from "@/components/ImageGalleryUploadField";
import ImageUploadField from "@/components/ImageUploadField";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const supabase = createClient();
  const { data: settings } = await supabase.from("site_settings").select("*").eq("id", true).maybeSingle();

  return (
    <div>
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-clay-500" />
        <h1 className="font-display text-2xl font-semibold text-forest-900">Pengaturan Situs</h1>
      </div>
      <p className="mt-1 text-sm text-ink/60">
        Pengaturan di halaman ini berlaku untuk SELURUH platform Explore Malang — makanya cuma Super
        Admin yang bisa mengubahnya, bukan Admin Wisata atau Admin biasa.
      </p>

      {searchParams.error && (
        <div className="mt-4 rounded bg-red-50 px-4 py-3 text-sm text-red-700">{searchParams.error}</div>
      )}

      <form action={saveSiteSettings} className="card mt-6 max-w-2xl space-y-5 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-forest-900">Nama Situs</label>
          <input
            type="text"
            name="site_name"
            defaultValue={settings?.site_name ?? "Explore Malang"}
            required
            className="input-field"
          />
        </div>

        <div>
          <ImageGalleryUploadField
            name="hero_images"
            label="Gambar Hero Homepage (slideshow)"
            defaultValue={settings?.hero_images ?? []}
            maxSizeMB={10}
            minWidth={1920}
          />
          <p className="mt-1 text-xs text-ink/50">
            Kosong = hero homepage tampil polos. Gambar yang diunggah di sini akan ganti otomatis tiap 3 detik. Hero
            tampil selebar layar, jadi pakai foto lanskap berukuran besar (idealnya 2400×1350 px). Jangan perkecil
            ukuran pikselnya untuk menghemat ukuran file — kalau perlu dikompres, turunkan kualitas JPG-nya saja
            (sekitar 80–85%); situs sudah mengoptimalkan gambar secara otomatis saat ditampilkan.
          </p>
        </div>

        <div className="space-y-5 rounded-lg border border-forest-100 bg-forest-50/40 p-4">
          <div>
            <h3 className="text-sm font-semibold text-forest-900">Gambar Latar Banner Halaman</h3>
            <p className="mt-0.5 text-xs text-ink/50">
              Gambar untuk bagian banner hijau di atas tiap halaman (termasuk Dashboard Admin). Kosong = gradasi hijau bawaan. Gunakan foto
              lanskap beresolusi baik; teks di atasnya otomatis diberi lapisan gelap supaya tetap terbaca.
            </p>
          </div>
          <ImageUploadField
            name="categories_banner_image"
            label="Banner Halaman Kategori"
            defaultValue={settings?.categories_banner_image ?? null}
            maxSizeMB={10}
            minWidth={1920}
          />
          <ImageUploadField
            name="destinations_banner_image"
            label="Banner Halaman Destinasi"
            defaultValue={settings?.destinations_banner_image ?? null}
            maxSizeMB={10}
            minWidth={1920}
          />
          <ImageUploadField
            name="wishlist_banner_image"
            label="Banner Halaman Wishlist"
            defaultValue={settings?.wishlist_banner_image ?? null}
            maxSizeMB={10}
            minWidth={1920}
          />
          <ImageUploadField
            name="promo_banner_image"
            label="Banner Halaman Promo"
            defaultValue={settings?.promo_banner_image ?? null}
            maxSizeMB={10}
            minWidth={1920}
          />
          <ImageUploadField
            name="dashboard_banner_image"
            label="Banner Dashboard Admin"
            defaultValue={settings?.dashboard_banner_image ?? null}
            maxSizeMB={10}
            minWidth={1600}
          />
        </div>

        <div>
          <ImageUploadField
            name="auth_panel_image"
            label="Gambar Panel Halaman Masuk & Daftar"
            defaultValue={settings?.auth_panel_image ?? null}
            maxSizeMB={10}
            minWidth={1200}
          />
          <p className="mt-1 text-xs text-ink/50">
            Tampil di panel kiri halaman Masuk dan Daftar (hanya di layar lebar). Kosong = ilustrasi pegunungan
            bawaan. Gunakan foto lanskap atau potret berkualitas baik; teks di atasnya otomatis diberi lapisan gelap
            supaya tetap terbaca.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-forest-900">Tagline</label>
          <textarea
            name="site_tagline"
            defaultValue={settings?.site_tagline ?? ""}
            rows={2}
            className="input-field"
          />
          <p className="mt-1 text-xs text-ink/50">Tampil di footer halaman publik.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-forest-900">Email Kontak</label>
            <input
              type="email"
              name="contact_email"
              defaultValue={settings?.contact_email ?? ""}
              placeholder="hello@exploremalang.id"
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-forest-900">WhatsApp Kontak</label>
            <input
              type="text"
              name="contact_whatsapp"
              defaultValue={settings?.contact_whatsapp ?? ""}
              placeholder="6281234567890"
              className="input-field"
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-forest-900">Metode Pembayaran Aktif</p>
          <p className="mb-3 text-xs text-ink/50">
            Metode yang dimatikan di sini tidak akan muncul sebagai pilihan pembayaran di halaman
            checkout pengunjung.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "payment_bank_transfer_enabled", label: "Transfer Bank / VA" },
              { key: "payment_ewallet_enabled", label: "E-Wallet" },
              { key: "payment_credit_card_enabled", label: "Kartu Kredit" },
              { key: "payment_qris_enabled", label: "QRIS" },
            ].map((m) => (
              <label key={m.key} className="flex items-center gap-2 rounded border border-forest-100 px-3 py-2.5 text-sm">
                <input
                  type="checkbox"
                  name={m.key}
                  defaultChecked={settings ? Boolean(settings[m.key as keyof typeof settings]) : true}
                />
                {m.label}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary">
          Simpan Pengaturan
        </button>
      </form>
    </div>
  );
}
