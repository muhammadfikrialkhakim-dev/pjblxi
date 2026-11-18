"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Kode voucher bergaya tiket + tombol salin. */
export default function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard tidak tersedia — abaikan, kodenya tetap terlihat */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Salin kode"
      aria-label={`Salin kode ${code}`}
      className="group inline-flex items-center gap-2 rounded-lg border border-dashed border-forest-300 bg-forest-50 px-3 py-1.5 text-xs font-bold tracking-widest text-forest-800 transition-colors hover:border-clay-400 hover:bg-clay-50"
    >
      {code}
      {copied ? (
        <Check className="h-3.5 w-3.5 text-forest-600" aria-hidden />
      ) : (
        <Copy className="h-3.5 w-3.5 text-forest-500 group-hover:text-clay-600" aria-hidden />
      )}
      <span className="sr-only" role="status">
        {copied ? "Kode disalin" : ""}
      </span>
    </button>
  );
}
