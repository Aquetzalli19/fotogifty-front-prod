/**
 * Carga una imagen de forma segura para canvas.
 *
 * El problema: si el navegador tiene una imagen S3 cacheada SIN headers CORS
 * (de una petición anterior sin crossOrigin), usará esa versión aunque ahora
 * se solicite con crossOrigin='anonymous'. Esto "mancha" el canvas y hace que
 * toDataURL() lance SecurityError: Tainted canvases may not be exported.
 *
 * La solución: usar fetch() con cache:'no-cache' para forzar una petición fresca
 * con headers CORS, luego convertir el blob a un blob URL (same-origin).
 * Un canvas con imágenes same-origin nunca es tainted.
 */
export function loadCorsImage(src: string): Promise<HTMLImageElement> {
  // Data URLs y blob URLs son same-origin, no necesitan tratamiento especial
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Error cargando imagen local'));
      img.src = src;
    });
  }

  // HTTP/HTTPS: fetch con cache bypass para garantizar headers CORS frescos
  return fetch(src, { mode: 'cors', cache: 'no-cache' })
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.blob();
    })
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Error cargando imagen desde blob'));
        img.src = blobUrl;
      });
    })
    .catch(() => {
      // Fallback: intento directo con crossOrigin (puede fallar si el caché está contaminado)
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Error cargando imagen'));
        img.src = src;
      });
    });
}
