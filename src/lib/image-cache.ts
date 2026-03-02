/**
 * image-cache.ts
 *
 * Caché en memoria que actúa como capa sincrónica frente a IndexedDB.
 * Zustand v5 persist requiere storage sincrónico, pero IndexedDB es async.
 * Este módulo resuelve el problema:
 *
 *   - initImageCache(): carga TODAS las imágenes de IDB a memoria (llamar al inicio de la app)
 *   - cacheGet(key): lectura sincrónica desde el Map en memoria
 *   - cacheSet(key, value): escritura sincrónica al Map + async fire-and-forget a IDB
 *   - cacheClear(): limpia el Map + IDB
 *
 * Las imágenes originales nunca se comprimen: se guardan íntegras en IDB.
 */

import { idbGetAll, idbSet, idbClear } from './image-db';

const cache = new Map<string, string>();

/**
 * Pobla el caché en memoria con todas las imágenes almacenadas en IndexedDB.
 * Debe llamarse una sola vez al inicio de la app (antes de que Zustand rehidrate).
 * Llamadas subsecuentes son no-op.
 */
let _initPromise: Promise<void> | null = null;

export function initImageCache(): Promise<void> {
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const all = await idbGetAll();
    all.forEach((value, key) => cache.set(key, value));
    console.log(`[image-cache] Cargadas ${cache.size} imágenes desde IndexedDB`);
  })();

  return _initPromise;
}

/** Lectura sincrónica. Retorna null si la imagen no está en caché. */
export function cacheGet(key: string): string | null {
  return cache.get(key) ?? null;
}

/**
 * Escritura sincrónica al caché + escritura async a IndexedDB en segundo plano.
 * Las imágenes se guardan sin modificar (sin pérdida de calidad ni compresión).
 */
export function cacheSet(key: string, value: string): void {
  cache.set(key, value);
  idbSet(key, value).catch((err) =>
    console.error('[image-cache] Error escribiendo en IDB:', err)
  );
}

/** Limpia el caché en memoria y IndexedDB (al cerrar sesión o vaciar carrito). */
export function cacheClear(): void {
  cache.clear();
  idbClear().catch((err) =>
    console.error('[image-cache] Error limpiando IDB:', err)
  );
}
