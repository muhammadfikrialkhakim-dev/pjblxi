"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { updateProfile, type FormState } from "@/app/profile/actions";

export type ProfileValues = {
  full_name: string;
  phone: string;
  gender: string;
  birth_day: string;
  birth_month: string;
  birth_year: string;
  city: string;
};

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function SubmitButton({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={!dirty || pending} className="btn-primary min-w-[110px]">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      Simpan
    </button>
  );
}

export default function ProfileForm({ initial, email }: { initial: ProfileValues; email: string }) {
  const [state, formAction] = useFormState<FormState, FormData>(updateProfile, null);
  const [saved, setSaved] = useState<ProfileValues>(initial); // snapshot terakhir yang tersimpan
  const [values, setValues] = useState<ProfileValues>(initial);
  const [lastValues, setLastValues] = useState<ProfileValues>(initial);

  // Setelah server menyatakan berhasil, anggap nilai saat ini sebagai yang tersimpan.
  useEffect(() => {
    if (state?.ok) setSaved(lastValues);
  }, [state, lastValues]);

  const dirty = (Object.keys(values) as (keyof ProfileValues)[]).some((k) => values[k] !== saved[k]);
  const set = (k: keyof ProfileValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: thisYear - 1919 }, (_, i) => String(thisYear - i));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

  return (
    <form action={formAction} onSubmit={() => setLastValues(values)}>
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
          <label htmlFor="full_name" className="label-field">Nama Lengkap</label>
          <input
            id="full_name"
            name="full_name"
            required
            maxLength={100}
            value={values.full_name}
            onChange={set("full_name")}
            className="input-field"
          />
          <p className="mt-1 text-xs text-ink/50">Nama lengkap Anda juga akan tampil sebagai nama profil.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
          <div>
            <label htmlFor="gender" className="label-field">Jenis Kelamin</label>
            <select id="gender" name="gender" value={values.gender} onChange={set("gender")} className="input-field">
              <option value="">Pilih</option>
              <option value="male">Laki-laki</option>
              <option value="female">Perempuan</option>
            </select>
          </div>
          <div>
            <span className="label-field">Tanggal Lahir</span>
            <div className="grid grid-cols-[1fr_1.6fr_1.2fr] gap-3">
              <select name="birth_day" aria-label="Tanggal" value={values.birth_day} onChange={set("birth_day")} className="input-field">
                <option value="">Tgl</option>
                {days.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select name="birth_month" aria-label="Bulan" value={values.birth_month} onChange={set("birth_month")} className="input-field">
                <option value="">Bulan</option>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <select name="birth_year" aria-label="Tahun" value={values.birth_year} onChange={set("birth_year")} className="input-field">
                <option value="">Tahun</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="city" className="label-field">Kota Domisili</label>
          <input
            id="city"
            name="city"
            maxLength={80}
            placeholder="Kota Domisili"
            value={values.city}
            onChange={set("city")}
            className="input-field"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="label-field">Nomor Telepon</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              placeholder="mis. 081234567890"
              value={values.phone}
              onChange={set("phone")}
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="email" className="label-field">Email</label>
            <input id="email" value={email} disabled className="input-field bg-forest-50/60 text-ink/60" />
            <p className="mt-1 text-xs text-ink/40">Email tidak dapat diubah.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-forest-100 px-6 py-4">
        <button
          type="button"
          disabled={!dirty}
          onClick={() => setValues(saved)}
          className="btn-secondary min-w-[110px] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Batal
        </button>
        <SubmitButton dirty={dirty} />
      </div>
    </form>
  );
}
