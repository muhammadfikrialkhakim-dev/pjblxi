"use client";

import { useState } from "react";

/** Teks panjang yang dipotong beberapa baris, dengan tombol "Baca selengkapnya". */
export default function ExpandableText({ text, limit = 320 }: { text: string; limit?: number }) {
  const [open, setOpen] = useState(false);
  const long = text.length > limit;

  return (
    <div>
      <p className={`whitespace-pre-line text-[15px] leading-relaxed text-ink/80 ${long && !open ? "line-clamp-4" : ""}`}>
        {text}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-2 text-sm font-bold text-clay-600 hover:underline"
        >
          {open ? "Sembunyikan" : "Baca selengkapnya"}
        </button>
      )}
    </div>
  );
}
