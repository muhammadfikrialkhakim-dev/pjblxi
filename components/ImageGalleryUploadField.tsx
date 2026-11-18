"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useReportUploadStatus } from "@/components/UploadStatusContext";
import { getImageSize, lowResolutionWarning } from "@/lib/image-dimensions";

const BUCKET = "wisata-images";
const DEFAULT_MAX_SIZE_MB = 5;
const MAX_IMAGES = 6;

function randomFileName(originalName: string) {
  const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const random = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${random}.${ext}`;
}

/**
 * Upload beberapa gambar untuk galeri sebuah wisata. URL hasil upload
 * dikirim lewat hidden input `name` sebagai string dipisah koma, supaya
 * server action bisa memprosesnya jadi array (`gallery_urls`).
 */
export default function ImageGalleryUploadField({
  name,
  label,
  defaultValue,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  minWidth,
}: {
  name: string;
  label: string;
  defaultValue?: string[] | null;
  /** Batas ukuran per file. Naikkan untuk gambar besar supaya tidak perlu dikompres (dan jadi buram) dulu. */
  maxSizeMB?: number;
  /** Lebar minimal yang disarankan (px). Di bawah ini muncul peringatan "akan tampak buram"; upload tetap jalan. */
  minWidth?: number;
}) {
  const [urls, setUrls] = useState<string[]>(defaultValue ?? []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const reportUploadStatus = useReportUploadStatus();

  async function handleFiles(files: FileList) {
    setError(null);
    setWarnings([]);
    const remaining = MAX_IMAGES - urls.length;

    if (remaining <= 0) {
      setError(`Maksimal ${MAX_IMAGES} gambar galeri.`);
      return;
    }

    const supabase = createClient();
    setUploading(true);
    reportUploadStatus(name, true);

    const uploaded: string[] = [];
    const lowRes: string[] = [];
    for (const file of Array.from(files).slice(0, remaining)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`"${file.name}" melebihi ${maxSizeMB}MB, dilewati.`);
        continue;
      }

      // Peringatan (tidak memblokir) kalau resolusinya terlalu kecil untuk dipajang lebar.
      if (minWidth) {
        const warn = lowResolutionWarning(file.name, await getImageSize(file), minWidth);
        if (warn) lowRes.push(warn);
      }

      const path = randomFileName(file.name);
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (uploadError) {
        setError(`Gagal mengunggah "${file.name}": ${uploadError.message}`);
        continue;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }

    setUrls((prev) => [...prev, ...uploaded]);
    setWarnings(lowRes);
    setUploading(false);
    reportUploadStatus(name, false);
  }

  function removeAt(index: number) {
    setUrls((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div>
      <label className="label-field">{label}</label>
      <input type="hidden" name={name} value={urls.join(",")} />

      <div className="flex flex-wrap gap-3">
        {urls.map((url, i) => (
          <div key={url} className="relative h-24 w-32 overflow-hidden rounded border border-forest-100">
            <Image src={url} alt={`Galeri ${i + 1}`} fill className="object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              aria-label="Hapus gambar"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {urls.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-24 w-32 flex-col items-center justify-center gap-1 rounded border-2 border-dashed border-forest-200 text-ink/50 transition-colors hover:border-forest-400 hover:text-forest-700 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span className="text-[11px]">{uploading ? "Mengunggah..." : "Tambah"}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      {warnings.map((w) => (
        <p key={w} role="status" className="mt-1.5 rounded border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">
          {w}
        </p>
      ))}
      <p className="mt-1.5 text-xs text-ink/40">
        Sampai {MAX_IMAGES} gambar, maks {maxSizeMB}MB masing-masing.
        {minWidth ? ` Disarankan lebar minimal ${minWidth} px agar tetap tajam.` : ""}
      </p>
    </div>
  );
}
