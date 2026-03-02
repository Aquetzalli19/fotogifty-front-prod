# Plan de Trabajo Frontend — Gestión de Almacenamiento de Imágenes

## Estado actual

La implementación de Fase 1 está **completa y en producción** (build limpio).

---

## Fase 1 — COMPLETADA ✅

### Objetivo
Resolver `QuotaExceededError` sin comprometer calidad de imagen.

### Qué se implementó

| Tarea | Archivo | Estado |
|---|---|---|
| Wrapper IndexedDB | `src/lib/image-db.ts` | ✅ Completo |
| Caché en memoria sincrónico | `src/lib/image-cache.ts` | ✅ Completo |
| Adaptador Zustand v5 storage | `src/lib/customization-storage.ts` | ✅ Completo |
| Integrar caché en customization-store | `src/stores/customization-store.ts` | ✅ Completo |
| Inicialización en AuthProvider | `src/providers/AuthProvider.tsx` | ✅ Completo |

### Cómo funciona (resumen)

```
Foto original del usuario
  → cacheSet(hash, dataUrl)           // sincrónico al Map en memoria
  → idbSet(hash, dataUrl) [async]     // fire-and-forget a IndexedDB
  → localStorage: "__idb__:hash"      // solo la referencia, no la imagen

Al recargar:
  → initImageCache()                  // IDB → Map (async, en AuthProvider)
  → rehydrate()                       // localStorage → Zustand (resuelve refs desde Map)
  → Estado Zustand tiene data URLs completas
```

**Resultado:** localStorage permanece < 1 MB aunque el usuario tenga 12 fotos de 5 MB cada una.

---

## Fase 2 — PENDIENTE (sin backend S3)

### Objetivo
Corregir envío de base64 al backend y añadir robustez al sistema.

> **Prerequisito:** El backend debe implementar al menos la Estrategia A del documento
> `docs/STORAGE_BACKEND_SPEC.md` (aumento del límite del body parser).

---

### Tarea 2.1 — Strip de imageSrc antes de sincronizar con backend

**Prioridad:** Alta
**Estimado:** 2–3 horas
**Archivo:** `src/services/temp-cart.ts`

**Problema:** `guardarCustomizacionTemporal()` envía `imageSrc` (base64, potencialmente 50 MB)
al backend. El backend no necesita las imágenes originales; solo necesita los metadatos
(transformaciones, efectos, filtros) para reconstruir la vista del carrito.

**Implementación:**

```typescript
// src/services/temp-cart.ts

/** Elimina los campos de imagen binaria del objeto data antes de enviar al backend */
function stripImageFields(data: Record<string, unknown>): Record<string, unknown> {
  const IMAGE_FIELDS = ['imageSrc', 'imageSrc2', 'renderedImageSrc',
                        'croppedPhotoSrc', 'thumbnailDataUrl'];

  function strip(obj: unknown): unknown {
    if (Array.isArray(obj)) return obj.map(strip);
    if (obj !== null && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj as Record<string, unknown>)
          .filter(([key]) => !IMAGE_FIELDS.includes(key))
          .map(([key, val]) => [key, strip(val)])
      );
    }
    return obj;
  }
  return strip(data) as Record<string, unknown>;
}

export async function guardarCustomizacionTemporal(
  cartItemId: string,
  instanceIndex: number,
  editorType: 'standard' | 'calendar' | 'polaroid',
  data: Record<string, unknown>,
  completed: boolean
): Promise<ApiResponse<void>> {
  try {
    const response = await apiClient.put<void>(
      `/customizations/temp/${cartItemId}/${instanceIndex}`,
      { editorType, data: stripImageFields(data), completed }  // ← solo metadatos
    );
    return response;
  } catch (error) {
    console.error('Error guardando customización:', error);
    return { success: false, message: 'Error al guardar customización' };
  }
}
```

**Impacto:** Payload de 50 MB → < 5 KB. Sin cambios visibles para el usuario.

**Consideración importante:** Al cargar desde el backend (`loadFromBackend()`), los campos
`imageSrc` ya no vendrán en la respuesta. Las imágenes estarán únicamente en el
IndexedDB local del dispositivo. Si el usuario cambia de dispositivo, verá las
customizaciones sin fotos (solo los metadatos). Esto es aceptable en el flujo actual
porque el checkout ocurre en el mismo dispositivo donde se editó.

---

### Tarea 2.2 — Limpieza de IDB al reemplazar imágenes

**Prioridad:** Media
**Estimado:** 3–4 horas
**Archivos:** `src/lib/image-cache.ts`, `src/lib/image-db.ts`, `src/lib/customization-storage.ts`

**Problema:** Cuando el usuario reemplaza una foto con otra, la imagen antigua queda
en IndexedDB indefinidamente. Con uso intensivo, el IDB puede acumular cientos de MB
de imágenes huérfanas.

**Implementación — Garbage Collection reactivo:**

```typescript
// src/lib/image-cache.ts — agregar función de GC

/**
 * Elimina del caché e IDB todas las claves que no están referenciadas
 * en el conjunto de claves activas proporcionado.
 */
export async function collectGarbage(activeKeys: Set<string>): Promise<void> {
  const toDelete: string[] = [];
  for (const key of cache.keys()) {
    if (!activeKeys.has(key)) {
      toDelete.push(key);
    }
  }
  for (const key of toDelete) {
    cache.delete(key);
    await idbDelete(key); // nueva función en image-db.ts
  }
  if (toDelete.length > 0) {
    console.log(`[image-cache] GC: eliminadas ${toDelete.length} imágenes huérfanas`);
  }
}
```

```typescript
// src/lib/image-db.ts — agregar idbDelete
export async function idbDelete(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(key);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
}
```

**Dónde llamar al GC:**

```typescript
// src/stores/customization-store.ts — en saveCustomization o como acción separada

// Función helper que extrae todas las claves IDB activas del estado actual
function extractActiveIdbKeys(customizations: Customization[]): Set<string> {
  const keys = new Set<string>();
  const IDB_PREFIX = '__idb__:';
  // Recorrer el localStorage parseado y extraer hashes
  // (o directamente del caché actual)
  for (const [key] of cache.entries()) {
    // Verificar si alguna customización activa referencia esta key
    // Esta lógica puede implementarse leyendo el localStorage directamente
  }
  return keys;
}
```

> **Nota:** La implementación completa del GC requiere coordinar entre
> `customization-storage.ts` (que conoce las referencias IDB en localStorage)
> y el store. Se puede simplificar ejecutando el GC solo en `clearAll()` con
> todas las claves del IDB, o periódicamente al inicio de la app.

---

### Tarea 2.3 — Monitoreo de cuota de almacenamiento

**Prioridad:** Media
**Estimado:** 2 horas
**Archivo:** nuevo `src/lib/storage-quota.ts`

**Objetivo:** Alertar al usuario antes de alcanzar el límite del IDB.

```typescript
// src/lib/storage-quota.ts

export interface StorageQuotaInfo {
  usedMB: number;
  quotaMB: number;
  percentUsed: number;
  isLow: boolean; // true si queda < 10% disponible
}

export async function getStorageQuota(): Promise<StorageQuotaInfo | null> {
  if (!navigator?.storage?.estimate) return null;
  try {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    const usedMB = Math.round(usage / 1024 / 1024);
    const quotaMB = Math.round(quota / 1024 / 1024);
    const percentUsed = quota > 0 ? Math.round((usage / quota) * 100) : 0;
    return { usedMB, quotaMB, percentUsed, isLow: percentUsed > 90 };
  } catch {
    return null;
  }
}
```

**Uso sugerido:** Mostrar advertencia en el editor si `isLow: true` antes de permitir
cargar más fotos.

---

### Tarea 2.4 — Fallback cuando IDB no está disponible

**Prioridad:** Media
**Estimado:** 2 horas
**Archivos:** `src/lib/image-cache.ts`, `src/lib/customization-storage.ts`

**Casos donde IDB puede fallar:**
- Safari en modo privado (bloquea IndexedDB)
- Firefox con política de almacenamiento estricta
- Dispositivos con almacenamiento lleno

**Implementación:**

```typescript
// src/lib/image-db.ts — detectar disponibilidad

let idbAvailable: boolean | null = null;

export async function isIdbAvailable(): Promise<boolean> {
  if (idbAvailable !== null) return idbAvailable;
  try {
    await openDB();
    idbAvailable = true;
  } catch {
    idbAvailable = false;
    console.warn('[image-db] IndexedDB no disponible — usando fallback localStorage');
  }
  return idbAvailable;
}
```

```typescript
// src/lib/customization-storage.ts — fallback a base64 directo en localStorage
// Si IDB no está disponible, guardar la imagen directamente en localStorage
// (puede causar QuotaExceeded en calendarios grandes, pero soporta casos simples)
```

---

## Fase 3 — PENDIENTE (con backend S3 — Estrategia B)

> **Prerequisito:** Backend implementa endpoints de `STORAGE_BACKEND_SPEC.md` Estrategia B.

### Objetivo
Eliminar completamente el uso de base64 en tráfico de red y en el estado persistido.
Las imágenes viven en S3 y se referencian por URL.

---

### Tarea 3.1 — Upload directo a S3 al seleccionar imagen

**Prioridad:** Alta (en el contexto de Fase 3)
**Estimado:** 3–4 horas
**Archivos:** nuevo `src/lib/s3-upload.ts`, editores (`StandardEditor`, `CalendarEditor`, `PolaroidEditor`)

```typescript
// src/lib/s3-upload.ts

export async function uploadImageToS3(file: File): Promise<string> {
  // 1. Solicitar presigned URL al backend
  const presignedRes = await apiClient.post<{
    uploadUrl: string;
    publicUrl: string;
  }>('/images/temp/presigned-url', {
    filename: file.name,
    contentType: file.type,
    sizeBytes: file.size,
  });

  if (!presignedRes.success || !presignedRes.data) {
    throw new Error('No se pudo obtener URL de subida');
  }

  const { uploadUrl, publicUrl } = presignedRes.data;

  // 2. Subir archivo directamente a S3
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error(`Error subiendo a S3: ${uploadRes.status}`);
  }

  // 3. Retornar URL pública de S3
  return publicUrl;
}
```

**Cambio en editores:** Al seleccionar una foto (`<input type="file">`), antes de
guardar en el store, llamar a `uploadImageToS3(file)` y guardar la URL de S3
en lugar del data URL base64.

**Impacto en image-cache.ts:** En Fase 3, `imageSrc` ya no sería un data URL
sino una URL de S3. El caché IDB dejaría de ser necesario para `imageSrc`.
El canvas editor carga las imágenes via `<img src="...">` con URL de S3.

---

### Tarea 3.2 — Renderizar canvas desde URL de S3

**Prioridad:** Alta (en el contexto de Fase 3)
**Estimado:** 2 horas
**Archivos:** `src/lib/canvas-operations.ts`, editores

```typescript
// canvas-operations.ts — ya soporta URLs (no solo data URLs)
// Verificar que drawImage() con URL de S3 funcione correctamente
// Posible issue: CORS headers en el bucket S3 para el dominio del frontend
```

**Requisito S3:** El bucket debe tener política CORS que permita `GET` desde el dominio
del frontend (además del `PUT` para upload).

---

### Tarea 3.3 — Eliminar image-cache.ts e image-db.ts (depreciación)

**Prioridad:** Baja (cleanup post-Fase 3)
**Estimado:** 1 hora

Una vez que `imageSrc` es una URL de S3 (no base64), los archivos de caché/IDB
ya no son necesarios. El adaptador `customization-storage.ts` puede simplificarse
a usar localStorage directamente (los payloads serán pequeños: solo URLs y metadatos).

---

## Resumen de prioridades

| Fase | Tarea | Prioridad | Estimado | Prerequisito backend |
|---|---|---|---|---|
| **2** | 2.1 Strip imageSrc antes de sync | 🔴 Alta | 2–3 h | Estrategia A o B |
| **2** | 2.2 Garbage collection IDB | 🟡 Media | 3–4 h | Ninguno |
| **2** | 2.3 Monitoreo de cuota | 🟡 Media | 2 h | Ninguno |
| **2** | 2.4 Fallback IDB no disponible | 🟡 Media | 2 h | Ninguno |
| **3** | 3.1 Upload directo a S3 | 🟢 Media | 3–4 h | Estrategia B |
| **3** | 3.2 Canvas desde URL S3 | 🟢 Media | 2 h | Estrategia B |
| **3** | 3.3 Depreciación IDB | ⚪ Baja | 1 h | Estrategia B + 3.1 + 3.2 |

**Total Fase 2:** ~9–11 horas
**Total Fase 3:** ~6–7 horas (adicionales, con backend listo)

---

## Decisión de arquitectura — imagen local vs. S3

| Escenario | Fase 1+2 (IDB local) | Fase 3 (S3) |
|---|---|---|
| Usuario edita y compra en el mismo dispositivo | ✅ Funciona | ✅ Funciona |
| Usuario edita en móvil, paga en PC | ❌ Imágenes no disponibles | ✅ Funciona |
| Sin conexión a internet | ✅ Funciona (IDB local) | ❌ No funciona |
| Calidad de imagen | Sin pérdida | Sin pérdida |
| Costo adicional | $0 | Mínimo (S3 Standard) |
| Complejidad | Baja | Media |

Para el flujo típico de FotoGifty (edit → cart → checkout en una sesión), **Fase 2 es suficiente**.
Fase 3 agrega valor principalmente para usuarios que cambian de dispositivo entre sesiones.
