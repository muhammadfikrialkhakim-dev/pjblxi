"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Plus, Pencil, Trash2, UserRound, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { saveVisitor, deleteVisitor } from "@/app/profile/visitors/actions";
import type { FormState } from "@/app/profile/actions";

export type Visitor = { id: string; full_name: string; phone: string | null };

function SaveButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary min-w-[110px]">
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {editing ? "Simpan" : "Tambah"}
    </button>
  );
}

export default function VisitorManager({ visitors, max }: { visitors: Visitor[]; max: number }) {
  const [state, formAction] = useFormState<FormState, FormData>(saveVisitor, null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Visitor | null>(null);
  const [notice, setNotice] = useState<FormState>(null);
  const [ignored, setIgnored] = useState<FormState>(null); // error lama yang tidak perlu ditampilkan lagi
  const [pendingDelete, startDelete] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Tutup form setelah berhasil menyimpan.
  useEffect(() => {
    if (state?.ok) {
      setFormOpen(false);
      setEditing(null);
      setNotice(state);
    }
  }, [state]);

  function openAdd() {
    setIgnored(state);
    setEditing(null);
    setNotice(null);
    setFormOpen(true);
  }
  function openEdit(v: Visitor) {
    setIgnored(state);
    setEditing(v);
    setNotice(null);
    setFormOpen(true);
  }
  function remove(v: Visitor) {
    if (!confirm(`Hapus data "${v.full_name}"?`)) return;
    setDeletingId(v.id);
    startDelete(async () => {
      const res = await deleteVisitor(v.id);
      setNotice(res);
      setDeletingId(null);
    });
  }

  const full = visitors.length >= max;

  return (
    <div>
      {notice && (
        <div
          role="status"
          className={`mb-4 flex items-start gap-2 rounded-lg px-3.5 py-2.5 text-sm ${
            notice.ok ? "bg-forest-50 text-forest-800" : "bg-red-50 text-red-700"
          }`}
        >
          {notice.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          {notice.message}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-forest-100 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-forest-900">Daftar Pengunjung</h2>
            <p className="text-xs text-ink/50">{visitors.length} dari {max} tersimpan</p>
          </div>
          <button type="button" onClick={openAdd} disabled={full || formOpen} className="btn-primary">
            <Plus className="h-4 w-4" /> Tambah
          </button>
        </div>

        {formOpen && (
          <form action={formAction} className="space-y-4 border-b border-forest-100 bg-forest-50/40 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-forest-900">{editing ? "Ubah Data Pengunjung" : "Pengunjung Baru"}</h3>
              <button type="button" onClick={() => setFormOpen(false)} aria-label="Tutup form" className="text-ink/50 hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>
            {state && !state.ok && state !== ignored && (
              <p className="flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" /> {state.message}
              </p>
            )}
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-field">Nama Lengkap</label>
                <input name="full_name" required maxLength={100} defaultValue={editing?.full_name ?? ""} className="input-field" placeholder="Nama sesuai identitas" />
              </div>
              <div>
                <label className="label-field">Nomor Telepon (opsional)</label>
                <input name="phone" type="tel" inputMode="tel" defaultValue={editing?.phone ?? ""} className="input-field" placeholder="08xxxxxxxxxx" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary min-w-[110px]">Batal</button>
              <SaveButton editing={!!editing} />
            </div>
          </form>
        )}

        <ul className="divide-y divide-forest-100">
          {visitors.map((v) => (
            <li key={v.id} className="flex items-center gap-4 px-6 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-700">
                <UserRound className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-forest-900">{v.full_name}</p>
                <p className="text-xs text-ink/60">{v.phone || "Tanpa nomor telepon"}</p>
              </div>
              <button type="button" onClick={() => openEdit(v)} aria-label={`Ubah ${v.full_name}`} className="rounded p-2 text-forest-700 hover:bg-forest-50">
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => remove(v)}
                disabled={pendingDelete && deletingId === v.id}
                aria-label={`Hapus ${v.full_name}`}
                className="rounded p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {pendingDelete && deletingId === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </li>
          ))}
          {visitors.length === 0 && !formOpen && (
            <li className="px-6 py-12 text-center text-sm text-ink/60">
              Belum ada data tersimpan. Tambahkan data pengunjung agar form pemesanan terisi otomatis.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
