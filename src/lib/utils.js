/**
 * Small, dependency-free helpers.
 */

/** Short unique id with a readable prefix: 'e', 's', 'l'… */
export const uid = (prefix) => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** Triggers a browser download for a Blob or data URL. */
export function downloadFile(href, filename) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Builds a CSV (semicolon-separated for Spanish Excel) and downloads it. */
export function downloadCsv(header, rows, filename) {
  const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  const csv = '\ufeff' + [header, ...rows].map((r) => r.map(esc).join(';')).join('\n');
  downloadFile(URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })), filename);
}

/**
 * Reads an image file and returns a small JPEG data URL (DNI photos are stored
 * in low resolution to keep the database light).
 */
export function downscaleImage(file, maxPx, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
