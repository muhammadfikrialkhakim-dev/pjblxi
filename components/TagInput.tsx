"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";

/**
 * Input "chip": ketik lalu Enter atau koma untuk menambah, klik × untuk
 * menghapus. Nilainya dikirim lewat hidden input `name` sebagai teks
 * dipisah koma — jadi server action lama (yang men-split dengan koma)
 * tidak perlu diubah.
 */
export default function TagInput({
  name,
  label,
  defaultValue = [],
  placeholder,
  suggestions = [],
  max = 20,
}: {
  name: string;
  label: string;
  defaultValue?: string[] | null;
  placeholder?: string;
  suggestions?: string[];
  max?: number;
}) {
  const [tags, setTags] = useState<string[]>(defaultValue ?? []);
  const [text, setText] = useState("");

  function add(raw: string) {
    // Koma dipakai sebagai pemisah di database, jadi tidak boleh ada di dalam item.
    const value = raw.replace(/,/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
    if (!value) return;
    setTags((prev) => {
      if (prev.length >= max) return prev;
      if (prev.some((t) => t.toLowerCase() === value.toLowerCase())) return prev;
      return [...prev, value];
    });
    setText("");
  }

  const remaining = suggestions.filter((s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase()));

  return (
    <div>
      <label className="label-field">{label}</label>
      <input type="hidden" name={name} value={tags.join(",")} />

      <div className="flex min-h-[44px] flex-wrap items-center gap-1.5 rounded border border-forest-200 bg-white px-2 py-1.5 focus-within:border-forest-600 focus-within:ring-1 focus-within:ring-forest-600">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-forest-100 py-1 pl-3 pr-1.5 text-sm text-forest-800">
            {t}
            <button
              type="button"
              onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
              aria-label={`Hapus ${t}`}
              className="rounded-full p-0.5 text-forest-600 hover:bg-forest-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          value={text}
          onChange={(e) => {
            // Mengetik atau menempel teks berkoma → langsung dipecah jadi beberapa chip.
            if (e.target.value.includes(",")) e.target.value.split(",").forEach(add);
            else setText(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // jangan submit form
              add(text);
            } else if (e.key === "Backspace" && !text && tags.length) {
              setTags((prev) => prev.slice(0, -1));
            }
          }}
          onBlur={() => add(text)}
          disabled={tags.length >= max}
          placeholder={tags.length ? "" : placeholder}
          className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-1 text-sm outline-none focus:ring-0"
        />
      </div>

      {remaining.length > 0 && tags.length < max && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-ink/40">Saran:</span>
          {remaining.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-forest-300 px-2.5 py-0.5 text-xs text-forest-700 hover:bg-forest-50"
            >
              <Plus className="h-3 w-3" /> {s}
            </button>
          ))}
        </div>
      )}
      <p className="mt-1 text-xs text-ink/40">Tekan Enter atau koma untuk menambah. Maksimal {max} item.</p>
    </div>
  );
}
