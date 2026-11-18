"use client";

import { useState, useTransition } from "react";
import { Mail, Megaphone, AlertCircle } from "lucide-react";
import { setNotificationPref } from "@/app/profile/notifications/actions";

type Prefs = { notify_order_email: boolean; notify_promo_email: boolean };

const ROWS: { key: keyof Prefs; title: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  {
    key: "notify_order_email",
    title: "Email status pesanan",
    desc: "Konfirmasi pembayaran, pesanan kedaluwarsa atau dibatalkan, dan refund.",
    icon: Mail,
  },
  {
    key: "notify_promo_email",
    title: "Info promo & rekomendasi wisata",
    desc: "Kabar promo dan destinasi baru di Malang Raya.",
    icon: Megaphone,
  },
];

export default function NotificationSettings({ initial, email }: { initial: Prefs; email: string }) {
  const [prefs, setPrefs] = useState<Prefs>(initial);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [, start] = useTransition();

  function toggle(key: keyof Prefs) {
    const next = !prefs[key];
    setError(null);
    setPrefs((p) => ({ ...p, [key]: next })); // optimistic
    setSavingKey(key);
    start(async () => {
      const res = await setNotificationPref(key, next);
      if (!res?.ok) {
        setPrefs((p) => ({ ...p, [key]: !next })); // kembalikan
        setError(res?.message ?? "Gagal menyimpan.");
      }
      setSavingKey(null);
    });
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-forest-100 px-6 py-4">
        <h2 className="font-display text-lg font-semibold text-forest-900">Email</h2>
        <p className="text-xs text-ink/50">Notifikasi dikirim ke {email}</p>
      </div>

      {error && (
        <p role="alert" className="mx-6 mt-4 flex items-center gap-1.5 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      <ul className="divide-y divide-forest-100">
        {ROWS.map(({ key, title, desc, icon: Icon }) => (
          <li key={key} className="flex items-center gap-4 px-6 py-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-700">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-forest-900">{title}</p>
              <p className="text-xs text-ink/60">{desc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[key]}
              aria-label={title}
              disabled={savingKey === key}
              onClick={() => toggle(key)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
                prefs[key] ? "bg-clay-500" : "bg-forest-200"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  prefs[key] ? "translate-x-5" : ""
                }`}
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
