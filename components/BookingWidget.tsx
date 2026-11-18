"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Wisata, formatIDR, lowestPrice } from "@/lib/types";

export default function BookingWidget({ wisata }: { wisata: Wisata }) {
  const router = useRouter();
  const [visitDate, setVisitDate] = useState("");
  const [quantity, setQuantity] = useState(1);

  const price = lowestPrice(wisata.tiket) ?? 0;
  const total = useMemo(() => price * quantity, [price, quantity]);

  function handleBook() {
    if (!visitDate) return alert("Pilih tanggal kunjungan terlebih dahulu.");
    const firstTiket = wisata.tiket?.[0];
    const params = new URLSearchParams({
      tiket: firstTiket?.id ?? "",
      date: visitDate,
      qty: String(quantity),
    });
    router.push(`/booking?${params.toString()}`);
  }

  return (
    <div className="card sticky top-6 p-5">
      <p className="text-sm text-ink/60">Harga mulai dari</p>
      <p className="mt-1 font-display text-2xl font-semibold text-forest-900">
        {formatIDR(price)} <span className="text-sm font-normal text-ink/50">/ tiket</span>
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="label-field">Tanggal Kunjungan</label>
          <input
            type="date"
            className="input-field"
            min={new Date().toISOString().split("T")[0]}
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label-field">Jumlah Tiket</label>
          <input
            type="number"
            min={1}
            max={100}
            className="input-field"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-forest-100 pt-4 text-sm">
        <span className="text-ink/60">Total</span>
        <span className="font-display text-lg font-semibold text-forest-900">{formatIDR(total)}</span>
      </div>

      <button onClick={handleBook} className="btn-primary mt-5 w-full">
        Pesan Sekarang
      </button>
    </div>
  );
}
