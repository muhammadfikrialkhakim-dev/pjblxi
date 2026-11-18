/**
 * Ukuran piksel asli sebuah file gambar (di browser). Null kalau tidak bisa
 * dibaca — pemanggil sebaiknya diam saja (pemeriksaan ini hanya peringatan).
 */
export async function getImageSize(file: File): Promise<{ width: number; height: number } | null> {
  try {
    if (typeof createImageBitmap === "function") {
      const bmp = await createImageBitmap(file);
      const size = { width: bmp.width, height: bmp.height };
      bmp.close?.();
      return size;
    }
  } catch {
    // jatuh ke cara di bawah
  }
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/** Pesan peringatan kalau lebar gambar kurang dari yang disarankan; null kalau sudah cukup. */
export function lowResolutionWarning(fileName: string, size: { width: number; height: number } | null, minWidth?: number) {
  if (!minWidth || !size || size.width >= minWidth) return null;
  return `“${fileName}” hanya ${size.width}×${size.height} px, jadi akan tampak buram saat dibentangkan di layar lebar. Disarankan lebar minimal ${minWidth} px.`;
}
