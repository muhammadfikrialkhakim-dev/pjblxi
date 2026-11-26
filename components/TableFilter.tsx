import { tableHref, type TableParams } from "@/lib/table-query";
import TableSelect from "@/components/TableSelect";

export type FilterOption = { value: string; label: string; count?: number };

/**
 * Filter berbentuk dropdown (Semua / Aktif / …). value "" = tanpa filter.
 * Memilih filter mengembalikan tabel ke halaman 1 dan mempertahankan
 * pencarian & urutan. Jumlah data ditampilkan di belakang label.
 */
export default function TableFilter({
  basePath,
  params,
  label,
  options,
}: {
  basePath: string;
  params: TableParams;
  label: string;
  options: FilterOption[];
}) {
  return (
    <TableSelect
      label={label}
      value={params.filter}
      options={options.map((o) => ({
        value: o.value,
        label: o.count !== undefined ? `${o.label} (${o.count})` : o.label,
        href: tableHref(basePath, params, { filter: o.value, page: 1 }),
      }))}
    />
  );
}
