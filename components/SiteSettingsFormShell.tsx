"use client";

import { UploadStatusProvider, useIsAnyUploadInProgress } from "@/components/UploadStatusContext";

function SubmitButton() {
  // Tombol dinonaktifkan selama ada gambar yang masih diunggah, supaya form
  // tidak terkirim membawa daftar gambar lama (lihat UploadStatusContext).
  const isUploading = useIsAnyUploadInProgress();
  return (
    <button type="submit" disabled={isUploading} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60">
      {isUploading ? "Menunggu gambar selesai diunggah..." : "Simpan Pengaturan"}
    </button>
  );
}

export default function SiteSettingsFormShell({
  action,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <UploadStatusProvider>
      <form action={action} className="card mt-6 max-w-2xl space-y-5 p-6">
        {children}
        <SubmitButton />
      </form>
    </UploadStatusProvider>
  );
}
