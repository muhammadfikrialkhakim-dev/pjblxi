"use client";

import { useEffect, useState } from "react";
import { Cake, Ruler, Scale, Info, X, UserCheck } from "lucide-react";

import type { PageStrings } from "@/lib/i18n/pages";

type Props = {
  labels: PageStrings["recommendation"];
  wisataName: string;
  minAge: number | null;
  maxAge: number | null;
  minHeight: number | null;
  maxHeight: number | null;
  minWeight: number | null;
  maxWeight: number | null;
  notes: string | null;
};

function formatRange(
  min: number | null,
  max: number | null,
  unit: string,
  labels: PageStrings["recommendation"]
): string | null {
  if (min != null && max != null) return `${min} - ${max} ${unit}`;
  if (min != null) return labels.min(`${min} ${unit}`);
  if (max != null) return labels.max(`${max} ${unit}`);
  return null;
}

export default function RecommendationModal(props: Props) {
  const [open, setOpen] = useState(false);

  const t = props.labels;
  const rows = [
    { icon: Cake, label: t.age, value: formatRange(props.minAge, props.maxAge, t.years, t) },
    { icon: Ruler, label: t.height, value: formatRange(props.minHeight, props.maxHeight, "cm", t) },
    { icon: Scale, label: t.weight, value: formatRange(props.minWeight, props.maxWeight, "kg", t) },
  ].filter((r) => r.value);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!rows.length && !props.notes) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-5 flex w-full items-center justify-between gap-3 rounded-lg border border-forest-200 bg-forest-50 px-4 py-3 text-left text-sm font-medium text-forest-900 transition-colors hover:bg-forest-100"
      >
        <span className="flex items-center gap-2.5">
          <UserCheck className="h-5 w-5 text-forest-600" /> {t.button}
        </span>
        <span className="text-xs font-normal text-clay-600">{t.view}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="rekomendasi-title"
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="rekomendasi-title" className="font-display text-lg font-semibold text-forest-900">
                  {t.title}
                </h3>
                <p className="mt-0.5 text-xs text-ink/50">{props.wisataName}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.close}
                className="rounded-full p-1 text-ink/50 hover:bg-forest-50 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!!rows.length && (
              <div className="mt-4 space-y-3">
                {rows.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 rounded-lg border border-forest-100 p-3">
                    <Icon className="h-5 w-5 shrink-0 text-forest-600" />
                    <div>
                      <p className="text-xs text-ink/50">{label}</p>
                      <p className="text-sm font-medium text-forest-900">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {props.notes && (
              <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-clay-200 bg-clay-50 p-3 text-sm text-ink/80">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-clay-600" />
                <p className="whitespace-pre-line">{props.notes}</p>
              </div>
            )}

            <button type="button" onClick={() => setOpen(false)} className="btn-primary mt-5 w-full">
              {t.understood}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
