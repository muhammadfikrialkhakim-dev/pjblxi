"use client";

import { useRouter } from "next/navigation";

export type SelectOption = { value: string; label: string; href: string };

/**
 * Dropdown filter tabel. Setiap opsi sudah membawa href lengkap (dihitung di
 * server lewat tableHref) sehingga cari/urutan/filter lain tetap terbawa;
 * memilih opsi langsung berpindah ke URL itu.
 */
export default function TableSelect({
  label,
  value,
  options,
}: {
  label: string;
  value: string;
  options: SelectOption[];
}) {
  const router = useRouter();
  return (
    <label className="inline-flex items-center gap-2 whitespace-nowrap text-sm text-ink/60">
      <span>{label}:</span>
      <select
        value={value}
        onChange={(e) => {
          const o = options.find((x) => x.value === e.target.value);
          if (o) router.push(o.href, { scroll: false });
        }}
        aria-label={label}
        className="input-field !w-auto min-w-[10rem] cursor-pointer pr-8 font-medium text-forest-900"
      >
        {options.map((o) => (
          <option key={o.value || "all"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
