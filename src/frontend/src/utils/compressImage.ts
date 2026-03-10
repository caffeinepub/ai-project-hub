/**
 * Resize and compress a base64 data URL image to a max dimension and JPEG quality.
 * Returns a new data URL. If anything fails, returns the original.
 */
export async function compressImageDataUrl(
  dataUrl: string,
  maxDimension = 512,
  quality = 0.7,
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        const scale = Math.min(1, maxDimension / Math.max(width, height));
        const w = Math.round(width * scale);
        const h = Math.round(height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch {
      resolve(dataUrl);
    }
  });
}
