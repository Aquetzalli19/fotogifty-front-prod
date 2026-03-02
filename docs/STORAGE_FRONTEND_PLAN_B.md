# Plan de Trabajo Frontend — Estrategia B (Imágenes en S3)

## Por qué esto elimina el QuotaExceededError para siempre

Con la implementación actual, `imageSrc` guarda el data URL completo en base64.
Con Estrategia B, `imageSrc` guardará una URL de S3:

```
HOY:    imageSrc = "data:image/jpeg;base64,/9j/4AAQ..." (5 MB por foto)
CON B:  imageSrc = "https://fotogifty-temp.s3.amazonaws.com/temp/u123/img.jpg" (100 bytes)
```

1,000 fotos × 100 bytes = 100 KB en localStorage → **QuotaExceededError imposible**.

---

## Prerequisitos (Backend debe entregar primero)

- [ ] `POST /api/images/temp/presigned-url` implementado (ver `STORAGE_BACKEND_SPEC.md`)
- [ ] Bucket S3 con CORS habilitado para `PUT` y `GET` desde el dominio del frontend
- [ ] Confirmar URL base del bucket (ej: `https://fotogifty-temp.s3.amazonaws.com`)

---

## Mapa de archivos afectados

```
NUEVOS:
  src/lib/s3-upload.ts                          ← utilidad de upload a S3

MODIFICADOS:
  src/components/editor-components/
    CalendarEditor.tsx   línea 603              ← handleImageUpload
    PolaroidEditor.tsx   línea 375              ← handleImageUpload
  src/app/user/editor/
    StandardEditor.tsx   línea 948              ← onChange inline del input

  src/lib/customization-storage.ts              ← simplificar (IDB ya no necesario)
  src/providers/AuthProvider.tsx                ← eliminar initImageCache
  src/stores/customization-store.ts             ← eliminar cacheClear
  src/services/temp-cart.ts                     ← strip de imageSrc en sync

DEPRECADOS (borrar cuando B esté estable en prod):
  src/lib/image-db.ts
  src/lib/image-cache.ts
```

---

## TAREA 1 — Crear `src/lib/s3-upload.ts`

**Estimado:** 2 horas | **Dependencia:** ninguna (puede hacerse antes que el backend)

Este archivo centraliza toda la lógica de upload. Los editores solo llaman
`uploadImageToS3(file)` y reciben una URL.

```typescript
// src/lib/s3-upload.ts

import { apiClient } from './api-client';

interface PresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  s3Key: string;
}

/**
 * Convierte un data URL base64 a Blob (sin dependencias externas).
 * Se usa para convertir la imagen comprimida antes de subir a S3.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64Data] = dataUrl.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const bytes = atob(base64Data);
  const array = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    array[i] = bytes.charCodeAt(i);
  }
  return new Blob([array], { type: mimeType });
}

/**
 * Sube una imagen a S3 usando presigned URL.
 *
 * Flujo:
 *   1. Solicitar presigned URL al backend
 *   2. Subir directamente a S3 (no pasa por el servidor)
 *   3. Retornar URL pública de S3
 *
 * @param compressedDataUrl - Data URL base64 de la imagen ya comprimida
 * @param mimeType - Tipo MIME (default: image/jpeg)
 * @returns URL pública de S3
 */
export async function uploadImageToS3(
  compressedDataUrl: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  const blob = dataUrlToBlob(compressedDataUrl);

  // 1. Solicitar presigned URL al backend
  const presignedRes = await apiClient.post<PresignedUrlResponse>(
    '/images/temp/presigned-url',
    {
      contentType: mimeType,
      sizeBytes: blob.size,
    }
  );

  if (!presignedRes.success || !presignedRes.data) {
    throw new Error(presignedRes.message ?? 'No se pudo obtener URL de subida');
  }

  const { uploadUrl, publicUrl } = presignedRes.data;

  // 2. Subir directamente a S3 (sin pasar por el backend)
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType },
    body: blob,
  });

  if (!uploadRes.ok) {
    throw new Error(`Error subiendo imagen a S3: ${uploadRes.status} ${uploadRes.statusText}`);
  }

  // 3. Retornar URL pública de S3
  return publicUrl;
}
```

---

## TAREA 2 — Actualizar `CalendarEditor.tsx`

**Archivo:** `src/components/editor-components/CalendarEditor.tsx`
**Línea de interés:** 603 (`handleImageUpload`)
**Estimado:** 2–3 horas

### Cambios al `handleImageUpload` (línea 603):

```typescript
// ANTES (línea 603–657) — guarda data URL directo
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const imageSrc = await compressAndResizeImage(file);
    // ... guarda imageSrc (data URL de 3-5 MB) en estado
  }
};

// DESPUÉS — sube a S3, guarda URL
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setIsUploadingPhoto(true); // ← nuevo estado de carga (ver abajo)
  try {
    // 1. Comprimir/redimensionar (igual que antes — sin pérdida de calidad)
    const compressedDataUrl = await compressAndResizeImage(file);

    // 2. Subir imagen comprimida a S3
    const s3Url = await uploadImageToS3(compressedDataUrl);

    // 3. Pre-cargar la imagen desde S3 para el canvas
    const img = new Image();
    img.crossOrigin = 'anonymous'; // ← IMPORTANTE para S3
    img.src = s3Url;
    img.onload = () => {
      photoImageRefs.current.set(selectedMonth, img);
      renderCanvas();
    };

    const previousImageSrc = currentMonthPhoto.imageSrc;

    execute({
      undo: () => {
        setMonthPhotos((prev) => {
          const updated = [...prev];
          updated[selectedMonth - 1] = { ...updated[selectedMonth - 1], imageSrc: previousImageSrc };
          return updated;
        });
      },
      redo: () => {
        setMonthPhotos((prev) => {
          const updated = [...prev];
          updated[selectedMonth - 1] = { ...updated[selectedMonth - 1], imageSrc: s3Url }; // ← URL, no data URL
          return updated;
        });
      },
    });

    setMonthPhotos((prev) => {
      const updated = [...prev];
      updated[selectedMonth - 1] = { ...updated[selectedMonth - 1], imageSrc: s3Url }; // ← URL, no data URL
      return updated;
    });
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    toast.error('No se pudo subir la imagen. Intenta de nuevo.');
  } finally {
    setIsUploadingPhoto(false);
  }
};
```

### Estado de carga nuevo (agregar junto a los demás useState):

```typescript
const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
```

### Indicador visual de carga (buscar el botón de "Subir foto" ~línea 1598):

```tsx
{/* Botón de subida con estado de carga */}
<Button
  onClick={() => fileInputRef.current?.click()}
  disabled={isUploadingPhoto}
  className="w-full"
>
  {isUploadingPhoto ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Subiendo foto...
    </>
  ) : (
    <>
      <Upload className="mr-2 h-4 w-4" />
      Subir foto
    </>
  )}
</Button>
```

### Import a agregar:

```typescript
import { uploadImageToS3 } from '@/lib/s3-upload';
import { toast } from 'sonner';
// Loader2 ya existe en lucide-react si no está importado, agregarlo
```

---

## TAREA 3 — Actualizar `PolaroidEditor.tsx`

**Archivo:** `src/components/editor-components/PolaroidEditor.tsx`
**Línea de interés:** 375 (`handleImageUpload`)
**Estimado:** 1–2 horas

```typescript
// ANTES (línea 375–417)
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const compressedSrc = await compressAndResizeImage(file, {
      maxWidth: 1000, maxHeight: 1000, quality: 0.85, mimeType: 'image/jpeg'
    });
    const img = new Image();
    img.src = compressedSrc;
    img.onload = () => {
      currentImageRef.current = img;
      setCurrentImageSrc(compressedSrc); // ← data URL (MB)
      // ...
    };
  } catch { ... }
};

// DESPUÉS
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setIsUploadingPhoto(true);
  try {
    // Comprimir igual que antes
    const compressedDataUrl = await compressAndResizeImage(file, {
      maxWidth: 1000, maxHeight: 1000, quality: 0.85, mimeType: 'image/jpeg'
    });

    // Subir a S3
    const s3Url = await uploadImageToS3(compressedDataUrl);

    // Cargar desde S3 para el canvas
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = s3Url;
    img.onload = () => {
      currentImageRef.current = img;
      setCurrentImageSrc(s3Url); // ← URL de S3 (100 bytes)
      setCurrentTransformations({ scale: 1, rotation: 0, posX: 0, posY: 0 });
      setCurrentEffects({ brightness: 0, contrast: 0, saturation: 0, sepia: 0 });
      setSelectedFilter('none');
      reset();
    };
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    toast.error('No se pudo subir la imagen. Intenta de nuevo.');
  } finally {
    setIsUploadingPhoto(false);
  }
};
```

### Agregar estado y UI de carga (igual que en CalendarEditor):

```typescript
const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
```

---

## TAREA 4 — Actualizar `StandardEditor.tsx`

**Archivo:** `src/app/user/editor/StandardEditor.tsx`
**Línea de interés:** 948 (onChange inline del `<Input>`)
**Estimado:** 1–2 horas

```typescript
// ANTES (línea 948–979) — inline en JSX
onChange={async (e) => {
  if (e.target.files?.[0]) {
    const file = e.target.files[0];
    try {
      const compressedSrc = await compressAndResizeImage(file, { ... });
      setImageSrc(compressedSrc); // ← data URL
      reset();
    } catch { ... }
  }
}}

// DESPUÉS — extraer a función nombrada para legibilidad
// Agregar función junto a los demás handlers del componente:

const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setIsUploadingPhoto(true);
  try {
    const maxWidth = Math.round(exportDimensions.width * 1.5);
    const maxHeight = Math.round(exportDimensions.height * 1.5);

    const compressedDataUrl = await compressAndResizeImage(file, {
      maxWidth, maxHeight, quality: 0.85, mimeType: 'image/jpeg'
    });

    // Subir a S3
    const s3Url = await uploadImageToS3(compressedDataUrl);

    setImageSrc(s3Url); // ← URL de S3 (100 bytes)
    reset();
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    toast.error('No se pudo subir la imagen. Intenta de nuevo.');
  } finally {
    setIsUploadingPhoto(false);
  }
};

// En JSX reemplazar:
// onChange={async (e) => { ... }}
// por:
// onChange={handleImageSelected}
// disabled={copiesProjected >= maxImages || isUploadingPhoto}
```

---

## TAREA 5 — Simplificar `customization-storage.ts`

**Archivo:** `src/lib/customization-storage.ts`
**Estimado:** 1 hora

Con Strategy B, `imageSrc` es una URL de S3 (~100 bytes).
El adaptador de storage ya **no necesita IDB**. Se puede reemplazar por el localStorage estándar.

```typescript
// NUEVA versión simplificada de src/lib/customization-storage.ts

const STRIP_FIELDS = new Set([
  'renderedImageSrc',
  'croppedPhotoSrc',
  'thumbnailDataUrl',
]);

function stripNonPersistable(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(stripNonPersistable);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>)
        .filter(([key]) => !STRIP_FIELDS.has(key))
        .map(([key, val]) => [key, stripNonPersistable(val)])
    );
  }
  return obj;
}

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
```

> Con esto el QuotaExceededError es imposible: 1000 fotos × ~100 bytes de URL = ~100 KB en localStorage.

---

## TAREA 6 — Simplificar `AuthProvider.tsx`

**Archivo:** `src/providers/AuthProvider.tsx`
**Estimado:** 30 minutos

Eliminar las dos líneas que ya no son necesarias:

```typescript
// ELIMINAR estas dos líneas:
import { useCustomizationStore } from '@/stores/customization-store';
import { initImageCache } from '@/lib/image-cache';

// ...en initializeAuth():
await initImageCache();                           // ← ELIMINAR
useCustomizationStore.persist.rehydrate();        // ← ELIMINAR (Zustand lo hace solo)
```

---

## TAREA 7 — Simplificar `customization-store.ts`

**Archivo:** `src/stores/customization-store.ts`
**Estimado:** 30 minutos

```typescript
// ELIMINAR import:
import { cacheClear } from '@/lib/image-cache';

// EN clearAll() — reemplazar:
cacheClear();        // ← eliminar
// (no se necesita limpiar IDB porque las imágenes están en S3, no en IDB)

// EN clearAllAndSyncBackend() — igual:
cacheClear();        // ← eliminar
```

---

## TAREA 8 — Actualizar `temp-cart.ts` (strip imageSrc en sync al backend)

**Archivo:** `src/services/temp-cart.ts`
**Estimado:** 1 hora

Con Strategy B, `imageSrc` es una URL de S3, por lo que NO hay necesidad de stripearla
del payload (es solo texto corto). Sin embargo, como medida defensiva para garantizar
que nunca se envíe un data URL base64 al backend, agregar validación:

```typescript
// Agregar antes de guardarCustomizacionTemporal:

/**
 * Validación defensiva: garantiza que ningún campo imageSrc contenga
 * un data URL base64 (solo URLs de S3 están permitidas).
 * Lanza error en desarrollo, solo advierte en producción.
 */
function assertNoDataUrls(data: Record<string, unknown>, path = ''): void {
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && value.startsWith('data:') && value.length > 200) {
      const msg = `[temp-cart] ADVERTENCIA: Campo "${path}${key}" contiene data URL base64. ` +
        `Esto NO debería ocurrir con Estrategia B. ¿Olvidaste actualizar handleImageUpload?`;
      if (process.env.NODE_ENV === 'development') {
        throw new Error(msg);
      } else {
        console.warn(msg);
      }
    } else if (value !== null && typeof value === 'object') {
      assertNoDataUrls(value as Record<string, unknown>, `${path}${key}.`);
    }
  }
}

export async function guardarCustomizacionTemporal(...) {
  try {
    if (process.env.NODE_ENV === 'development') {
      assertNoDataUrls(data); // ← detectar bugs en desarrollo
    }
    const response = await apiClient.put<void>(...);
    return response;
  }
}
```

---

## TAREA 9 — Limpieza de IDB (deprecar archivos de Fase 1)

**Estimado:** 1 hora | **Hacer DESPUÉS de verificar B en producción (2 semanas)**

Una vez confirmado que Strategy B funciona en producción y todos los usuarios
tienen customizaciones con S3 URLs, eliminar:

```
src/lib/image-db.ts     ← borrar
src/lib/image-cache.ts  ← borrar
```

Y verificar que ningún archivo los importe (los imports en customization-store.ts
y AuthProvider.tsx ya habrán sido eliminados en Tareas 6 y 7).

---

## Diagrama del nuevo flujo

```
Usuario selecciona foto en editor
           │
           ▼
compressAndResizeImage(file)
  → canvas resize + quality 0.85
  → data URL (temporal, solo en memoria)
           │
           ▼
uploadImageToS3(dataUrl)
  1. POST /api/images/temp/presigned-url
     ← { uploadUrl, publicUrl }
  2. PUT {uploadUrl} ← Blob (directo a S3, no pasa por backend)
     ← 200 OK
  3. return publicUrl
           │
           ▼
imageSrc = "https://fotogifty-temp.s3.amazonaws.com/..."
  → estado del editor
  → Zustand persist → localStorage: { imageSrc: "https://..." }
  → backend sync:    { imageSrc: "https://..." }  (payload: < 1 KB)
           │
           ▼
Canvas renderiza:
  img.crossOrigin = "anonymous"  ← ya está en canvas-operations.ts línea 248
  img.src = s3Url                ← carga desde S3 via CORS
```

---

## Tabla de tareas y prioridades

| # | Tarea | Archivo | Estimado | Depende de |
|---|---|---|---|---|
| 1 | Crear `s3-upload.ts` | `src/lib/s3-upload.ts` | 2 h | Backend endpoint |
| 2 | Actualizar CalendarEditor | `CalendarEditor.tsx:603` | 2–3 h | Tarea 1 |
| 3 | Actualizar PolaroidEditor | `PolaroidEditor.tsx:375` | 1–2 h | Tarea 1 |
| 4 | Actualizar StandardEditor | `StandardEditor.tsx:948` | 1–2 h | Tarea 1 |
| 5 | Simplificar storage adapter | `customization-storage.ts` | 1 h | Tareas 2–4 |
| 6 | Limpiar AuthProvider | `AuthProvider.tsx` | 30 min | Tarea 5 |
| 7 | Limpiar customization-store | `customization-store.ts` | 30 min | Tarea 5 |
| 8 | Validación en temp-cart | `temp-cart.ts` | 1 h | Tarea 1 |
| 9 | Deprecar IDB (cleanup) | `image-db.ts`, `image-cache.ts` | 1 h | 2 semanas en prod |

**Total estimado:** 9–12 horas de desarrollo frontend

---

## Orden de implementación recomendado

```
Semana 1:
  Día 1 AM  → Tarea 1: s3-upload.ts
  Día 1 PM  → Tarea 2: CalendarEditor (el más crítico)
  Día 2 AM  → Tareas 3 + 4: Polaroid + Standard
  Día 2 PM  → Tarea 8: validación temp-cart
  Día 2 PM  → npm run build → fix warnings

Semana 1 (cuando backend esté listo):
  Día 3     → Tareas 5 + 6 + 7: simplificación storage
  Día 3     → QA: probar flujo completo en dev

Semana 3 (post-producción estable):
  → Tarea 9: borrar image-db.ts e image-cache.ts
```

---

## Notas importantes

### S3 CORS para GET (necesario para canvas)
El bucket debe permitir `GET` desde el dominio del frontend, no solo `PUT`:
```json
{ "AllowedMethods": ["PUT", "GET"], "AllowedOrigins": ["https://fotogifty.com", ...] }
```
Sin esto, `canvas-operations.ts` lanzará `SecurityError: Tainted canvas` al exportar.

### Compatibilidad con customizaciones existentes
Los usuarios con customizaciones previas (que tienen data URLs en localStorage/IDB)
seguirán funcionando porque:
- `canvas-operations.ts` ya maneja tanto data URLs como URLs HTTP (`img.src = imageSrc`)
- Solo las nuevas fotos subidas irán a S3
- Las viejas data URLs se irán eliminando naturalmente con el tiempo (usuario las reemplaza)
