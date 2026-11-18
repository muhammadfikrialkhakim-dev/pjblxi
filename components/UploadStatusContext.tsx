"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type UploadStatusContextValue = {
  isUploading: boolean;
  /** Dipanggil field upload gambar setiap kali status uploading-nya berubah. */
  setFieldUploading: (key: string, uploading: boolean) => void;
};

const UploadStatusContext = createContext<UploadStatusContextValue | null>(null);

/**
 * Melacak apakah ADA field upload gambar (cover, galeri, dst) yang masih
 * sedang mengunggah di dalam sebuah form. Dipakai supaya tombol "Simpan"
 * bisa dinonaktifkan selama proses upload berjalan.
 *
 * Kenapa ini perlu: setiap ImageUploadField/ImageGalleryUploadField
 * menyimpan URL hasil upload di hidden input HANYA setelah proses upload
 * ke Supabase Storage selesai (perlu waktu, tidak instan). Sebelumnya
 * tombol "Simpan" selalu bisa diklik kapan saja — kalau pengguna memilih
 * gambar baru lalu buru-buru klik "Simpan" sebelum upload selesai, form
 * terkirim membawa URL gambar yang LAMA (hidden input belum sempat
 * ter-update), sehingga setelah tersimpan gambar terlihat "balik lagi"
 * ke yang sebelumnya.
 */
export function UploadStatusProvider({ children }: { children: React.ReactNode }) {
  const [isUploading, setIsUploading] = useState(false);
  const uploadingKeys = useRef<Set<string>>(new Set());

  const setFieldUploading = useCallback((key: string, uploading: boolean) => {
    if (uploading) {
      uploadingKeys.current.add(key);
    } else {
      uploadingKeys.current.delete(key);
    }
    setIsUploading(uploadingKeys.current.size > 0);
  }, []);

  return (
    <UploadStatusContext.Provider value={{ isUploading, setFieldUploading }}>
      {children}
    </UploadStatusContext.Provider>
  );
}

/** Dipakai di dalam ImageUploadField/ImageGalleryUploadField untuk melaporkan statusnya. */
export function useReportUploadStatus() {
  const ctx = useContext(UploadStatusContext);
  return ctx?.setFieldUploading ?? (() => {});
}

/** Dipakai di tombol submit untuk tahu apakah masih ada upload yang berjalan. */
export function useIsAnyUploadInProgress() {
  const ctx = useContext(UploadStatusContext);
  return ctx?.isUploading ?? false;
}
