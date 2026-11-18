import { Category, Destination } from "@/lib/types";
import { saveDestination } from "@/app/admin/spots/actions";

export default function DestinationForm({
  destination,
  categories,
}: {
  destination?: Destination;
  categories: Category[];
}) {
  return (
    <form action={saveDestination} className="card space-y-5 p-6">
      {destination && <input type="hidden" name="id" value={destination.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label-field">Nama Destinasi</label>
          <input name="name" required defaultValue={destination?.name} className="input-field" />
        </div>
        <div>
          <label className="label-field">Lokasi</label>
          <input name="location" defaultValue={destination?.location ?? ""} className="input-field" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label-field">Kategori</label>
          <select name="category_id" defaultValue={destination?.category_id ?? ""} className="input-field">
            <option value="">Pilih kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-field">Harga Tiket (Rp)</label>
          <input type="number" name="price" required defaultValue={destination?.price} className="input-field" />
        </div>
        <div>
          <label className="label-field">Kuota / Hari</label>
          <input type="number" name="quota_per_day" defaultValue={destination?.quota_per_day ?? 100} className="input-field" />
        </div>
      </div>

      <div>
        <label className="label-field">URL Gambar Sampul</label>
        <input name="cover_image_url" defaultValue={destination?.cover_image_url ?? ""} className="input-field" placeholder="https://..." />
      </div>

      <div>
        <label className="label-field">Deskripsi Singkat</label>
        <input name="short_description" defaultValue={destination?.short_description ?? ""} className="input-field" />
      </div>

      <div>
        <label className="label-field">Deskripsi Lengkap</label>
        <textarea name="description" rows={5} defaultValue={destination?.description ?? ""} className="input-field" />
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <input type="checkbox" id="is_trending" name="is_trending" defaultChecked={destination?.is_trending} />
          <label htmlFor="is_trending" className="text-sm text-ink/80">Tandai sebagai trending</label>
        </div>
        <div>
          <select name="status" defaultValue={destination?.status ?? "published"} className="input-field !w-auto">
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <button type="submit" className="btn-primary">
        Simpan Destinasi
      </button>
    </form>
  );
}
