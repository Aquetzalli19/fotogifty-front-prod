/**
 * customization-storage.ts
 *
 * Adaptador de storage para Zustand v5 persist (Estrategia B).
 *
 * Con Estrategia B, imageSrc es una URL de S3 (~100 bytes), NO un data URL base64.
 * Por eso localStorage ya no se satura y este adaptador es mucho más simple:
 * solo descarta los campos que nunca deben persistirse (renderizados on-demand).
 *
 * Campos que NUNCA se persisten (se regeneran en demanda):
 *   renderedImageSrc, croppedPhotoSrc, thumbnailDataUrl
 */

/** Campos que se descartan al persistir (se regeneran en runtime) */
const STRIP_FIELDS = new Set(['renderedImageSrc', 'croppedPhotoSrc', 'thumbnailDataUrl']);

function stripNonPersistable(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map((item) => stripNonPersistable(item));
  }

  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (STRIP_FIELDS.has(key)) continue;
      result[key] = stripNonPersistable(value);
    }
    return result;
  }

  return obj;
}

/**
 * StateStorage sincrónico compatible con Zustand v5 persist + createJSONStorage.
 * imageSrc es una URL de S3 — pequeña, segura para localStorage.
 */
export const customizationStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(name);
  },

  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      const parsed = JSON.parse(value) as unknown;
      const cleaned = stripNonPersistable(parsed);
      localStorage.setItem(name, JSON.stringify(cleaned));
    } catch (error) {
      console.error('[customizationStorage] setItem error:', error);
    }
  },

  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
  },
};
