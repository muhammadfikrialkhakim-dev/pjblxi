"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { claimPromo } from "@/app/promo/actions";

export type ClaimState = "claim" | "claimed" | "used" | "soldout" | "login";

/** Tombol di kartu promo: Klaim → Sudah diklaim. */
export default function ClaimPromoButton({ promoId, state }: { promoId: string; state: ClaimState }) {
  const router = useRouter();
  const [current, setCurrent] = useState<ClaimState>(state);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (current === "login") {
    return (
      <Link href="/login?redirectTo=/promo" className="btn-primary px-4 py-2 text-sm">
        Masuk untuk klaim
      </Link>
    );
  }
  if (current === "claimed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-100 px-3.5 py-1.5 text-sm font-semibold text-forest-800">
        <Check className="h-4 w-4" aria-hidden /> Sudah diklaim
      </span>
    );
  }
  if (current === "used") {
    return <span className="rounded-full bg-ink/10 px-3.5 py-1.5 text-sm font-semibold text-ink/55">Sudah dipakai</span>;
  }
  if (current === "soldout") {
    return <span className="rounded-full bg-ink/10 px-3.5 py-1.5 text-sm font-semibold text-ink/55">Kuota habis</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await claimPromo(promoId);
            if (res.ok) {
              setCurrent("claimed");
              router.refresh();
            } else if (res.needLogin) {
              router.push("/login?redirectTo=/promo");
            } else {
              setError(res.error);
            }
          });
        }}
        className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />}
        {pending ? "Mengklaim…" : "Klaim"}
      </button>
      {error && (
        <p role="alert" className="max-w-[16rem] text-right text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
