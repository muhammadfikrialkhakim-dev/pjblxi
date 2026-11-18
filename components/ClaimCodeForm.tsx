"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimPromoByCode } from "@/app/promo/actions";

/** Klaim promo dengan mengetik kodenya. */
export default function ClaimCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const res = await claimPromoByCode(code);
          if (res.ok) {
            setMessage({ ok: true, text: `Berhasil! “${res.title}” masuk ke Voucher Saya.` });
            setCode("");
            router.refresh();
          } else if (res.needLogin) {
            router.push("/login?redirectTo=/promo");
          } else {
            setMessage({ ok: false, text: res.error });
          }
        });
      }}
    >
      <label htmlFor="promo-code" className="block font-display text-lg font-semibold text-forest-900">
        Punya kode promo?
      </label>
      <p className="mb-3 mt-0.5 text-sm text-ink/60">Masukkan kodenya, voucher langsung masuk ke akun Anda.</p>
      <div className="flex gap-2">
        <input
          id="promo-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Masukkan kode, mis. HEMAT20"
          className="input-field flex-1 font-semibold tracking-wider"
          maxLength={40}
          autoComplete="off"
        />
        <button type="submit" disabled={pending || !code.trim()} className="btn-primary disabled:opacity-60">
          {pending ? "Memeriksa…" : "Klaim"}
        </button>
      </div>
      {message && (
        <p role="status" className={`mt-2 text-sm ${message.ok ? "text-forest-700" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}
