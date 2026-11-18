"use client";

import { Category, Profile, Wisata } from "@/lib/types";
import { saveWisata } from "@/app/admin/spots/actions";
import ImageUploadField from "@/components/ImageUploadField";
import ImageGalleryUploadField from "@/components/ImageGalleryUploadField";
import { UploadStatusProvider, useIsAnyUploadInProgress } from "@/components/UploadStatusContext";

function SubmitButton() {
  // Kalau ada gambar (cover/galeri) yang masih dalam proses upload ke
  // Supabase Storage, tombol "Simpan" dinonaktifkan dulu — supaya form
  // tidak terkirim membawa URL gambar LAMA (hidden input-nya baru
  // ter-update setelah upload benar-benar selesai). Lihat penjelasan
  // lengkap di UploadStatusContext.tsx.
  const isUploading = useIsAnyUploadInProgress();

  return (
    <button type="submit" disabled={isUploading} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60">
      {isUploading ? "Menunggu gambar selesai diunggah..." : "Simpan Wisata"}
    </button>
  );
}

export default function WisataForm({
  wisata,
  categories,
  wisataAdmins,
  canAssignAdmin,
}: {
  wisata?: Wisata;
  categories: Category[];
  wisataAdmins?: Profile[];
  canAssignAdmin?: boolean;
}) {
  return (
    <UploadStatusProvider>
      <form action={saveWisata} className="card space-y-5 p-6">
      {wisata && <input type="hidden" name="id" value={wisata.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label-field">Nama Wisata</label>
          <input name="name" required defaultValue={wisata?.name} className="input-field" />
        </div>
        <div>
          <label className="label-field">Lokasi</label>
          <input name="location" defaultValue={wisata?.location ?? ""} className="input-field" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label-field">Kategori</label>
          <select name="category_id" defaultValue={wisata?.category_id ?? ""} className="input-field">
            <option value="">Pilih kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-field">Status</label>
          <select name="status" defaultValue={wisata?.status ?? "published"} className="input-field">
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <ImageUploadField
          name="cover_image_url"
          label="Gambar Sampul"
          defaultValue={wisata?.cover_image_url}
        />

        <ImageGalleryUploadField
          name="gallery_urls"
          label="Galeri Foto (opsional)"
          defaultValue={wisata?.gallery_urls}
        />
      </div>

      <div>
        <label className="label-field">Deskripsi Singkat</label>
        <input name="short_description" defaultValue={wisata?.short_description ?? ""} className="input-field" />
      </div>

      <div>
        <label className="label-field">Deskripsi Lengkap</label>
        <textarea name="description" rows={5} defaultValue={wisata?.description ?? ""} className="input-field" />
      </div>

      <div>
        <label className="label-field">Fasilitas Termasuk</label>
        <input
          name="facilities"
          defaultValue={wisata?.facilities?.join(", ") ?? ""}
          className="input-field"
          placeholder="Toilet, Musholla, Area Parkir (pisahkan dengan koma)"
        />
      </div>

      <div className="rounded-lg border border-forest-100 p-4">
        <p className="text-sm font-medium text-forest-900">Info Penting untuk Wisatawan</p>
        <p className="mt-0.5 text-xs text-ink/50">
          Ditampilkan di halaman detail destinasi supaya wisatawan lebih siap sebelum berangkat.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field">Jam Operasional</label>
            <input
              name="opening_hours"
              defaultValue={wisata?.opening_hours ?? ""}
              className="input-field"
              placeholder="Setiap hari, 08.00 - 17.00 WIB"
            />
          </div>
          <div>
            <label className="label-field">Kontak / WhatsApp Pengelola</label>
            <input
              name="contact_phone"
              defaultValue={wisata?.contact_phone ?? ""}
              className="input-field"
              placeholder="0812xxxxxxxx"
            />
          </div>
          <div>
            <label className="label-field">Estimasi Durasi Kunjungan</label>
            <input
              name="estimated_duration"
              defaultValue={wisata?.estimated_duration ?? ""}
              className="input-field"
              placeholder="2-3 jam"
            />
          </div>
          <div>
            <label className="label-field">Waktu Terbaik Berkunjung</label>
            <input
              name="best_time_to_visit"
              defaultValue={wisata?.best_time_to_visit ?? ""}
              className="input-field"
              placeholder="Pagi hari sebelum jam 09.00 (hindari kabut)"
            />
          </div>
          <div>
            <label className="label-field">Batasan Umur</label>
            <input
              name="age_restriction"
              defaultValue={wisata?.age_restriction ?? ""}
              className="input-field"
              placeholder="Semua umur / Anak di bawah 5 tahun wajib didampingi"
              maxLength={150}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="label-field">Tips Berkunjung</label>
          <input
            name="tips"
            defaultValue={wisata?.tips?.join(", ") ?? ""}
            className="input-field"
            placeholder="Bawa jaket karena dingin, Gunakan alas kaki anti-licin (pisahkan dengan koma)"
          />
        </div>
      </div>

      {canAssignAdmin && (
        <div>
          <label className="label-field">Admin Wisata</label>
          <select name="admin_id" defaultValue={wisata?.admin_id ?? ""} className="input-field">
            <option value="">Belum ditugaskan</option>
            {wisataAdmins?.map((a) => (
              <option key={a.id} value={a.id}>{a.full_name ?? a.id}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink/40">
            Akun ini akan jadi satu-satunya admin yang bisa mengelola wisata & tiketnya.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input type="checkbox" id="is_trending" name="is_trending" defaultChecked={wisata?.is_trending} />
        <label htmlFor="is_trending" className="text-sm text-ink/80">Tandai sebagai trending</label>
      </div>

      <SubmitButton />

      {wisata && (
        <p className="text-xs text-ink/50">
          Setelah disimpan, atur harga & paket tiket di menu <strong>Kelola Tiket</strong>.
        </p>
      )}
    </form>
    </UploadStatusProvider>
  );
}
