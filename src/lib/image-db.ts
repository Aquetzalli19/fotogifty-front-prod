/**
 * image-db.ts
 *
 * Wrapper mínimo sobre IndexedDB para almacenar imágenes en base64.
 * IndexedDB soporta cientos de MB (vs ~5-10 MB de localStorage), por lo que
 * es el lugar correcto para datos de imagen grandes.
 *
 * API: idbSet / idbGet / idbClear
 * Todas las funciones son async y seguras en SSR (guard typeof window).
 */

const DB_NAME = 'fotogifty-image-db';
const STORE_NAME = 'images';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/** Guarda un data URL en IndexedDB bajo la clave dada. Idempotente. */
export async function idbSet(key: string, value: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(value, key);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
}

/** Lee un data URL de IndexedDB. Retorna null si la clave no existe. */
export async function idbGet(key: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve((req.result as string | undefined) ?? null);
  });
}

/** Elimina todas las imágenes almacenadas (usar al cerrar sesión o limpiar carrito). */
export async function idbClear(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('[image-db] idbClear error:', error);
  }
}

/** Carga todas las entradas de IndexedDB (para poblar el caché en memoria al inicio). */
export async function idbGetAll(): Promise<Map<string, string>> {
  if (typeof window === 'undefined') return new Map();
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const result = new Map<string, string>();
      const req = store.openCursor();
      req.onerror = () => reject(req.error);
      req.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          result.set(cursor.key as string, cursor.value as string);
          cursor.continue();
        } else {
          resolve(result);
        }
      };
    });
  } catch (error) {
    console.error('[image-db] idbGetAll error:', error);
    return new Map();
  }
}
