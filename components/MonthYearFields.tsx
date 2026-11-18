export const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/**
 * Pilihan bulan + tahun. Sengaja memakai dua <select> biasa, bukan
 * <input type="month">, karena input itu belum didukung di semua browser
 * desktop (mis. Firefox & Safari).
 */
export default function MonthYearFields({
  month,
  year,
  currentYear,
}: {
  month: number;
  year: number;
  currentYear: number;
}) {
  const years = Array.from({ length: 4 }, (_, i) => currentYear - i);
  if (!years.includes(year)) years.push(year);
  years.sort((a, b) => b - a);

  return (
    <>
      <div>
        <label htmlFor="bulan" className="sr-only">
          Bulan
        </label>
        <select id="bulan" name="bulan" defaultValue={month} className="input-field">
          {BULAN.map((name, i) => (
            <option key={name} value={i + 1}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="tahun" className="sr-only">
          Tahun
        </label>
        <select id="tahun" name="tahun" defaultValue={year} className="input-field">
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
