"use client";

import { swalConfirm, type SwalIcon } from "@/lib/swal";

/**
 * Tombol submit yang meminta konfirmasi lewat dialog (bergaya SweetAlert)
 * sebelum form dikirim — mis. sebelum menghapus. Kalau dibatalkan, form
 * tidak dikirim.
 */
export default function ConfirmSubmitButton({
  message,
  dialogTitle = "Apakah Anda yakin?",
  confirmText = "Ya, hapus",
  cancelText = "Batal",
  icon = "warning",
  danger = true,
  className,
  title,
  children,
}: {
  /** Isi pesan di dialog. */
  message: string;
  dialogTitle?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: SwalIcon;
  danger?: boolean;
  className?: string;
  /** Tooltip tombol. */
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      title={title}
      className={className}
      onClick={async (e) => {
        const form = e.currentTarget.form;
        e.preventDefault();
        if (!form) return;
        const ok = await swalConfirm({ title: dialogTitle, text: message, confirmText, cancelText, icon, danger });
        if (ok) form.requestSubmit();
      }}
    >
      {children}
    </button>
  );
}
