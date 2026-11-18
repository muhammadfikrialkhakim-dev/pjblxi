"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { changePassword, type FormState } from "@/app/profile/actions";
import PasswordInput from "@/components/PasswordInput";
import PasswordStrength from "@/components/PasswordStrength";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} className="btn-primary min-w-[140px]">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      Ubah Kata Sandi
    </button>
  );
}

export default function PasswordChangeForm() {
  const [state, formAction] = useFormState<FormState, FormData>(changePassword, null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  // Kosongkan field setelah berhasil.
  useEffect(() => {
    if (state?.ok) {
      setCurrent("");
      setNext("");
      setConfirm("");
    }
  }, [state]);

  const mismatch = confirm.length > 0 && next !== confirm;
  const canSubmit = !!current && next.length >= 8 && next === confirm;

  return (
    <form action={formAction}>
      <div className="space-y-5 p-6">
        {state && (
          <div
            role="status"
            className={`flex items-start gap-2 rounded-lg px-3.5 py-2.5 text-sm ${
              state.ok ? "bg-forest-50 text-forest-800" : "bg-red-50 text-red-700"
            }`}
          >
            {state.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
            {state.message}
          </div>
        )}

        <div>
          <label className="label-field">Kata Sandi Saat Ini</label>
          <PasswordInput value={current} onChange={setCurrent} autoComplete="current-password" />
          <input type="hidden" name="current_password" value={current} />
        </div>

        <div>
          <label className="label-field">Kata Sandi Baru</label>
          <PasswordInput value={next} onChange={setNext} autoComplete="new-password" minLength={8} />
          <input type="hidden" name="new_password" value={next} />
          <PasswordStrength password={next} />
        </div>

        <div>
          <label className="label-field">Konfirmasi Kata Sandi Baru</label>
          <PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" minLength={8} />
          <input type="hidden" name="confirm_password" value={confirm} />
          {mismatch && <p className="mt-1.5 text-xs text-red-600">Konfirmasi kata sandi belum cocok.</p>}
        </div>
      </div>

      <div className="flex justify-end border-t border-forest-100 px-6 py-4">
        <SubmitButton disabled={!canSubmit} />
      </div>
    </form>
  );
}
