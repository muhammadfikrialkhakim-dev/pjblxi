"use client";

import { useState } from "react";
import { PROVINCES, formatDomicile, matchLegacyDomicile, parseDomicile } from "@/lib/indonesia-regions";

/**
 * Pilihan domisili berjenjang: Provinsi → Kabupaten/Kota (data resmi, bukan
 * ketik bebas). Yang dikirim ke server satu isian tersembunyi `city`
 * berbentuk "Kota Malang, Jawa Timur".
 *
 * Domisili lama yang diketik bebas ("Malang") dicoba dicocokkan otomatis;
 * kalau ambigu, nilai lamanya tetap tersimpan sampai pengguna memilih ulang —
 * jadi menyimpan profil tidak pernah menghapus data tanpa sengaja.
 */
export default function DomicileField({
  defaultValue,
  labelClass,
  fieldClass,
}: {
  defaultValue: string | null;
  labelClass: string;
  fieldClass: string;
}) {
  const initial = parseDomicile(defaultValue) ?? matchLegacyDomicile(defaultValue);
  const [province, setProvince] = useState(initial?.province ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [touched, setTouched] = useState(false);

  const cities = PROVINCES.find((p) => p.name === province)?.cities ?? [];

  // Belum disentuh & tidak bisa dicocokkan → pertahankan nilai lama apa adanya.
  const value = province && city ? formatDomicile(city, province) : touched ? "" : (defaultValue ?? "");
  const unresolvedLegacy = !touched && !initial && Boolean(defaultValue);

  return (
    <div>
      <input type="hidden" name="city" value={value} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="domicile-province">
            Provinsi
          </label>
          <select
            id="domicile-province"
            value={province}
            onChange={(e) => {
              setTouched(true);
              setProvince(e.target.value);
              setCity(""); // kota milik provinsi lain tidak berlaku lagi
            }}
            className={fieldClass}
          >
            <option value="">Pilih provinsi</option>
            {PROVINCES.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="domicile-city">
            Kota / Kabupaten Domisili
          </label>
          <select
            id="domicile-city"
            value={city}
            disabled={!province}
            onChange={(e) => {
              setTouched(true);
              setCity(e.target.value);
            }}
            className={`${fieldClass} disabled:cursor-not-allowed disabled:bg-forest-50/60 disabled:text-ink/40`}
          >
            <option value="">{province ? "Pilih kota atau kabupaten" : "Pilih provinsi dulu"}</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {unresolvedLegacy && (
        <p className="mt-1.5 text-sm text-ink/55">
          Domisili tersimpan saat ini: “{defaultValue}”. Pilih provinsi dan kota di atas untuk memperbaruinya.
        </p>
      )}
    </div>
  );
}
