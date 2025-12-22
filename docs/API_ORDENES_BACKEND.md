# Documentación API Backend - Sistema de Órdenes FotoGifty

## Resumen del Sistema

El sistema maneja 4 tipos de productos fotográficos:
1. **Prints (Impresiones)** - Paquetes dinámicos con diferentes cantidades y tamaños
2. **Ampliaciones** - Paquetes dinámicos con diferentes tamaños
3. **Polaroids** - Paquetes dinámicos con diferentes cantidades
4. **Calendarios** - Precio dinámico, siempre 12 fotos fijas

---

## 1. ENDPOINTS DE PRODUCTOS/PAQUETES

### 1.1 Obtener Categorías de Productos
```
GET /api/productos/categorias
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Prints",
      "descripcion": "Impresiones fotográficas",
      "activo": true,
      "es_dinamico": true
    },
    {
      "id": 2,
      "nombre": "Ampliaciones",
      "descripcion": "Ampliaciones de fotos",
      "activo": true,
      "es_dinamico": true
    },
    {
      "id": 3,
      "nombre": "Polaroids",
      "descripcion": "Fotos estilo polaroid",
      "activo": true,
      "es_dinamico": true
    },
    {
      "id": 4,
      "nombre": "Calendarios",
      "descripcion": "Calendarios personalizados",
      "activo": true,
      "es_dinamico": false
    }
  ]
}
```

### 1.2 Obtener Paquetes por Categoría
```
GET /api/productos/categorias/{categoria_id}/paquetes
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "categoria_id": 1,
      "nombre": "Pack 50 Prints 4x6",
      "descripcion": "Paquete de 50 impresiones en tamaño 4x6 pulgadas",
      "precio": 12.00,
      "cantidad_fotos": 50,
      "ancho_foto": 4,
      "alto_foto": 6,
      "resolucion_dpi": 300,
      "imagen_url": "https://...",
      "activo": true
    }
  ]
}
```

### 1.3 Obtener Todos los Paquetes Activos (Para catálogo)
```
GET /api/paquetes?activo=true
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "categoria": {
        "id": 1,
        "nombre": "Prints"
      },
      "paquetes": [
        {
          "id": 1,
          "nombre": "Pack 50 Prints 4x6",
          "descripcion": "...",
          "precio": 12.00,
          "cantidad_fotos": 50,
          "ancho_foto": 4,
          "alto_foto": 6,
          "resolucion_dpi": 300,
          "imagen_url": "https://..."
        }
      ]
    },
    {
      "categoria": {
        "id": 4,
        "nombre": "Calendarios"
      },
      "paquetes": [
        {
          "id": 10,
          "nombre": "Calendario de Pared",
          "descripcion": "Calendario personalizado 12 meses",
          "precio": 25.99,
          "cantidad_fotos": 12,
          "ancho_foto": 8,
          "alto_foto": 11,
          "resolucion_dpi": 300,
          "imagen_url": "https://..."
        }
      ]
    }
  ]
}
```

---

## 2. ENDPOINTS DE ÓRDENES

### 2.1 Crear Orden
```
POST /api/ordenes
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "direccion_envio_id": 1,
  "metodo_pago": "stripe",
  "stripe_payment_intent_id": "pi_xxxxx",
  "items": [
    {
      "paquete_id": 1,
      "cantidad": 2,
      "precio_unitario": 12.00,
      "imagenes": [
        {
          "orden": 1,
          "imagen_url": "https://storage.../imagen1.jpg",
          "imagen_editada_url": "https://storage.../imagen1_editada.jpg"
        },
        {
          "orden": 2,
          "imagen_url": "https://storage.../imagen2.jpg",
          "imagen_editada_url": "https://storage.../imagen2_editada.jpg"
        }
      ]
    },
    {
      "paquete_id": 10,
      "cantidad": 1,
      "precio_unitario": 25.99,
      "imagenes": [
        {
          "orden": 1,
          "mes": "Enero",
          "imagen_url": "https://storage.../cal_enero.jpg",
          "imagen_editada_url": "https://storage.../cal_enero_editada.jpg"
        },
        {
          "orden": 2,
          "mes": "Febrero",
          "imagen_url": "https://storage.../cal_febrero.jpg",
          "imagen_editada_url": "https://storage.../cal_febrero_editada.jpg"
        }
      ]
    }
  ],
  "subtotal": 49.99,
  "iva": 8.00,
  "total": 57.99,
  "notas": "Entregar en horario de oficina"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "numero_orden": "ORD-2024-000123",
    "usuario_id": 1,
    "estado": "pendiente",
    "subtotal": 49.99,
    "iva": 8.00,
    "total": 57.99,
    "fecha_creacion": "2024-12-15T20:00:00Z",
    "fecha_estimada_entrega": "2024-12-22T20:00:00Z"
  },
  "message": "Orden creada exitosamente"
}
```

### 2.2 Obtener Órdenes del Usuario
```
GET /api/ordenes/mis-ordenes
```

**Headers:**
```
Authorization: Bearer {token}
```

**Query Params (opcionales):**
- `estado`: filtrar por estado (pendiente, en_proceso, impresion, empaquetado, enviado, entregado, cancelado)
- `page`: número de página
- `limit`: cantidad por página

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "numero_orden": "ORD-2024-000123",
      "estado": "en_proceso",
      "total": 57.99,
      "fecha_creacion": "2024-12-15T20:00:00Z",
      "fecha_estimada_entrega": "2024-12-22T20:00:00Z",
      "items_count": 3,
      "direccion_envio": {
        "alias": "Casa",
        "ciudad": "CDMX"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25
  }
}
```

### 2.3 Obtener Detalle de Orden
```
GET /api/ordenes/{orden_id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "numero_orden": "ORD-2024-000123",
    "usuario": {
      "id": 1,
      "nombre": "Juan",
      "apellido": "Pérez",
      "email": "juan@email.com"
    },
    "estado": "en_proceso",
    "subtotal": 49.99,
    "iva": 8.00,
    "total": 57.99,
    "fecha_creacion": "2024-12-15T20:00:00Z",
    "fecha_actualizacion": "2024-12-16T10:00:00Z",
    "fecha_estimada_entrega": "2024-12-22T20:00:00Z",
    "direccion_envio": {
      "id": 1,
      "alias": "Casa",
      "direccion": "Calle Principal 123",
      "ciudad": "CDMX",
      "estado": "CDMX",
      "codigo_postal": "06600",
      "pais": "México"
    },
    "items": [
      {
        "id": 1,
        "paquete": {
          "id": 1,
          "nombre": "Pack 50 Prints 4x6",
          "categoria": "Prints"
        },
        "cantidad": 2,
        "precio_unitario": 12.00,
        "subtotal": 24.00,
        "imagenes": [
          {
            "id": 1,
            "orden": 1,
            "imagen_url": "https://...",
            "imagen_editada_url": "https://...",
            "estado_impresion": "pendiente"
          }
        ]
      }
    ],
    "historial_estados": [
      {
        "estado": "pendiente",
        "fecha": "2024-12-15T20:00:00Z",
        "nota": "Orden creada"
      },
      {
        "estado": "en_proceso",
        "fecha": "2024-12-16T10:00:00Z",
        "nota": "Pago confirmado"
      }
    ],
    "pago": {
      "metodo": "stripe",
      "estado": "completado",
      "stripe_payment_intent_id": "pi_xxxxx"
    }
  }
}
```

### 2.4 Cancelar Orden (Solo si está en estado pendiente)
```
POST /api/ordenes/{orden_id}/cancelar
```

**Request Body:**
```json
{
  "motivo": "Ya no necesito el producto"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Orden cancelada exitosamente"
}
```

---

## 3. ENDPOINTS ADMIN/STORE - GESTIÓN DE ÓRDENES

### 3.1 Obtener Todas las Órdenes (Admin/Store)
```
GET /api/admin/ordenes
```

**Query Params:**
- `estado`: filtrar por estado
- `fecha_desde`: fecha inicio
- `fecha_hasta`: fecha fin
- `page`, `limit`: paginación

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "numero_orden": "ORD-2024-000123",
      "cliente": {
        "id": 1,
        "nombre": "Juan Pérez",
        "email": "juan@email.com"
      },
      "estado": "en_proceso",
      "total": 57.99,
      "fecha_creacion": "2024-12-15T20:00:00Z",
      "items_count": 3
    }
  ]
}
```

### 3.2 Actualizar Estado de Orden
```
PATCH /api/admin/ordenes/{orden_id}/estado
```

**Request Body:**
```json
{
  "estado": "impresion",
  "nota": "Iniciando proceso de impresión"
}
```

**Estados válidos:**
- `pendiente` - Orden recibida, esperando pago
- `en_proceso` - Pago confirmado, preparando
- `impresion` - En proceso de impresión
- `empaquetado` - Impreso, empaquetando
- `enviado` - Enviado al cliente
- `entregado` - Entregado al cliente
- `cancelado` - Orden cancelada

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "estado": "impresion",
    "fecha_actualizacion": "2024-12-16T14:00:00Z"
  },
  "message": "Estado actualizado exitosamente"
}
```

### 3.3 Agregar Número de Seguimiento
```
PATCH /api/admin/ordenes/{orden_id}/seguimiento
```

**Request Body:**
```json
{
  "numero_seguimiento": "1Z999AA10123456784",
  "paqueteria": "UPS"
}
```

---

## 4. ENDPOINTS DE IMÁGENES

### 4.1 Subir Imagen
```
POST /api/imagenes/upload
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
- `imagen`: archivo de imagen
- `tipo`: "original" | "editada"

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "url": "https://storage.../imagen_uuid.jpg",
    "thumbnail_url": "https://storage.../imagen_uuid_thumb.jpg",
    "ancho": 1200,
    "alto": 800,
    "tamano_bytes": 245000
  }
}
```

### 4.2 Subir Imagen Editada (Canvas del editor)
```
POST /api/imagenes/upload-editada
```

**Request Body:**
```json
{
  "imagen_base64": "data:image/jpeg;base64,...",
  "imagen_original_id": 1,
  "configuracion_edicion": {
    "filtro": "sepia",
    "brillo": 10,
    "contraste": 5,
    "rotacion": 0
  }
}
```

---

## 5. ENDPOINTS DE PAGOS (Stripe)

### 5.1 Crear Payment Intent
```
POST /api/pagos/crear-intent
```

**Request Body:**
```json
{
  "monto": 5799,
  "moneda": "mxn",
  "orden_temporal_id": "temp_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "client_secret": "pi_xxx_secret_xxx",
    "payment_intent_id": "pi_xxx"
  }
}
```

### 5.2 Confirmar Pago
```
POST /api/pagos/confirmar
```

**Request Body:**
```json
{
  "payment_intent_id": "pi_xxx",
  "orden_id": 123
}
```

---

## 6. RELACIONES IMPORTANTES

### Orden → Usuario → Dirección

Cada orden DEBE estar relacionada a:
1. **Usuario**: El cliente que realiza la compra (autenticado con JWT)
2. **Dirección de envío**: Una dirección válida del usuario

```
Usuario (1) ──────< (N) Direcciones
    │
    │
    └──────< (N) Ordenes >──────── (1) Dirección de envío
```

### Validaciones requeridas al crear orden:
1. El `usuario_id` se obtiene del token JWT (no se envía en el body)
2. La `direccion_envio_id` debe pertenecer al usuario autenticado
3. Si el usuario no tiene direcciones, no puede crear una orden

### Endpoint para obtener direcciones del usuario:
```
GET /api/direcciones
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "usuario_id": 5,
      "alias": "Casa",
      "pais": "México",
      "estado": "CDMX",
      "ciudad": "Ciudad de México",
      "codigo_postal": "06600",
      "direccion": "Calle Principal 123",
      "numero_casa": "45",
      "numero_departamento": "3B",
      "especificaciones": "Edificio azul, tocar timbre 3",
      "predeterminada": true
    }
  ]
}
```

---

## 7. MODELOS DE BASE DE DATOS SUGERIDOS

### Tabla: usuarios
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PK | ID único |
| email | VARCHAR(255) | Email único |
| password | VARCHAR(255) | Contraseña hasheada |
| nombre | VARCHAR(100) | Nombre |
| apellido | VARCHAR(100) | Apellido |
| telefono | VARCHAR(20) | Teléfono |
| tipo | ENUM | cliente, admin, super_admin, store |
| activo | BOOLEAN | Estado |
| fecha_creacion | TIMESTAMP | Fecha creación |
| fecha_ultima_conexion | TIMESTAMP | Última conexión |

### Tabla: direcciones
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PK | ID único |
| usuario_id | INT FK | **Referencia a usuario** |
| alias | VARCHAR(50) | Nombre de la dirección (Casa, Trabajo) |
| pais | VARCHAR(100) | País |
| estado | VARCHAR(100) | Estado/Región |
| ciudad | VARCHAR(100) | Ciudad |
| codigo_postal | VARCHAR(20) | Código postal |
| direccion | VARCHAR(255) | Calle y número |
| numero_casa | VARCHAR(20) | Número exterior |
| numero_departamento | VARCHAR(20) | Número interior/depto |
| especificaciones | TEXT | Referencias adicionales |
| predeterminada | BOOLEAN | Si es la dirección por defecto |
| fecha_creacion | TIMESTAMP | Fecha creación |

### Tabla: categorias_producto
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PK | ID único |
| nombre | VARCHAR(100) | Nombre (Prints, Ampliaciones, etc.) |
| descripcion | TEXT | Descripción |
| es_dinamico | BOOLEAN | Si permite múltiples paquetes |
| activo | BOOLEAN | Estado |
| fecha_creacion | TIMESTAMP | Fecha creación |

### Tabla: paquetes
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PK | ID único |
| categoria_id | INT FK | Referencia a categoría |
| nombre | VARCHAR(200) | Nombre del paquete |
| descripcion | TEXT | Descripción |
| precio | DECIMAL(10,2) | Precio |
| cantidad_fotos | INT | Número de fotos requeridas |
| ancho_foto | DECIMAL(5,2) | Ancho en pulgadas |
| alto_foto | DECIMAL(5,2) | Alto en pulgadas |
| resolucion_dpi | INT | Resolución requerida |
| imagen_url | VARCHAR(500) | URL imagen de muestra |
| activo | BOOLEAN | Estado |
| fecha_creacion | TIMESTAMP | Fecha creación |

### Tabla: ordenes
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PK | ID único |
| numero_orden | VARCHAR(50) | Número legible (ORD-2024-000123) |
| usuario_id | INT FK | **Referencia a usuario (REQUERIDO)** |
| direccion_envio_id | INT FK | **Referencia a dirección (REQUERIDO)** |
| estado | ENUM | Estado de la orden |
| subtotal | DECIMAL(10,2) | Subtotal |
| iva | DECIMAL(10,2) | IVA |
| total | DECIMAL(10,2) | Total |
| notas | TEXT | Notas del cliente |
| numero_seguimiento | VARCHAR(100) | Tracking |
| paqueteria | VARCHAR(50) | Empresa de envío |
| fecha_creacion | TIMESTAMP | Fecha creación |
| fecha_actualizacion | TIMESTAMP | Última actualización |
| fecha_estimada_entrega | DATE | Fecha estimada |

**Constraints:**
- `usuario_id` → `usuarios.id` (ON DELETE RESTRICT)
- `direccion_envio_id` → `direcciones.id` (ON DELETE RESTRICT)
- La dirección debe pertenecer al mismo usuario de la orden

### Tabla: orden_items
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PK | ID único |
| orden_id | INT FK | Referencia a orden |
| paquete_id | INT FK | Referencia a paquete |
| cantidad | INT | Cantidad |
| precio_unitario | DECIMAL(10,2) | Precio al momento de compra |
| subtotal | DECIMAL(10,2) | Subtotal del item |

### Tabla: orden_item_imagenes
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PK | ID único |
| orden_item_id | INT FK | Referencia a item |
| orden | INT | Orden/posición de la imagen |
| mes | VARCHAR(20) | Para calendarios (Enero, Febrero...) |
| imagen_original_url | VARCHAR(500) | URL imagen original |
| imagen_editada_url | VARCHAR(500) | URL imagen editada |
| estado_impresion | ENUM | pendiente, impreso |

### Tabla: orden_historial
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PK | ID único |
| orden_id | INT FK | Referencia a orden |
| estado | ENUM | Estado |
| nota | TEXT | Nota del cambio |
| usuario_id | INT FK | Quién hizo el cambio |
| fecha | TIMESTAMP | Fecha del cambio |

### Tabla: pagos
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PK | ID único |
| orden_id | INT FK | Referencia a orden |
| metodo | VARCHAR(50) | stripe, paypal, etc. |
| estado | ENUM | pendiente, completado, fallido, reembolsado |
| monto | DECIMAL(10,2) | Monto |
| stripe_payment_intent_id | VARCHAR(100) | ID de Stripe |
| fecha | TIMESTAMP | Fecha del pago |

---

## 8. FLUJO DE COMPRA (Frontend → Backend)

```
1. Usuario navega catálogo
   GET /api/paquetes?activo=true
   
2. Usuario agrega items al carrito (localStorage)

3. Usuario va al checkout (Step 1: Mi Carrito)
   - Muestra items del carrito local
   
4. Usuario sube fotos (Step 2: Elegir fotos)
   POST /api/imagenes/upload (por cada foto)
   POST /api/imagenes/upload-editada (después de editar)
   
5. Usuario selecciona dirección
   GET /api/direcciones (obtener direcciones guardadas)
   
6. Usuario procede al pago (Step 3: Pago)
   POST /api/pagos/crear-intent
   - Frontend usa Stripe Elements para capturar tarjeta
   - Stripe confirma el pago
   
7. Crear orden después de pago exitoso
   POST /api/ordenes
   
8. Mostrar confirmación (Step 4: Confirmación)
   GET /api/ordenes/{orden_id}
```

---

## 9. CONSIDERACIONES ESPECIALES

### Calendarios
- Siempre requieren exactamente 12 fotos
- Cada foto debe tener asignado un mes
- El precio es configurable pero la cantidad de fotos es fija

### Prints/Ampliaciones/Polaroids
- Cantidad de fotos variable según el paquete
- Diferentes tamaños disponibles
- Precios dinámicos según paquete

### Validaciones Backend
1. Verificar que la cantidad de imágenes coincida con `cantidad_fotos` del paquete
2. Verificar que el precio enviado coincida con el precio actual del paquete
3. Verificar que el usuario tenga una dirección válida
4. Verificar que el pago se haya completado antes de crear la orden

### Almacenamiento de Imágenes
- Usar servicio de almacenamiento (S3, Cloudinary, etc.)
- Guardar imagen original y editada por separado
- Generar thumbnails para vista previa
