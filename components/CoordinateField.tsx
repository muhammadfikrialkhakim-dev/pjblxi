"use client";

import { useState } from "react";
import { MapPin, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";

/** Ambil koordinat dari URL Google Maps (versi lengkap) atau teks "lat, lng". */
export function parseCoordinates(input: string): { lat: string; lng: string } | null {
  let text = input.trim();
  try {
    text = decodeURIComponent(text);
  } catch {
    // teks mengandung % yang bukan encoding valid — pakai apa adanya.
  }
  const num = "(-?\\d{1,3}(?:\\.\\d+)?)";
  const patterns = [
    new RegExp(`@${num},${num}`), //            .../@-7.98,112.63,15z
    new RegExp(`!3d${num}!4d${num}`), //        ...!3d-7.98!4d112.63
    new RegExp(`[?&](?:q|query|ll|center)=${num},\\s*${num}`), // ?q=-7.98,112.63
    new RegExp(`^${num}\\s*,\\s*${num}$`), //   -7.98, 112.63
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m && validPair(m[1], m[2])) return { lat: m[1], lng: m[2] };
  }
  return null;
}

function validPair(lat: string, lng: string) {
  const a = Number(lat);
  const b = Number(lng);
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180;
}

export default function CoordinateField({
  defaultLat,
  defaultLng,
  placeName,
}: {
  defaultLat?: number | null;
  defaultLng?: number | null;
  placeName?: string;
}) {
  const [lat, setLat] = useState(defaultLat != null ? String(defaultLat) : "");
  const [lng, setLng] = useState(defaultLng != null ? String(defaultLng) : "");
  const [paste, setPaste] = useState("");
  const [pasteMsg, setPasteMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const norm = (v: string) => v.trim().replace(",", ".");
  const latN = norm(lat);
  const lngN = norm(lng);
  const hasBoth = latN !== "" && lngN !== "";
  const valid = hasBoth && validPair(latN, lngN);
  const half = (latN !== "") !== (lngN !== "");
  const invalid = hasBoth && !valid;

  function onPaste(value: string) {
    setPaste(value);
    if (!value.trim()) return setPasteMsg(null);
    const parsed = parseCoordinates(value);
    if (parsed) {
      setLat(parsed.lat);
      setLng(parsed.lng);
      setPasteMsg({ ok: true, text: "Koordinat terdeteksi dan sudah diisi." });
      setPaste("");
    } else if (/maps\.app\.goo\.gl|goo\.gl\/maps/.test(value)) {
      setPasteMsg({
        ok: false,
        text: "Link pendek tidak bisa dibaca. Buka link-nya dulu, lalu salin URL lengkap dari address bar.",
      });
    } else if (value.length > 12) {
      setPasteMsg({ ok: false, text: "Koordinat tidak ditemukan di teks ini." });
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="label-field">Tempel Link Google Maps atau Koordinat</label>
        <input
          value={paste}
          onChange={(e) => onPaste(e.target.value)}
          className="input-field"
          placeholder="https://www.google.com/maps/@-7.98,112.63,15z   atau   -7.9839, 112.6214"
        />
        {pasteMsg && (
          <p className={`mt-1 flex items-center gap-1 text-xs ${pasteMsg.ok ? "text-forest-700" : "text-red-600"}`}>
            {pasteMsg.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
            {pasteMsg.text}
          </p>
        )}
        <p className="mt-1 text-xs text-ink/40">
          Tips: di Google Maps, klik kanan pada lokasi wisata lalu klik angka koordinat paling atas untuk menyalinnya.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label-field">Latitude</label>
          <input
            name="latitude"
            inputMode="decimal"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="input-field"
            placeholder="-7.9839"
          />
        </div>
        <div>
          <label className="label-field">Longitude</label>
          <input
            name="longitude"
            inputMode="decimal"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="input-field"
            placeholder="112.6214"
          />
        </div>
      </div>

      {(half || invalid) && (
        <p className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {half ? "Isi latitude dan longitude keduanya, atau kosongkan keduanya." : "Koordinat di luar rentang yang valid (lat −90…90, lng −180…180)."}
        </p>
      )}

      {valid ? (
        <div className="overflow-hidden rounded-lg border border-forest-100">
          <iframe
            title={`Pratinjau peta ${placeName ?? ""}`}
            src={`https://www.google.com/maps?q=${latN},${lngN}&z=14&output=embed`}
            className="h-52 w-full"
            loading="lazy"
          />
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${latN},${lngN}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 border-t border-forest-100 bg-forest-50/50 px-3 py-2 text-xs text-forest-700 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Buka di Google Maps untuk memastikan titiknya benar
          </a>
        </div>
      ) : (
        <p className="flex items-center gap-1.5 text-xs text-ink/50">
          <MapPin className="h-3.5 w-3.5" /> Tanpa koordinat, halaman destinasi tidak menampilkan peta (hanya tombol pencarian berdasarkan nama).
        </p>
      )}
    </div>
  );
}
