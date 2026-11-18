import { savePromo } from "@/app/admin/promos/actions";
import { isoToWibLocal, type Promo } from "@/lib/promo";

export default function PromoForm({
  promo,
  wisataList,
  lockWisata,
}: {
  promo?: Promo;
  wisataList: { id: string; name: string }[];
  /** Admin Wisata: cakupan dikunci ke wisatanya sendiri (divalidasi ulang di server). */
  lockWisata?: boolean;
}) {
  const lockedName = wisataList[0]?.name ?? "Wisata Anda";

  return (
    <form action={savePromo} className="card space-y-5 p-6">
      {promo && <input type="hidden" name="id" value={promo.id} />}

      <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
        <div>
          <label className="label-field">Kode Promo</label>
          <input
            name="code"
            required
            defaultValue={promo?.code}
            className="input-field uppercase"
            placeholder="HEMAT20"
            maxLength={40}
          />
          <p className="mt-1 text-xs text-ink/50">Huruf/angka, tanpa spasi. Dipakai pengunjung untuk klaim lewat kode.</p>
        </div>
        <div>
          <label className="label-field">Judul Promo</label>
          <input
            name="title"
            required
            defaultValue={promo?.title}
            className="input-field"
            placeholder="mis. Diskon Akhir Pekan"
          />
        </div>
      </div>

      <div>
        <label className="label-field">Deskripsi (opsional)</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={promo?.description ?? ""}
          className="input-field"
          placeholder="Syarat & ketentuan singkat yang tampil di kartu promo"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label-field">Jenis Diskon</label>
          <select name="discount_type" defaultValue={promo?.discount_type ?? "percent"} className="input-field">
            <option value="percent">Persen (%)</option>
            <option value="fixed">Nominal (Rp)</option>
          </select>
        </div>
        <div>
          <label className="label-field">Nilai Diskon</label>
          <input
            type="number"
            name="discount_value"
            required
            min={1}
            step="any"
            defaultValue={promo?.discount_value}
            className="input-field"
            placeholder="20 atau 10000"
          />
        </div>
        <div>
          <label className="label-field">Maks. Diskon (Rp)</label>
          <input
            type="number"
            name="max_discount"
            min={1}
            defaultValue={promo?.max_discount ?? ""}
            className="input-field"
            placeholder="opsional"
          />
          <p className="mt-1 text-xs text-ink/50">Hanya untuk jenis persen.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label-field">Minimal Belanja (Rp)</label>
          <input type="number" name="min_purchase" min={0} defaultValue={promo?.min_purchase ?? 0} className="input-field" />
        </div>
        <div>
          <label className="label-field">Kuota Klaim (opsional)</label>
          <input
            type="number"
            name="claim_quota"
            min={1}
            defaultValue={promo?.claim_quota ?? ""}
            className="input-field"
            placeholder="kosong = tanpa batas"
          />
          <p className="mt-1 text-xs text-ink/50">Jumlah maksimal orang yang boleh mengklaim.</p>
        </div>
      </div>

      <div>
        <label className="label-field">Berlaku di</label>
        {lockWisata ? (
          <p className="input-field bg-forest-50 text-ink/70">{lockedName}</p>
        ) : (
          <select name="wisata_id" defaultValue={promo?.wisata_id ?? ""} className="input-field">
            <option value="">Semua destinasi</option>
            {wisataList.map((w) => (
              <option key={w.id} value={w.id}>
                Khusus {w.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label-field">Mulai (WIB)</label>
          <input
            type="datetime-local"
            name="starts_at"
            defaultValue={isoToWibLocal(promo?.starts_at ?? new Date().toISOString())}
            className="input-field"
          />
        </div>
        <div>
          <label className="label-field">Berakhir (WIB, opsional)</label>
          <input type="datetime-local" name="ends_at" defaultValue={isoToWibLocal(promo?.ends_at)} className="input-field" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="is_active" name="is_active" defaultChecked={promo?.is_active ?? true} />
        <label htmlFor="is_active" className="text-sm text-ink/80">
          Aktifkan promo ini (tampil & bisa diklaim)
        </label>
      </div>

      <button type="submit" className="btn-primary">
        Simpan Promo
      </button>
    </form>
  );
}
