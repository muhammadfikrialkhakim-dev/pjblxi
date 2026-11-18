"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Tiket, formatIDR } from "@/lib/types";

export default function TiketPicker({
  tiketList,
  wisataSlug,
  isLoggedIn,
}: {
  tiketList: Tiket[];
  wisataSlug: string;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const storageKey = `tiket_picker_${wisataSlug}`;

  const [selectedId, setSelectedId] = useState(tiketList[0]?.id);
  const [visitDate, setVisitDate] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Pulihkan pilihan sebelumnya (kalau ada) begitu halaman ini tampil lagi,
  // misalnya setelah user klik tombol Back dari halaman booking/login.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { selectedId?: string; visitDate?: string; quantity?: number };
        if (parsed.selectedId && tiketList.some((t) => t.id === parsed.selectedId)) setSelectedId(parsed.selectedId);
        if (parsed.visitDate) setVisitDate(parsed.visitDate);
        if (parsed.quantity) setQuantity(parsed.quantity);
      }
    } catch {
      // sessionStorage tidak tersedia — abaikan saja, pakai default.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function persist(next: { selectedId?: string; visitDate?: string; quantity?: number }) {
    try {
      const current = { selectedId, visitDate, quantity, ...next };
      sessionStorage.setItem(storageKey, JSON.stringify(current));
    } catch {
      /* abaikan */
    }
  }

  const selected = useMemo(() => tiketList.find((t) => t.id === selectedId) ?? tiketList[0], [tiketList, selectedId]);
  const total = (selected?.price ?? 0) * quantity;

  // Sisa kuota untuk paket + tanggal yang dipilih, dihitung di database
  // (fungsi tiket_remaining) dari pesanan yang sudah dibayar / sedang menahan
  // kursi. null = belum diketahui (tanggal belum dipilih / sedang memuat).
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loadingQuota, setLoadingQuota] = useState(false);

  useEffect(() => {
    if (!selected?.id || !visitDate) {
      setRemaining(null);
      return;
    }
    let cancelled = false;
    setLoadingQuota(true);
    createClient()
      .rpc("tiket_remaining", { p_tiket: selected.id, p_date: visitDate })
      .then(({ data, error }) => {
        if (cancelled) return;
        setRemaining(error || typeof data !== "number" ? null : data);
        setLoadingQuota(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected?.id, visitDate]);

  const soldOut = remaining === 0;
  const maxQty = remaining ?? selected?.quota_per_day ?? 100;
  const overQuota = remaining !== null && quantity > remaining;

  function handleBook() {
    if (!selected) return;

    // Untuk pengunjung yang BELUM login, tombolnya bertuliskan "Masuk untuk
    // Memesan" — jadi begitu diklik, dia harus SELALU langsung diarahkan ke
    // halaman login, walau tanggal kunjungan belum diisi. Sebelumnya
    // pengecekan tanggal dilakukan duluan, jadi kalau tanggal masih kosong,
    // yang muncul cuma alert "Pilih tanggal" dan tombolnya seolah tidak
    // berfungsi sama sekali untuk pengunjung yang belum login.
    if (!isLoggedIn) {
      const target = visitDate
        ? `/booking?${new URLSearchParams({ tiket: selected.id, date: visitDate, qty: String(quantity) }).toString()}`
        : `/destinations/${wisataSlug}`; // tanggal belum dipilih -> balik ke halaman ini lagi setelah login
      router.push(`/login?redirectTo=${encodeURIComponent(target)}`);
      return;
    }

    if (!visitDate) return alert("Pilih tanggal kunjungan terlebih dahulu.");
    if (soldOut) return alert("Kuota untuk tanggal ini sudah habis. Silakan pilih tanggal lain.");
    if (overQuota) return alert(`Sisa kuota untuk tanggal ini tinggal ${remaining} tiket.`);

    const params = new URLSearchParams({
      tiket: selected.id,
      date: visitDate,
      qty: String(quantity),
    });
    router.push(`/booking?${params.toString()}`);
  }

  return (
    <div className="card sticky top-6 p-5">
      <h3 className="font-medium text-forest-900">Pilih Paket Tiket</h3>

      <div className="mt-3 space-y-2">
        {tiketList.map((t) => (
          <label
            key={t.id}
            className={`block cursor-pointer rounded border p-3 text-sm transition-colors ${
              selected?.id === t.id ? "border-forest-600 bg-forest-50" : "border-forest-100 hover:border-forest-300"
            }`}
          >
            <input
              type="radio"
              name="tiket"
              value={t.id}
              checked={selected?.id === t.id}
              onChange={() => {
                setSelectedId(t.id);
                persist({ selectedId: t.id });
              }}
              className="sr-only"
            />
            <div className="flex items-center justify-between">
              <span className="font-medium text-forest-900">{t.name}</span>
              <span className="font-semibold text-forest-800">{formatIDR(t.price)}</span>
            </div>
            {t.description && <p className="mt-1 text-xs text-ink/60">{t.description}</p>}
          </label>
        ))}
      </div>

      <div className="mt-5 space-y-4 border-t border-forest-100 pt-4">
        <div>
          <label className="label-field">Tanggal Kunjungan</label>
          <input
            type="date"
            className="input-field"
            min={new Date().toISOString().split("T")[0]}
            value={visitDate}
            onChange={(e) => {
              setVisitDate(e.target.value);
              persist({ visitDate: e.target.value });
            }}
          />
        </div>
        <div>
          <label className="label-field">Jumlah Tiket</label>
          <input
            type="number"
            min={1}
            max={Math.max(1, maxQty)}
            className="input-field"
            value={quantity}
            onChange={(e) => {
              const val = Math.max(1, Number(e.target.value));
              setQuantity(val);
              persist({ quantity: val });
            }}
          />
          {visitDate && (
            <p
              className={`mt-1.5 text-xs ${
                soldOut || overQuota ? "font-medium text-red-600" : "text-ink/55"
              }`}
            >
              {loadingQuota
                ? "Memeriksa kuota…"
                : remaining === null
                  ? ""
                  : soldOut
                    ? "Kuota habis untuk tanggal ini."
                    : overQuota
                      ? `Sisa kuota hanya ${remaining} tiket.`
                      : `Sisa kuota: ${remaining} tiket`}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-forest-100 pt-4 text-sm">
        <span className="text-ink/60">Total</span>
        <span className="font-display text-lg font-semibold text-forest-900">{formatIDR(total)}</span>
      </div>

      {!isLoggedIn && (
        <p className="mt-3 rounded bg-clay-50 px-3 py-2 text-xs text-clay-700">
          Anda perlu masuk terlebih dahulu untuk melanjutkan pemesanan.
        </p>
      )}

      <button onClick={handleBook} disabled={isLoggedIn && (soldOut || overQuota)} className="btn-primary mt-3 w-full">
        {isLoggedIn ? (
          "Pesan Sekarang"
        ) : (
          <>
            <LogIn className="h-4 w-4" /> Masuk untuk Memesan
          </>
        )}
      </button>
    </div>
  );
}
