# Especificación Backend — Gestión de Imágenes en Customizaciones

## Problema actual

El endpoint `PUT /api/customizations/temp/:cartItemId/:instanceIndex` recibe el objeto
`data` completo de la customización, incluyendo el campo `imageSrc` como data URL base64.

Para un calendario de 12 meses con fotos de ~3 MB cada una:
- **Tamaño estimado del payload JSON:** 36–60 MB
- **Límite por defecto de Express body-parser:** 1 MB

El resultado es un error `413 Payload Too Large` silencioso que el frontend registra
como fallo de sincronización, pero no bloquea la experiencia del usuario (la imagen
ya está en IndexedDB localmente).

---

## Dos estrategias posibles

### Estrategia A — Aumento del límite del body parser (mínimo esfuerzo)

**Descripción:** Simplemente aumentar el límite del body-parser de Express para aceptar
payloads grandes de JSON.

**Cambio requerido en backend:**

```javascript
// app.js / server.js
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
```

Si usan nginx como proxy inverso, también hay que configurar:
```nginx
# nginx.conf
client_max_body_size 100M;
```

**Ventajas:**
- Cambio de una sola línea
- No requiere modificar la API ni el frontend
- Multi-dispositivo funciona (backend almacena y devuelve imágenes)

**Desventajas:**
- Base de datos crece rápidamente (columnas JSONB/TEXT con MB de base64)
- Queries lentas al leer customizaciones con imágenes grandes
- Alto uso de memoria en el proceso de Node.js durante el request
- No escala bien con muchos usuarios concurrentes

**Recomendado para:** MVP o validación rápida, con hasta ~50 usuarios concurrentes.

---

### Estrategia B — Separación de imágenes: S3 + metadatos (recomendada)

**Descripción:** Las imágenes originales se suben a S3 desde el frontend mediante
presigned URLs. El backend solo almacena metadatos y URLs de S3.

#### Flujo nuevo

```
Usuario selecciona foto en editor
         │
         ▼
Frontend: POST /api/images/temp/presigned-url
  ← { uploadUrl, s3Key, expiresAt }
         │
         ▼
Frontend: PUT {uploadUrl} (directo a S3, sin pasar por backend)
         │
         ▼
Frontend guarda s3Key en imageSrc del estado
  (en lugar del data URL base64)
         │
         ▼
Frontend: PUT /customizations/temp/:cartItemId/:instanceIndex
  Body: { data: { imageSrc: "s3://fotogifty-temp/..." } }
  Payload: < 1 KB (solo URL, no base64)
         │
         ▼
Backend almacena solo metadatos + URL en DB
```

#### Endpoints nuevos requeridos en backend

---

##### `POST /api/images/temp/presigned-url`

Genera una URL firmada de S3 para que el frontend suba directamente.

**Request:**
```json
{
  "filename": "photo-month-3.jpg",
  "contentType": "image/jpeg",
  "sizeBytes": 3145728
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://fotogifty-temp.s3.amazonaws.com/temp/user-123/img_abc123.jpg?X-Amz-Signature=...",
    "s3Key": "temp/user-123/img_abc123.jpg",
    "publicUrl": "https://fotogifty-temp.s3.amazonaws.com/temp/user-123/img_abc123.jpg",
    "expiresAt": "2026-03-01T12:00:00Z"
  }
}
```

**Lógica backend:**
- Validar autenticación
- Validar `contentType` en lista blanca: `image/jpeg`, `image/png`, `image/webp`, `image/heic`
- Validar `sizeBytes` máximo (ej. 25 MB)
- Generar presigned PUT URL con `PutObjectCommand` de AWS SDK v3
- TTL sugerido: 1 hora para subida + 24 horas para acceso temporal

```javascript
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Key = `temp/${userId}/${Date.now()}-${uuid()}.${extension}`;
const command = new PutObjectCommand({
  Bucket: process.env.S3_TEMP_BUCKET,
  Key: s3Key,
  ContentType: contentType,
});
const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
```

**Errores:**
| Código | Descripción |
|---|---|
| 400 | contentType no permitido o sizeBytes fuera de rango |
| 401 | No autenticado |
| 429 | Rate limit (máx. 20 uploads por usuario por hora) |

---

##### `PUT /api/customizations/temp/:cartItemId/:instanceIndex` (modificado)

Sin cambios en la firma del endpoint. Solo cambia el contenido de `data.imageSrc`:

**Antes (base64):**
```json
{
  "editorType": "calendar",
  "data": {
    "months": [
      { "month": 1, "imageSrc": "data:image/jpeg;base64,/9j/4AAQ..." }
    ]
  }
}
```

**Después (S3 URL):**
```json
{
  "editorType": "calendar",
  "data": {
    "months": [
      { "month": 1, "imageSrc": "https://fotogifty-temp.s3.amazonaws.com/temp/user-123/..." }
    ]
  }
}
```

**Payload nuevo:** < 5 KB (solo URLs, sin base64)

**Acción requerida en backend:**
- No bloquear ni transformar el campo `imageSrc`
- Almacenar la URL de S3 tal cual en la columna `data` (JSONB)
- Agregar validación: si `imageSrc` es una data URL base64, rechazar con `400 Bad Request`
  y mensaje: `"imageSrc debe ser una URL de S3, no un data URL"`

---

##### `DELETE /api/images/temp/:s3Key` (nuevo — limpieza de S3)

Elimina una imagen temporal de S3 cuando el usuario la reemplaza o cancela.

**Request params:** `s3Key` (URL-encoded)

**Response:**
```json
{ "success": true }
```

**Lógica:**
- Validar que la `s3Key` pertenece al usuario autenticado (prefijo `temp/{userId}/`)
- Ejecutar `DeleteObjectCommand` de AWS SDK v3
- Responder 200 aunque el objeto ya no exista (idempotente)

---

##### `POST /api/images/temp/cleanup` (nuevo — limpieza automática)

Job programado o endpoint manual para eliminar imágenes temporales huérfanas de S3.

**Cuándo ejecutar:** Cron job diario a las 3 AM

**Lógica:**
- Listar objetos en `s3://fotogifty-temp/temp/` con más de 7 días de antigüedad
- Cruzar contra `temp_customizations` activas
- Eliminar objetos no referenciados

---

#### Bucket S3 sugerido para imágenes temporales

```
Bucket: fotogifty-temp (separado del bucket de producción fotogifty)
Prefijo: temp/{userId}/{timestamp}-{uuid}.{ext}
CORS: habilitado para PUT desde el dominio del frontend
Lifecycle: eliminar objetos con más de 7 días automáticamente
ACL: private (acceso solo vía presigned URLs)
```

**Política CORS para el bucket temporal:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT"],
    "AllowedOrigins": [
      "https://fotogifty.com",
      "https://*.vercel.app",
      "http://localhost:3000"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## Comparativa de estrategias

| Criterio | Estrategia A (límite body) | Estrategia B (S3 presigned) |
|---|---|---|
| **Complejidad backend** | Mínima (1 línea) | Media (3 nuevos endpoints) |
| **Complejidad frontend** | Ninguna | Media (upload a S3 antes de guardar) |
| **Calidad de imagen** | Sin pérdida | Sin pérdida |
| **Escalabilidad** | Baja | Alta |
| **Multi-dispositivo** | Funciona | Funciona |
| **Costo de storage DB** | Alto | Bajo |
| **Costo S3** | Sin cambio | Mínimo (imágenes temporales) |
| **Tiempo estimado backend** | 30 min | 1–2 días |
| **Tiempo estimado frontend** | 0 | 2–3 días |

---

## Recomendación

**Corto plazo (esta semana):** Implementar Estrategia A para desbloquear producción.

```javascript
app.use(express.json({ limit: '50mb' }));
```

**Mediano plazo (próximo sprint):** Implementar Estrategia B completa para escalar
correctamente y reducir costos de base de datos.

---

## Checklist de entrega (Estrategia A)

- [ ] Aumentar límite body-parser a `50mb` en Express
- [ ] Verificar límite en nginx/proxy (si aplica)
- [ ] Verificar límite en Railway/plataforma de hosting
- [ ] Verificar que el campo `data` de la tabla `temp_customizations` acepta TEXT/JSONB ilimitado
- [ ] Probar con payload de 40 MB (calendario completo 12 meses)

## Checklist de entrega (Estrategia B)

- [ ] Crear bucket S3 `fotogifty-temp` con lifecycle 7 días
- [ ] Configurar CORS en el bucket
- [ ] Implementar `POST /api/images/temp/presigned-url`
- [ ] Implementar `DELETE /api/images/temp/:s3Key`
- [ ] Implementar cron job de limpieza `POST /api/images/temp/cleanup`
- [ ] Validar que `PUT /customizations/temp` rechace data URLs base64
- [ ] Documentar en Swagger los tres endpoints nuevos
- [ ] Probar upload directo a S3 desde frontend (presigned URL)
