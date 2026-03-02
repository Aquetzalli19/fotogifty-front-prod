# Arquitectura de Storage de Imágenes — FotoGifty

## Contexto y Problema

El editor de calendario permite al usuario cargar hasta 12 fotos originales (una por mes).
Cada imagen original puede pesar entre 2 y 8 MB en base64.

| Escenario | Tamaño estimado en localStorage |
|---|---|
| Calendario con 4 fotos | ~16 MB |
| Calendario con 8 fotos | ~32 MB |
| Calendario con 12 fotos | ~48 MB |

**localStorage** tiene un límite de ~5–10 MB según el navegador. El resultado era:

```
QuotaExceededError: Failed to execute 'setItem' on 'Storage':
Setting the value of 'customization-storage' exceeded the quota.
```

El requisito era resolverlo **sin comprometer calidad, peso, resolución ni tamaño** de las imágenes.

---

## Solución Implementada (Frontend)

### Arquitectura en tres capas

```
┌─────────────────────────────────────────────────────────────────┐
│  ESTADO ZUSTAND (in-memory)                                     │
│  customizations[]: imageSrc = "data:image/jpeg;base64,..."     │
│  Las imágenes están íntegras. Editors y canvas no cambian.     │
└────────────────────────┬────────────────────────────────────────┘
                         │ persist middleware
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  customizationStorage  (src/lib/customization-storage.ts)       │
│  Adaptador sincrónico — transparente para Zustand v5           │
│                                                                 │
│  setItem():                                                     │
│    - Parsea el JSON del estado                                  │
│    - Escanea imageSrc / imageSrc2 (data URLs)                   │
│    - Calcula hash djb2 del contenido                            │
│    - Reemplaza data URL por referencia: "__idb__:img_<hash>"    │
│    - Escribe referencia + resto de metadata en localStorage     │
│    - Sincroniza imagen al caché + IDB (async, fire-and-forget)  │
│                                                                 │
│  getItem():                                                     │
│    - Lee metadata de localStorage                               │
│    - Resuelve "__idb__:hash" → cacheGet(hash) [sincrónico]     │
│    - Devuelve JSON completo con data URLs restauradas           │
└──────────────┬──────────────────────────────┬───────────────────┘
               │ metadata                     │ imágenes
               ▼                              ▼
┌──────────────────────┐      ┌───────────────────────────────────┐
│  localStorage         │      │  image-cache.ts (in-memory Map)   │
│  Clave/valor pequeña │      │  cache: Map<hash, dataUrl>         │
│  solo metadata        │      │  Poblada al iniciar la app        │
│  ~5-10 MB límite      │      │  Lectura sincrónica (Zustand)     │
└──────────────────────┘      └──────────────┬────────────────────┘
                                              │ cacheSet → async write
                                              ▼
                               ┌───────────────────────────────────┐
                               │  IndexedDB (image-db.ts)          │
                               │  DB: fotogifty-image-db           │
                               │  Store: images                    │
                               │  Capacidad: ~50% del disco        │
                               │  Sin compresión, sin pérdida      │
                               └───────────────────────────────────┘
```

### Claves de diseño

| Decisión | Razón |
|---|---|
| **Sin compresión** | Imágenes para impresión a 300 DPI — calidad total |
| **Hash djb2 del contenido** | Misma imagen = mismo hash = escritura idempotente, sin duplicados |
| **Caché en memoria (Map)** | Zustand v5 requiere storage sincrónico; IndexedDB es async |
| **Separación metadata/imagen** | localStorage solo guarda metadatos (KB), imágenes en IDB (MB) |
| **STRIP de campos renderizados** | `renderedImageSrc`, `croppedPhotoSrc`, `thumbnailDataUrl` se regeneran, nunca se persisten |

### Flujo de inicialización (AuthProvider)

```
1. await initImageCache()
   ↓ Lee TODOS los registros de IndexedDB → Map en memoria

2. useCustomizationStore.persist.rehydrate()
   ↓ Lee localStorage → resuelve __idb__:hash desde Map
   ↓ Estado Zustand queda completo con data URLs

3. loadUserDataFromBackend()
   ↓ Mezcla customizaciones del servidor con las locales
```

---

## Archivos Creados / Modificados

### Nuevos (frontend)

| Archivo | Descripción |
|---|---|
| `src/lib/image-db.ts` | Wrapper CRUD sobre IndexedDB (`idbSet`, `idbGet`, `idbGetAll`, `idbClear`) |
| `src/lib/image-cache.ts` | Caché en memoria sincrónico: `initImageCache`, `cacheGet`, `cacheSet`, `cacheClear` |
| `src/lib/customization-storage.ts` | Adaptador `StateStorage` de Zustand v5: split metadata/imágenes |

### Modificados (frontend)

| Archivo | Cambio |
|---|---|
| `src/stores/customization-store.ts` | Usa `createJSONStorage(() => customizationStorage)`; `clearAll` → `cacheClear()` |
| `src/providers/AuthProvider.tsx` | Llama `initImageCache()` + `rehydrate()` antes de restaurar sesión |

---

## Comparativa de capacidad

| Storage | Límite | Tipo | Sync | Uso en FotoGifty |
|---|---|---|---|---|
| localStorage | 5–10 MB | Key-Value string | Sync | Metadata + referencias IDB |
| IndexedDB | ~50% disco | Structured (NoSQL) | Async | Imágenes originales |
| In-memory Map | RAM disponible | JS object | Sync | Caché puente para Zustand |

---

## Problema Pendiente — Payload al Backend

### Descripción

`guardarCustomizacionTemporal()` actualmente envía el objeto `data` completo al backend:

```typescript
// src/services/temp-cart.ts
PUT /customizations/temp/{cartItemId}/{instanceIndex}
Body: { editorType, data: { imageSrc: "data:image/...;base64,XXXXXX..." }, completed }
```

Para un calendario con 12 fotos originales, este payload puede superar **50 MB** de JSON.

### Riesgos

1. **Límite del body parser** (Express default: 1 MB → `PayloadTooLargeError 413`)
2. **Presión sobre la base de datos** del backend (columna TEXT/JSONB con MB de base64)
3. **Multi-dispositivo roto**: si el usuario abre sesión en otro dispositivo, el backend devuelve la customización con `imageSrc` incluida — si el backend la guardó correctamente. Si no, el usuario no ve sus imágenes.

> Ver documentación separada: `docs/STORAGE_BACKEND_SPEC.md`
> Ver plan de trabajo frontend: `docs/STORAGE_FRONTEND_PLAN.md`

---

## Referencias

- [Zustand Persist Middleware — Custom Storage](https://github.com/pmndrs/zustand/blob/main/docs/reference/integrations/persisting-store-data.md)
- [IndexedDB vs localStorage — Best Practices 2025](https://dev.to/tene/localstorage-vs-indexeddb-javascript-guide-storage-limits-best-practices-fl5)
- [MDN IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
