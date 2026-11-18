import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { tableHref, type TableParams } from "@/lib/table-query";

/** Header kolom yang bisa diklik untuk mengurutkan (naik → turun). */
export default function SortableTh({
  basePath,
  params,
  sortKey,
  children,
  className = "",
}: {
  basePath: string;
  params: TableParams;
  sortKey: string;
  children: React.ReactNode;
  className?: string;
}) {
  const active = params.sort === sortKey;
  const nextDir = active && params.dir === "asc" ? "desc" : "asc";
  const Icon = !active ? ArrowUpDown : params.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      className={`px-4 py-3 font-medium ${className}`}
      aria-sort={active ? (params.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <Link
        href={tableHref(basePath, params, { sort: sortKey, dir: nextDir, page: 1 })}
        className={`inline-flex items-center gap-1.5 hover:text-forest-900 ${active ? "text-forest-900" : ""}`}
      >
        {children}
        <Icon className={`h-3.5 w-3.5 ${active ? "text-clay-600" : "text-ink/30"}`} aria-hidden />
      </Link>
    </th>
  );
}
