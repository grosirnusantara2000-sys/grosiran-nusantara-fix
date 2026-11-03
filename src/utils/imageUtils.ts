/**
 * Utility for client-side image compression and safe fallbacks.
 * Enables direct file upload (file picker & drag-and-drop) for products
 * without needing an external upload server, by generating compact base64 strings
 * (typically 40KB - 80KB per image).
 */

export const DEFAULT_PRODUCT_IMAGE = '/assets/images/product_grosir_fashion_1793527996022.jpg';

export const PLACEHOLDER_PRODUCT_DATA_URL =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="%23f1f5f9"><rect width="400" height="300" fill="%23f1f5f9"/><g fill="%2394a3b8"><path d="M160 120a20 20 0 100-40 20 20 0 000 40z"/><path d="M100 220l50-60 40 40 50-70 60 90H100z"/></g><text x="200" y="255" font-family="sans-serif" font-size="14" font-weight="bold" fill="%2364748b" text-anchor="middle">GROSIR NUSANTARA</text></svg>';

/**
 * Compresses an image file client-side to keep Firestore documents lightweight.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file.type.startsWith('image/')) {
      reject(new Error('File yang dipilih bukan gambar'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memuat gambar'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio scale
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            maxHeight = height;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Fill background white for transparent PNGs converted to JPEG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to lightweight JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses multiple files in parallel
 */
export async function compressMultipleImageFiles(
  files: FileList | File[]
): Promise<string[]> {
  const fileArray = Array.from(files);
  const promises = fileArray.map((f) => compressImageFile(f));
  return Promise.all(promises);
}

/**
 * Returns safe image url with automatic fallback
 */
export function getSafeImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return DEFAULT_PRODUCT_IMAGE;
  }
  const clean = url.trim();
  // Normalize internal /src/assets paths to public /assets
  if (clean.startsWith('/src/assets/')) {
    return clean.replace('/src/assets/', '/assets/');
  }
  return clean;
}
