# Especificación de Backend: Duplicación de Paquetes en Carrito

**Versión:** 1.0
**Fecha:** 2026-02-28
**Estado:** Pendiente de implementación
**Autor:** Equipo Frontend — FotoGifty

---

## 1. Contexto y Motivación

### 1.1 Descripción del Flujo Actual

El carrito temporal de FotoGifty funciona en dos capas paralelas que el backend ya gestiona:

| Capa | Endpoint actual | Propósito |
|------|----------------|-----------|
| Carrito | `PUT /api/cart/temp` | Lista de paquetes con cantidad |
| Customizaciones | `PUT /api/customizations/temp/{cartItemId}/{instanceIndex}` | Personalización por instancia |

Cuando un usuario tiene `quantity: 2` de un paquete, el frontend espera **dos objetos independientes** en customizaciones:
- `cartItemId=42, instanceIndex=0` → personalización del primer ejemplar
- `cartItemId=42, instanceIndex=1` → personalización del segundo ejemplar

### 1.2 La Funcionalidad de Duplicar

**El frontend ya implementó la lógica de duplicación de forma puramente local.** Al pulsar "Duplicar" en un ítem del carrito:

1. Incrementa `quantity` del item en 1.
2. Clona la customización del último `instanceIndex` al nuevo slot.
3. Sincroniza ambas capas con el backend vía debounce de 2 s.

**El endpoint `POST /api/customizations/temp/{cartItemId}/duplicate` es una optimización para escenarios de sincronización entre dispositivos**, no un requisito bloqueante para el MVP. Sin él, el frontend funciona correctamente en sesión única.

---

## 2. Especificación del Endpoint

### 2.1 Endpoint Principal

```
POST /api/customizations/temp/{cartItemId}/duplicate
```

#### Path Parameters

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `cartItemId` | `string` | ID del ítem de carrito cuya customización se duplicará |

#### Headers Requeridos

```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

#### Request Body (JSON Schema)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["sourceInstanceIndex"],
  "additionalProperties": false,
  "properties": {
    "sourceInstanceIndex": {
      "type": "integer",
      "minimum": 0,
      "description": "Índice de la instancia fuente a clonar (0-based)"
    },
    "targetInstanceIndex": {
      "type": "integer",
      "minimum": 1,
      "description": "Índice destino. Si se omite, el backend calcula max(instanceIndex)+1 para ese cartItemId"
    }
  }
}
```

**Ejemplo de request body:**
```json
{
  "sourceInstanceIndex": 0
}
```

#### Response — 201 Created

```json
{
  "success": true,
  "data": {
    "cartItemId": "42",
    "sourceInstanceIndex": 0,
    "targetInstanceIndex": 1,
    "editorType": "standard",
    "completed": true,
    "createdAt": "2026-02-28T14:30:00.000Z"
  },
  "message": "Customización duplicada exitosamente"
}
```

#### Response Body (JSON Schema)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "data": {
      "type": "object",
      "properties": {
        "cartItemId":            { "type": "string" },
        "sourceInstanceIndex":  { "type": "integer" },
        "targetInstanceIndex":  { "type": "integer" },
        "editorType": {
          "type": "string",
          "enum": ["standard", "calendar", "polaroid"]
        },
        "completed":  { "type": "boolean" },
        "createdAt":  { "type": "string", "format": "date-time" }
      }
    },
    "message": { "type": "string" }
  }
}
```

---

## 3. Business Logic

### 3.1 Flujo Completo del Endpoint

```
POST /api/customizations/temp/{cartItemId}/duplicate
│
├─ [1] Autenticar — extraer userId del JWT
│
├─ [2] Validar request body (Joi / Zod / Yup)
│      └─ sourceInstanceIndex: integer ≥ 0, requerido
│
├─ [3] Verificar propiedad
│      SELECT 1 FROM customizaciones_temporales
│        WHERE usuario_id = :userId
│          AND cart_item_id = :cartItemId
│          AND instance_index = :sourceInstanceIndex
│      └─ 404 si no existe
│
├─ [4] Calcular targetInstanceIndex (si no viene en el body)
│      SELECT MAX(instance_index) + 1
│        FROM customizaciones_temporales
│        WHERE usuario_id = :userId
│          AND cart_item_id = :cartItemId
│
├─ [5] Verificar que targetInstanceIndex no exista
│      └─ 409 si ya existe
│
├─ [6] Abrir TRANSACCIÓN
│   ├─ [6a] Leer datos JSON de la fuente
│   ├─ [6b] Sanitizar: eliminar rendered_image_src, thumbnail_data_url, cropped_photo_src
│   ├─ [6c] INSERT clon en customizaciones_temporales
│   │        con nuevo id, mismos datos saneados, updated_at = NOW()
│   └─ [6d] COMMIT → si falla → ROLLBACK + 500
│
└─ [7] Responder 201 con datos del nuevo registro
```

### 3.2 Sanitización del Clon

El backend **debe eliminar** estos campos del JSON antes de almacenar el clon, porque son imágenes renderizadas que se generan en el cliente bajo demanda:

| Campo | Editor(es) | Razón para eliminar |
|-------|-----------|---------------------|
| `renderedImageSrc` | standard, calendar, polaroid | Canvas renderizado — no persiste |
| `thumbnailDataUrl` | standard, polaroid | Preview en carrito — regenerado en cliente |
| `croppedPhotoSrc` | calendar | Área de foto recortada — regenerada al subir |

**Pseudo-código de sanitización (Node.js):**

```javascript
function sanitizeCustomizationData(editorType, data) {
  const clone = JSON.parse(JSON.stringify(data)); // deep clone

  if (editorType === 'standard' && Array.isArray(clone.images)) {
    clone.images = clone.images.map(img => {
      delete img.renderedImageSrc;
      delete img.thumbnailDataUrl;
      return img;
    });
  }

  if (editorType === 'calendar' && Array.isArray(clone.months)) {
    clone.months = clone.months.map(month => {
      delete month.renderedImageSrc;
      delete month.croppedPhotoSrc;
      return month;
    });
  }

  if (editorType === 'polaroid' && Array.isArray(clone.polaroids)) {
    clone.polaroids = clone.polaroids.map(p => {
      delete p.renderedImageSrc;
      delete p.thumbnailDataUrl;
      return p;
    });
  }

  return clone;
}
```

### 3.3 Reglas de Negocio

1. **Aislamiento de usuario**: Solo se pueden duplicar customizaciones propias. Nunca cruzar `userId`.
2. **Fuente debe existir**: `sourceInstanceIndex` debe apuntar a un registro real del usuario.
3. **Idempotencia del targetIndex**: Si el cliente reintenta con el mismo `targetInstanceIndex`, retornar 409 (no sobrescribir silenciosamente).
4. **Sin validación de stock aquí**: La validación de capacidad del paquete es responsabilidad del endpoint de checkout (`POST /api/checkout`), no de la duplicación de customización.
5. **Sin subir imágenes**: Este endpoint no sube nada a S3. Solo clona metadatos JSON. Las URLs `imageSrc` originales se mantienen igual (apuntan al mismo S3 object).
6. **Transacción atómica**: Insert del clon en una sola transacción; rollback completo si falla.

---

## 4. Modelo de Datos

### 4.1 Tabla Existente: `customizaciones_temporales`

> Esta tabla ya debería existir según `CART_SECURITY_BACKEND_SPEC.md`. El endpoint de duplicación usa esta misma tabla.

```sql
-- Estructura esperada (ya definida en CART_SECURITY_BACKEND_SPEC.md)
CREATE TABLE customizaciones_temporales (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id      INT NOT NULL,
    cart_item_id    VARCHAR(255) NOT NULL,  -- ID del item en el carrito
    instance_index  INT NOT NULL DEFAULT 0, -- Índice de la instancia (0-based)
    editor_type     ENUM('standard', 'calendar', 'polaroid') NOT NULL,
    datos           JSON NOT NULL,          -- Customización serializada (SIN rendered images)
    completed       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_customization (usuario_id, cart_item_id, instance_index)
);
```

### 4.2 El Clon — Ejemplo Completo

**Registro fuente (instanceIndex = 0):**
```json
{
  "id": 101,
  "usuario_id": 7,
  "cart_item_id": "42",
  "instance_index": 0,
  "editor_type": "standard",
  "datos": {
    "images": [
      {
        "id": 1,
        "imageSrc": "data:image/jpeg;base64,/9j/4AAQ...",
        "renderedImageSrc": "data:image/png;base64,iVBOR...",
        "thumbnailDataUrl": "data:image/jpeg;base64,/9j/...",
        "transformations": { "scale": 1.2, "rotation": 15, "mirrorX": false, "mirrorY": false, "posX": 10, "posY": -5 },
        "effects": [],
        "canvasStyle": { "backgroundColor": "#ffffff", "borderColor": "#000000", "borderWidth": 0 },
        "selectedFilter": "none",
        "copies": 3,
        "printDimensions": { "widthInches": 4, "heightInches": 6, "resolution": 300 }
      }
    ],
    "maxImages": 5
  },
  "completed": true
}
```

**Registro clon insertado (instanceIndex = 1):**
```json
{
  "id": 102,
  "usuario_id": 7,
  "cart_item_id": "42",
  "instance_index": 1,
  "editor_type": "standard",
  "datos": {
    "images": [
      {
        "id": 1,
        "imageSrc": "data:image/jpeg;base64,/9j/4AAQ...",
        "transformations": { "scale": 1.2, "rotation": 15, "mirrorX": false, "mirrorY": false, "posX": 10, "posY": -5 },
        "effects": [],
        "canvasStyle": { "backgroundColor": "#ffffff", "borderColor": "#000000", "borderWidth": 0 },
        "selectedFilter": "none",
        "copies": 3,
        "printDimensions": { "widthInches": 4, "heightInches": 6, "resolution": 300 }
      }
    ],
    "maxImages": 5
  },
  "completed": true
}
```

> **Nota:** `renderedImageSrc` y `thumbnailDataUrl` fueron eliminados en el clon.

---

## 5. Manejo de Errores

### 5.1 Códigos HTTP y Casos de Error

| HTTP | Código Interno | Cuándo ocurre | Mensaje |
|------|---------------|---------------|---------|
| `400` | `VALIDATION_ERROR` | Body inválido (sourceInstanceIndex negativo, tipo incorrecto) | "El cuerpo de la petición no es válido" |
| `401` | `UNAUTHORIZED` | JWT ausente, expirado o inválido | "No autorizado" |
| `403` | `FORBIDDEN` | `cartItemId` existe pero pertenece a otro usuario | "No tienes permiso para duplicar este elemento" |
| `404` | `CUSTOMIZATION_NOT_FOUND` | `cartItemId` + `sourceInstanceIndex` no existe para este usuario | "No se encontró la customización fuente" |
| `409` | `INSTANCE_ALREADY_EXISTS` | `targetInstanceIndex` ya tiene un registro | "Ya existe una customización en el índice destino" |
| `422` | `INVALID_EDITOR_TYPE` | `editor_type` en BD tiene valor desconocido | "Tipo de editor no reconocido" |
| `429` | `RATE_LIMIT_EXCEEDED` | Más de 20 duplicaciones/minuto por usuario | "Demasiadas solicitudes. Espera un momento" |
| `500` | `DUPLICATION_FAILED` | Fallo en transacción de BD | "Error interno al duplicar. Intenta de nuevo" |

### 5.2 Estructura de Respuesta de Error

Todos los errores deben responder con esta estructura (consistente con el resto de la API):

```json
{
  "success": false,
  "error": "CUSTOMIZATION_NOT_FOUND",
  "message": "No se encontró la customización fuente",
  "details": {
    "cartItemId": "42",
    "sourceInstanceIndex": 0
  }
}
```

### 5.3 Logging Recomendado

```
[INFO]  POST /api/customizations/temp/42/duplicate — userId=7 source=0 target=1
[DEBUG] Leyendo customización fuente: cartItemId=42, instanceIndex=0
[DEBUG] Sanitizando datos: eliminados renderedImageSrc, thumbnailDataUrl
[DEBUG] Insertando clon: cartItemId=42, instanceIndex=1
[INFO]  Duplicación exitosa — id=102, userId=7, cartItemId=42
```

En errores:
```
[WARN]  Customización fuente no encontrada — userId=7, cartItemId=42, instanceIndex=5
[ERROR] Fallo en transacción de duplicación — userId=7, cartItemId=42: <stack trace>
```

---

## 6. Seguridad

### 6.1 Validación de Propiedad (Authorization)

```sql
-- SIEMPRE filtrar por usuario_id extraído del JWT, nunca confiar en el body
SELECT id, editor_type, datos, completed
FROM customizaciones_temporales
WHERE usuario_id     = :userId        -- del JWT
  AND cart_item_id   = :cartItemId    -- del path param
  AND instance_index = :sourceIndex   -- del body
LIMIT 1;
```

**Nunca permitir** que `userId` venga del request body o query params.

### 6.2 Rate Limiting

| Ventana | Máximo de peticiones | Acción al exceder |
|---------|---------------------|-------------------|
| 1 minuto | 20 duplicaciones por usuario | HTTP 429 + `Retry-After` header |
| 1 hora | 200 duplicaciones por usuario | HTTP 429 + `Retry-After` header |

Implementar con Redis o en memoria según la infraestructura de Railway.

### 6.3 Límite de Tamaño del JSON

El campo `datos` puede contener imágenes en base64 (`imageSrc`). Establecer límite:

```
MAX tamaño del campo datos: 50 MB por customización
```

Si al duplicar el JSON fuente supera este límite, retornar `400` con `PAYLOAD_TOO_LARGE`.

### 6.4 Validación Anti-Injection

- El `cartItemId` del path debe ser alfanumérico (`/^[a-zA-Z0-9_-]+$/`). Rechazar si contiene caracteres SQL/NoSQL especiales.
- Usar **prepared statements / parametrized queries** para todas las consultas.
- El campo `datos` se almacena y recupera como blob JSON; nunca ejecutar su contenido.

### 6.5 Límite de Instancias por CartItem

Para prevenir abuso de almacenamiento:

```
MAX instanceIndex por cartItemId por usuario: 99
```

Si `targetInstanceIndex >= 100`, retornar `400` con `MAX_INSTANCES_EXCEEDED`.

---

## 7. Consideraciones de Rendimiento

### 7.1 Índices Recomendados

```sql
-- Índice compuesto para la consulta de validación de propiedad
CREATE INDEX idx_customizaciones_usuario_item_instancia
    ON customizaciones_temporales (usuario_id, cart_item_id, instance_index);

-- Índice para calcular el MAX(instance_index)
CREATE INDEX idx_customizaciones_usuario_item
    ON customizaciones_temporales (usuario_id, cart_item_id);
```

### 7.2 Tamaño de la Transacción

La operación es un **INSERT de un solo registro**. No escala de forma problemática. La única preocupación es el tamaño del JSON en el campo `datos` (imágenes base64).

### 7.3 Tiempo de Respuesta Esperado

| Percentil | Tiempo objetivo |
|-----------|----------------|
| p50 | < 100 ms |
| p95 | < 300 ms |
| p99 | < 800 ms |

---

## 8. Integración con el Sistema Existente

### 8.1 Relación con Endpoints Existentes

Este endpoint es complementario, **no reemplaza** los endpoints de PUT existentes:

```
PUT /api/customizations/temp/{cartItemId}/{instanceIndex}
```

Después de duplicar, el frontend continúa sincronizando cada instancia con el PUT normal. El POST de duplicación es una optimización de sincronización inicial.

### 8.2 Compatibilidad con el Frontend

El frontend envía la solicitud de duplicación **solo si el endpoint existe**. Si el backend no lo implementa, el flujo de duplicación local (ya implementado en el store de Zustand) sigue funcionando correctamente — la sincronización con el backend ocurre después mediante los PUTs del debounce de 2 s.

**Recomendación**: Implementar el endpoint para garantizar consistencia en sesiones multi-dispositivo y evitar colisiones de `instanceIndex`.

---

## 9. Ejemplos de Llamadas API

### 9.1 curl — Caso Exitoso

```bash
curl -X POST \
  'https://api.fotogifty.com/api/customizations/temp/42/duplicate' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "sourceInstanceIndex": 0
  }'
```

**Respuesta esperada (201):**
```json
{
  "success": true,
  "data": {
    "cartItemId": "42",
    "sourceInstanceIndex": 0,
    "targetInstanceIndex": 1,
    "editorType": "standard",
    "completed": true,
    "createdAt": "2026-02-28T14:30:00.000Z"
  },
  "message": "Customización duplicada exitosamente"
}
```

### 9.2 curl — Especificando targetInstanceIndex

```bash
curl -X POST \
  'https://api.fotogifty.com/api/customizations/temp/42/duplicate' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "sourceInstanceIndex": 0,
    "targetInstanceIndex": 2
  }'
```

### 9.3 curl — Duplicar customización de calendario

```bash
curl -X POST \
  'https://api.fotogifty.com/api/customizations/temp/99/duplicate' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "sourceInstanceIndex": 0
  }'
```

**Respuesta esperada (201):**
```json
{
  "success": true,
  "data": {
    "cartItemId": "99",
    "sourceInstanceIndex": 0,
    "targetInstanceIndex": 1,
    "editorType": "calendar",
    "completed": false,
    "createdAt": "2026-02-28T15:00:00.000Z"
  },
  "message": "Customización duplicada exitosamente"
}
```

### 9.4 curl — Error 404

```bash
# Intentar duplicar una customización que no existe
curl -X POST \
  'https://api.fotogifty.com/api/customizations/temp/999/duplicate' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...' \
  -H 'Content-Type: application/json' \
  -d '{ "sourceInstanceIndex": 0 }'

# Respuesta (404):
{
  "success": false,
  "error": "CUSTOMIZATION_NOT_FOUND",
  "message": "No se encontró la customización fuente",
  "details": {
    "cartItemId": "999",
    "sourceInstanceIndex": 0
  }
}
```

### 9.5 curl — Error 409

```bash
# targetInstanceIndex ya existe
curl -X POST \
  'https://api.fotogifty.com/api/customizations/temp/42/duplicate' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "sourceInstanceIndex": 0,
    "targetInstanceIndex": 1
  }'

# Respuesta (409):
{
  "success": false,
  "error": "INSTANCE_ALREADY_EXISTS",
  "message": "Ya existe una customización en el índice destino",
  "details": {
    "cartItemId": "42",
    "targetInstanceIndex": 1
  }
}
```

### 9.6 Postman Collection (JSON importable)

```json
{
  "info": {
    "name": "FotoGifty — Duplicate Package",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    { "key": "base_url", "value": "http://localhost:3001/api" },
    { "key": "token",    "value": "{{jwt_token}}" }
  ],
  "item": [
    {
      "name": "Duplicate Customization — Success",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Authorization", "value": "Bearer {{token}}" },
          { "key": "Content-Type",  "value": "application/json" }
        ],
        "url": "{{base_url}}/customizations/temp/42/duplicate",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"sourceInstanceIndex\": 0\n}"
        }
      }
    },
    {
      "name": "Duplicate Customization — 404 Not Found",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Authorization", "value": "Bearer {{token}}" },
          { "key": "Content-Type",  "value": "application/json" }
        ],
        "url": "{{base_url}}/customizations/temp/9999/duplicate",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"sourceInstanceIndex\": 0\n}"
        }
      }
    },
    {
      "name": "Duplicate Customization — 409 Conflict",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Authorization", "value": "Bearer {{token}}" },
          { "key": "Content-Type",  "value": "application/json" }
        ],
        "url": "{{base_url}}/customizations/temp/42/duplicate",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"sourceInstanceIndex\": 0,\n  \"targetInstanceIndex\": 1\n}"
        }
      }
    }
  ]
}
```

---

## 10. Checklist de Implementación para Backend

### Implementación

- [ ] Crear ruta `POST /api/customizations/temp/:cartItemId/duplicate`
- [ ] Middleware de autenticación JWT (extraer `userId`)
- [ ] Validación de body con schema (Joi / Zod / class-validator)
- [ ] Validar formato de `cartItemId` (alfanumérico)
- [ ] Query de verificación de propiedad (`userId` + `cartItemId` + `sourceInstanceIndex`)
- [ ] Calcular `targetInstanceIndex` si no viene en el body
- [ ] Verificar que `targetInstanceIndex` no exista (evitar sobrescritura)
- [ ] Verificar que `targetInstanceIndex < 100` (límite anti-abuso)
- [ ] Función `sanitizeCustomizationData()` que elimine rendered fields
- [ ] Transacción atómica para el INSERT del clon
- [ ] Rollback en caso de fallo
- [ ] Respuesta 201 con datos del clon creado

### Seguridad

- [ ] Rate limiting: 20/min, 200/hora por userId (Redis o in-memory)
- [ ] Prepared statements en todas las queries
- [ ] Validar que `cartItemId` no contenga caracteres especiales
- [ ] Nunca exponer datos de otro usuario
- [ ] Límite de tamaño del JSON de datos (50 MB)

### Testing

- [ ] Test: Duplicar customización Standard exitosamente
- [ ] Test: Duplicar customización Calendar exitosamente
- [ ] Test: Duplicar customización Polaroid exitosamente
- [ ] Test: `renderedImageSrc` no aparece en el clon
- [ ] Test: `thumbnailDataUrl` no aparece en el clon (Standard/Polaroid)
- [ ] Test: `croppedPhotoSrc` no aparece en el clon (Calendar)
- [ ] Test: 401 sin token
- [ ] Test: 403 con token de otro usuario
- [ ] Test: 404 cuando `sourceInstanceIndex` no existe
- [ ] Test: 409 cuando `targetInstanceIndex` ya existe
- [ ] Test: 400 con body inválido (`sourceInstanceIndex: -1`)
- [ ] Test: Rollback cuando el INSERT falla
- [ ] Test: Rate limit después de 20 peticiones/min

### Documentación

- [ ] Agregar al Swagger (`/api-docs`) la ruta con todos los schemas
- [ ] Actualizar `API_REAL_DOCUMENTATION.md` con el nuevo endpoint
- [ ] Documentar en changelog/release notes

---

## 11. Relación con la Arquitectura Frontend

### 11.1 Cómo el Frontend Llama al Endpoint

Una vez que el backend implemente este endpoint, el frontend puede integrar la llamada en `src/stores/cart-store.ts` dentro del método `duplicateItem()`:

```typescript
// src/stores/cart-store.ts — método duplicateItem()
// Integración opcional con backend para sincronización multi-dispositivo
duplicateItem: async (itemId: number) => {
  const item = get().items.find((i) => i.id === itemId);
  if (!item) return;

  const sourceIndex = item.quantity - 1;

  // 1. Aumentar cantidad en el store local
  get().increaseQuantity(itemId);

  // 2. Clonar customización localmente (ya implementado)
  useCustomizationStore.getState().duplicateCustomization(
    itemId, sourceIndex, item.quantity
  );

  // 3. [OPCIONAL — requiere backend] Notificar al servidor
  //    para consistencia en sesiones multi-dispositivo
  try {
    await apiClient.post(
      `/customizations/temp/${itemId}/duplicate`,
      { sourceInstanceIndex: sourceIndex }
    );
  } catch {
    // No bloqueante: el debounce sincronizará en 2 s
  }
}
```

### 11.2 Formato de cartItemId

El frontend envía `cartItemId` como **string numérico** (p.ej. `"42"`) al sincronizar con el backend. Esto es consistente con `TempCartItem.id` en `src/services/temp-cart.ts`:

```typescript
export interface TempCartItem {
  id: string;       // "42" — string aunque sea número
  packageId: number; // 42  — número entero del paquete
  ...
}
```

El `cartItemId` que llega al endpoint de duplicación **siempre es el mismo `packageId`** del paquete, convertido a string. No es un UUID ni un ID de fila de BD.

### 11.3 Tipos de Datos por Editor

El campo `datos` (JSON) tiene estructura diferente por `editorType`. Ver `customization-store.ts` para los tipos completos:

**`standard`** — `StandardCustomization`:
```typescript
{
  images: SavedStandardImage[]; // Array de imágenes con transformaciones
  maxImages: number;
}
```

**`calendar`** — `CalendarCustomization`:
```typescript
{
  monthTemplates?: Record<number, string>; // URLs de templates por mes (1-12)
  months: Array<{
    month: number;           // 1-12
    imageSrc: string | null; // Imagen original (base64)
    transformations: { scale, rotation, posX, posY };
    effects: { brightness, contrast, saturation, sepia };
    selectedFilter: string;
    canvasStyle: { borderColor, borderWidth, backgroundColor };
  }>;
}
```

**`polaroid`** — `PolaroidCustomization`:
```typescript
{
  canvasWidth: number;
  canvasHeight: number;
  widthInches: number;
  heightInches: number;
  exportResolution: number;  // 300 DPI
  photoArea: { x, y, width, height };
  templateUrl?: string;
  polaroids: Array<{
    id: number;
    imageSrc: string;
    transformations: { scale, rotation, posX, posY };
    effects: { brightness, contrast, saturation, sepia };
    selectedFilter: string;
    canvasStyle: { borderColor, borderWidth, backgroundColor };
    copies: number;
  }>;
  maxPolaroids: number;
}
```

---

## 12. Prioridad de Implementación

| Prioridad | Componente | Estado Frontend | Estado Backend |
|-----------|-----------|----------------|----------------|
| **Alta** | Lógica de duplicación local | ✅ Implementado | N/A |
| **Alta** | Sincronización via PUT existente | ✅ Ya funciona | ✅ Existe |
| **Media** | `POST .../duplicate` endpoint | Integración lista | ⏳ Pendiente |
| **Baja** | Rate limiting Redis | N/A | ⏳ Pendiente |

> **MVP viable sin el nuevo endpoint.** La duplicación local + sincronización debounced cubre el caso de uso principal (sesión única). El endpoint `POST /duplicate` agrega valor en escenarios de sesiones paralelas o recuperación de sesión desde otro dispositivo.
