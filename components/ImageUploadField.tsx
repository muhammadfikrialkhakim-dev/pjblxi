"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useReportUploadStatus } from "@/components/UploadStatusContext";
import { getImageSize, lowResolutionWarning } from "@/lib/image-dimensions";

const BUCKET = "wisata-images";
const DEFAULT_MAX_SIZE_MB = 5;

function randomFileName(originalName: string) {
  const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const random = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${random}.${ext}`;
}

/**
 * Upload satu gambar ke Supabase Storage. Menampilkan preview, progress
 * sederhana, dan mengisi sebuah hidden input bernama `name` dengan URL
 * publik hasil upload — supaya bisa dikirim langsung lewat form Server
 * Action seperti field lain (tidak perlu ubah cara form action bekerja).
 */
export default function ImageUploadField({
  name,
  label,
  defaultValue,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  minWidth,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  /** Batas ukuran file. Naikkan untuk gambar besar supaya tidak perlu dikompres (dan jadi buram) dulu. */
  maxSizeMB?: number;
  /** Lebar minimal yang disarankan (px). Di bawah ini muncul peringatan "akan tampak buram"; upload tetap jalan. */
  minWidth?: number;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reportUploadStatus = useReportUploadStatus();

  async function handleFile(file: File) {
    setError(null);
    setWarning(null);

    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar (jpg, png, webp).");
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Ukuran gambar maksimal ${maxSizeMB}MB.`);
      return;
    }

    // Peringatan (tidak memblokir) kalau resolusinya terlalu kecil untuk dipajang lebar.
    if (minWidth) setWarning(lowResolutionWarning(file.name, await getImageSize(file), minWidth));

    setUploading(true);
    reportUploadStatus(name, true);
    const supabase = createClient();
    const path = randomFileName(file.name);

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    setUploading(false);

    if (uploadError) {
      setError(`Gagal mengunggah: ${uploadError.message}`);
      reportUploadStatus(name, false);
      return;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    setUrl(data.publicUrl);
    reportUploadStatus(name, false);
  }

  return (
    <div>
      <label className="label-field">{label}</label>
      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="group relative h-36 w-56 overflow-hidden rounded border border-forest-100">
          <Image src={url} alt="Preview" fill className="object-cover" />
          {/* Klik di mana pun pada gambar untuk langsung ganti dengan foto
              baru — sebelumnya area ini tidak bisa diklik sama sekali,
              jadi pengguna mengira mengganti gambar tidak berfungsi
              (padahal cuma tidak ada cara untuk memicu upload baru). */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/0 text-transparent transition-colors group-hover:bg-black/50 group-hover:text-white disabled:cursor-wait"
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-white" />
                <span className="text-xs text-white">Mengunggah...</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span className="text-xs font-medium">Klik untuk ganti gambar</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setUrl("");
            }}
            className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
            aria-label="Hapus gambar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-36 w-56 flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-forest-200 text-ink/50 transition-colors hover:border-forest-400 hover:text-forest-700 disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-xs">Mengunggah...</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              <span className="text-xs">Klik untuk unggah gambar</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      {warning && (
        <p role="status" className="mt-1.5 rounded border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">
          {warning}
        </p>
      )}
      <p className="mt-1.5 text-xs text-ink/40">
        JPG, PNG, atau WebP. Maks {maxSizeMB}MB.
        {minWidth ? ` Disarankan lebar minimal ${minWidth} px agar tetap tajam.` : ""}
      </p>
    </div>
  );
}
