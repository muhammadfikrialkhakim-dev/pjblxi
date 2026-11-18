import { Wisata, Tiket } from "@/lib/types";
import { saveTiket } from "@/app/admin/tiket/actions";

export default function TiketForm({
  tiket,
  wisataList,
  defaultWisataId,
  lockWisata,
}: {
  tiket?: Tiket;
  wisataList: Wisata[];
  defaultWisataId?: string;
  /** Admin Wisata cuma pegang 1 wisata — kunci field ini jadi read-only
   * (bukan dropdown semua wisata) supaya tidak ada peluang salah pilih.
   * Validasi ulang tetap dilakukan di server (lihat saveTiket). */
  lockWisata?: boolean;
}) {
  const wisataId = tiket?.wisata_id ?? defaultWisataId ?? "";
  const ownWisata = wisataList.find((w) => w.id === wisataId);

  return (
    <form action={saveTiket} className="card space-y-5 p-6">
      {tiket && <input type="hidden" name="id" value={tiket.id} />}

      <div>
        <label className="label-field">Wisata</label>
        {lockWisata ? (
          <>
            <input type="hidden" name="wisata_id" value={wisataId} />
            <p className="input-field bg-forest-50 text-ink/70">
              {ownWisata?.name ?? "Wisata Anda"}
            </p>
          </>
        ) : (
          <select
            name="wisata_id"
            required
            defaultValue={wisataId}
            className="input-field"
          >
            <option value="">Pilih wisata</option>
            {wisataList.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="label-field">Nama Paket Tiket</label>
        <input name="name" required defaultValue={tiket?.name} className="input-field" placeholder="mis. Sunrise Tour + Jeep" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label-field">Harga (Rp)</label>
          <input type="number" name="price" required defaultValue={tiket?.price} className="input-field" />
        </div>
        <div>
          <label className="label-field">Harga Coret (opsional)</label>
          <input type="number" name="original_price" defaultValue={tiket?.original_price ?? ""} className="input-field" />
        </div>
        <div>
          <label className="label-field">Kuota / Hari</label>
          <input type="number" name="quota_per_day" defaultValue={tiket?.quota_per_day ?? 100} className="input-field" />
        </div>
      </div>

      <div>
        <label className="label-field">Deskripsi Paket</label>
        <textarea name="description" rows={3} defaultValue={tiket?.description ?? ""} className="input-field" placeholder="Apa saja yang termasuk dalam paket ini?" />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="is_active" name="is_active" defaultChecked={tiket?.is_active ?? true} />
        <label htmlFor="is_active" className="text-sm text-ink/80">Aktifkan paket ini (bisa dipesan)</label>
      </div>

      <button type="submit" className="btn-primary">
        Simpan Paket Tiket
      </button>
    </form>
  );
}
