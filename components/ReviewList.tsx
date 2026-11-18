"use client";

import { useMemo, useState } from "react";
import { Star } from "lucide-react";

export interface ReviewListItem {
  id: string;
  rating: number;
  hasComment: boolean;
  verified: boolean;
  ts: number; // waktu dibuat (ms) untuk pengurutan
  node: React.ReactNode; // kartu ulasan yang sudah dirender di server
}

type Filter = "all" | "verified" | "comment" | 1 | 2 | 3 | 4 | 5;
type Sort = "new" | "high" | "low";

const PAGE = 5;

/**
 * Daftar ulasan dengan filter (semua / terverifikasi / ada komentar / per bintang),
 * pengurutan, dan "Tampilkan lebih banyak". Kartu ulasannya sendiri dirender di
 * server (termasuk jempol & balasan) lalu dikirim sebagai `node`.
 */
export default function ReviewList({ items }: { items: ReviewListItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("new");
  const [shown, setShown] = useState(PAGE);

  const counts = useMemo(() => {
    const c: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    items.forEach((i) => (c[i.rating] = (c[i.rating] ?? 0) + 1));
    return c;
  }, [items]);

  const visible = useMemo(() => {
    let list = items.filter((i) => {
      if (filter === "all") return true;
      if (filter === "verified") return i.verified;
      if (filter === "comment") return i.hasComment;
      return i.rating === filter;
    });
    list = [...list].sort((a, b) =>
      sort === "high" ? b.rating - a.rating || b.ts - a.ts : sort === "low" ? a.rating - b.rating || b.ts - a.ts : b.ts - a.ts
    );
    return list;
  }, [items, filter, sort]);

  const chip = (active: boolean, disabled = false) =>
    `flex shrink-0 items-center gap-1 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "border-clay-500 bg-clay-500 text-white"
        : disabled
          ? "cursor-not-allowed border-forest-100 text-ink/30"
          : "border-forest-200 bg-white text-forest-800 hover:bg-forest-50"
    }`;

  function pick(f: Filter) {
    setFilter(f);
    setShown(PAGE);
  }

  if (!items.length) {
    return <p className="py-6 text-center text-sm text-ink/40">Belum ada penilaian. Jadilah yang pertama menilai wisata ini!</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <button type="button" onClick={() => pick("all")} className={chip(filter === "all")}>Semua ({items.length})</button>
          <button type="button" onClick={() => pick("verified")} className={chip(filter === "verified")}>Terverifikasi</button>
          <button type="button" onClick={() => pick("comment")} className={chip(filter === "comment")}>Dengan komentar</button>
          {[5, 4, 3, 2, 1].map((n) => (
            <button
              key={n}
              type="button"
              disabled={!counts[n]}
              onClick={() => pick(n as Filter)}
              className={chip(filter === n, !counts[n])}
            >
              {n} <Star className="h-3.5 w-3.5 fill-current" />
              <span className="text-xs opacity-70">({counts[n]})</span>
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-lg border border-forest-200 bg-white px-3 py-2 text-sm text-ink/80"
          aria-label="Urutkan ulasan"
        >
          <option value="new">Terbaru</option>
          <option value="high">Rating tertinggi</option>
          <option value="low">Rating terendah</option>
        </select>
      </div>

      <div className="mt-5 space-y-4">
        {visible.slice(0, shown).map((i) => (
          <div key={i.id}>{i.node}</div>
        ))}
        {!visible.length && <p className="py-6 text-center text-sm text-ink/40">Tidak ada ulasan untuk filter ini.</p>}
      </div>

      {visible.length > shown && (
        <button
          type="button"
          onClick={() => setShown((n) => n + PAGE)}
          className="mt-5 w-full rounded-lg border border-forest-200 bg-white py-3 text-sm font-semibold text-forest-800 hover:bg-forest-50"
        >
          Tampilkan {Math.min(PAGE, visible.length - shown)} ulasan lagi
        </button>
      )}
    </div>
  );
}
