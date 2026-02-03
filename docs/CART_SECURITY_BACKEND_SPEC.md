# Especificación de Backend: Seguridad de Carrito y Customizaciones

## Resumen del Problema

Actualmente, los datos del carrito y las customizaciones de fotos se almacenan en `localStorage` del navegador de forma global. Esto causa que cuando un usuario cierra sesión y otro inicia sesión en el mismo navegador, el segundo usuario puede ver las imágenes y datos del primer usuario.

## Objetivo

Implementar un sistema donde los datos del carrito y customizaciones estén asociados a cada usuario específico, permitiendo:
1. Persistir el carrito entre sesiones del mismo usuario
2. Aislar completamente los datos entre usuarios diferentes
3. Recuperar el carrito abandonado cuando el usuario vuelve a iniciar sesión

---

## Modelo de Datos

### Tabla: `carritos_temporales`

Almacena los items del carrito que no han sido pagados.

```sql
CREATE TABLE carritos_temporales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    datos JSON NOT NULL,  -- Contenido del carrito serializado
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_cart (usuario_id)  -- Solo un carrito por usuario
);
```

**Estructura del campo `datos` (JSON):**
```json
{
  "items": [
    {
      "id": "unique-item-id",
      "packageId": 123,
      "packageName": "Pack 50 Prints 4x6",
      "categoryName": "Prints",
      "price": 299.99,
      "quantity": 2,
      "imageUrl": "/product-image.jpg",
      "dimensions": {
        "width": 4,
        "height": 6,
        "resolution": 300
      }
    }
  ],
  "lastModified": 1706889600000
}
```

### Tabla: `customizaciones_temporales`

Almacena las customizaciones de fotos (transformaciones, efectos, etc.) - **SIN las imágenes base64**.

```sql
CREATE TABLE customizaciones_temporales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    cart_item_id VARCHAR(100) NOT NULL,  -- ID del item en el carrito
    instance_index INT NOT NULL,          -- Índice de la instancia (para quantity > 1)
    editor_type ENUM('standard', 'calendar', 'polaroid') NOT NULL,
    datos JSON NOT NULL,                  -- Customización serializada (sin imágenes)
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_customization (usuario_id, cart_item_id, instance_index)
);
```

**Estructura del campo `datos` para Standard Editor (JSON):**
```json
{
  "images": [
    {
      "id": 1,
      "s3Key": "temp/user123/image1.jpg",  -- Referencia a S3, NO base64
      "transformations": {
        "scale": 1.2,
        "rotation": 90,
        "mirrorX": false,
        "mirrorY": false,
        "posX": 10,
        "posY": -5
      },
      "effects": {
        "brightness": 10,
        "contrast": 0,
        "saturation": -5,
        "sepia": 0
      },
      "selectedFilter": "none",
      "canvasStyle": {
        "backgroundColor": "#FFFFFF",
        "borderColor": "#000000",
        "borderWidth": 2
      },
      "copies": 3
    }
  ],
  "canvasWidth": 1200,
  "canvasHeight": 1800,
  "canvasOrientation": "portrait"
}
```

### Tabla: `imagenes_temporales`

Almacena referencias a las imágenes subidas temporalmente (antes de completar el pago).

```sql
CREATE TABLE imagenes_temporales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    s3_key VARCHAR(500) NOT NULL,         -- Ruta en S3: temp/user123/uuid.jpg
    s3_url VARCHAR(1000),                 -- URL firmada (opcional, se genera bajo demanda)
    original_filename VARCHAR(255),
    mime_type VARCHAR(100),
    size_bytes INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,                  -- Para limpieza automática

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_user_images (usuario_id),
    INDEX idx_expires (expires_at)
);
```

---

## Endpoints API

### 1. Carrito Temporal

#### `GET /api/cart/temp`
Obtiene el carrito temporal del usuario autenticado.

**Headers:**
```
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "lastModified": 1706889600000
  }
}
```

**Response 404 (sin carrito):**
```json
{
  "success": true,
  "data": null
}
```

---

#### `PUT /api/cart/temp`
Guarda/actualiza el carrito temporal del usuario.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "items": [
    {
      "id": "unique-item-id",
      "packageId": 123,
      "packageName": "Pack 50 Prints 4x6",
      "categoryName": "Prints",
      "price": 299.99,
      "quantity": 2,
      "imageUrl": "/product-image.jpg",
      "dimensions": {
        "width": 4,
        "height": 6,
        "resolution": 300
      }
    }
  ]
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Carrito guardado correctamente"
}
```

---

#### `DELETE /api/cart/temp`
Elimina el carrito temporal del usuario (llamado después de pago exitoso o manualmente).

**Headers:**
```
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Carrito eliminado correctamente"
}
```

---

### 2. Customizaciones Temporales

#### `GET /api/customizations/temp`
Obtiene todas las customizaciones temporales del usuario.

**Headers:**
```
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "cartItemId": "item-123",
      "instanceIndex": 0,
      "editorType": "standard",
      "data": {...},
      "completed": true
    }
  ]
}
```

---

#### `PUT /api/customizations/temp/:cartItemId/:instanceIndex`
Guarda/actualiza una customización específica.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "editorType": "standard",
  "data": {
    "images": [...],
    "canvasWidth": 1200,
    "canvasHeight": 1800
  },
  "completed": true
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Customización guardada correctamente"
}
```

---

#### `DELETE /api/customizations/temp/:cartItemId/:instanceIndex`
Elimina una customización específica.

**Response 200:**
```json
{
  "success": true,
  "message": "Customización eliminada"
}
```

---

#### `DELETE /api/customizations/temp`
Elimina TODAS las customizaciones del usuario (llamado en logout o después de pago).

**Response 200:**
```json
{
  "success": true,
  "message": "Todas las customizaciones eliminadas"
}
```

---

### 3. Imágenes Temporales

#### `POST /api/images/temp`
Sube una imagen temporal a S3.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body:**
```
file: (binary)
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 456,
    "s3Key": "temp/user123/abc123.jpg",
    "url": "https://s3.../temp/user123/abc123.jpg?signed..."
  }
}
```

**Notas de implementación:**
- Las imágenes se guardan en el bucket S3 bajo el prefijo `temp/{userId}/`
- Se debe configurar una regla de lifecycle en S3 para eliminar imágenes temporales después de 7 días
- La URL firmada expira en 1 hora

---

#### `GET /api/images/temp/:imageId/url`
Obtiene una URL firmada fresca para una imagen temporal.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "url": "https://s3.../temp/user123/abc123.jpg?signed...",
    "expiresIn": 3600
  }
}
```

---

#### `DELETE /api/images/temp/:imageId`
Elimina una imagen temporal específica.

---

#### `DELETE /api/images/temp`
Elimina TODAS las imágenes temporales del usuario.

---

### 4. Limpieza en Logout (Opcional)

#### `POST /api/auth/logout`
Si desean manejar la limpieza desde el backend.

**Headers:**
```
Authorization: Bearer {token}
```

**Acciones del backend:**
1. Invalidar el token (si usan blacklist)
2. **Opcional:** Mantener carrito/customizaciones para recuperación futura
3. **Opcional:** Eliminar imágenes temporales huérfanas

---

## Flujo de Datos

### Login de Usuario

```
1. Usuario hace login
2. Frontend llama GET /api/cart/temp
3. Si hay carrito guardado:
   a. Cargar items en cart-store
   b. Llamar GET /api/customizations/temp
   c. Cargar customizaciones en customization-store
4. Si NO hay carrito:
   a. Verificar localStorage por datos huérfanos
   b. Si hay datos de otro usuario (userId diferente), LIMPIAR
   c. Si hay datos del mismo usuario, sincronizar con backend
```

### Guardado Automático (Debounced)

```
1. Usuario modifica carrito o customización
2. Después de 2 segundos de inactividad:
   a. PUT /api/cart/temp (si cambió el carrito)
   b. PUT /api/customizations/temp/:id (si cambió customización)
3. Actualizar localStorage con userId para validación offline
```

### Logout de Usuario

```
1. Usuario hace logout
2. Frontend:
   a. Limpiar TODOS los stores de Zustand
   b. Limpiar localStorage (claves de carrito/customización)
3. Backend (opcional):
   a. Los datos persisten en DB para cuando vuelva
   b. O se eliminan según política de negocio
```

### Pago Exitoso

```
1. Pago confirmado por Stripe webhook
2. Backend:
   a. Crear pedido en tabla pedidos
   b. Mover imágenes de temp/ a fotos/ en S3
   c. Eliminar carrito_temporal
   d. Eliminar customizaciones_temporales
   e. Eliminar registros de imagenes_temporales
3. Frontend:
   a. Limpiar cart-store
   b. Limpiar customization-store
   c. Limpiar localStorage
```

---

## Consideraciones de Seguridad

### Validación de Propiedad

**CRÍTICO:** Cada endpoint DEBE validar que el `usuario_id` del recurso coincida con el usuario autenticado.

```javascript
// Ejemplo en middleware/controller
const userId = req.user.id;  // Del token JWT
const cart = await CartTemp.findOne({ usuario_id: userId });

// NUNCA permitir acceso a recursos de otros usuarios
if (cart.usuario_id !== userId) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

### Limpieza Automática

Configurar un CRON job para limpiar datos huérfanos:

```sql
-- Eliminar carritos temporales de más de 30 días
DELETE FROM carritos_temporales
WHERE updated_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Eliminar customizaciones huérfanas
DELETE FROM customizaciones_temporales
WHERE updated_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Eliminar imágenes temporales expiradas
DELETE FROM imagenes_temporales
WHERE expires_at < NOW();
```

### S3 Lifecycle Policy

```json
{
  "Rules": [
    {
      "ID": "DeleteTempImages",
      "Prefix": "temp/",
      "Status": "Enabled",
      "Expiration": {
        "Days": 7
      }
    }
  ]
}
```

---

## Prioridad de Implementación

### Fase 1 (Crítica - Inmediata)
1. `PUT /api/cart/temp` - Guardar carrito
2. `GET /api/cart/temp` - Recuperar carrito
3. `DELETE /api/cart/temp` - Limpiar carrito

### Fase 2 (Alta - Corto plazo)
4. `PUT /api/customizations/temp` - Guardar customizaciones (sin imágenes)
5. `GET /api/customizations/temp` - Recuperar customizaciones
6. `DELETE /api/customizations/temp` - Limpiar customizaciones

### Fase 3 (Media - Mediano plazo)
7. `POST /api/images/temp` - Subir imágenes temporales a S3
8. `GET /api/images/temp/:id/url` - URLs firmadas
9. `DELETE /api/images/temp` - Limpiar imágenes

---

## Respuesta Esperada del Backend

Por favor confirmar:
1. ¿Es factible implementar esta estructura?
2. ¿Hay limitaciones de tamaño en el campo JSON?
3. ¿Prefieren almacenar imágenes en S3 o en base64 en la DB?
4. ¿Qué política de retención prefieren para carritos abandonados?
5. ¿Necesitan endpoints adicionales?

---

## Contacto

Para dudas sobre esta especificación, contactar al equipo de frontend.

Documento creado: $(date)
Versión: 1.0
