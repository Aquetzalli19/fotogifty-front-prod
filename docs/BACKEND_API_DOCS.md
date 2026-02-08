# Documentación API Backend - FotoGifty Admin

## Índice
1. [Gestión de Productos](#gestión-de-productos)
2. [Gestión de Pedidos](#gestión-de-pedidos)
3. [Modelos de Datos](#modelos-de-datos)

---

## Gestión de Productos

### 1. Obtener todos los productos
**Endpoint:** `GET /api/products`

**Query Parameters:**
- `status` (opcional): `active` | `inactive` | `all`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      d
    }
  ]
}
```

---

### 2. Obtener producto por ID
**Endpoint:** `GET /api/products/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "packageName": "Paquete Básico",
    "category": "Fotografía Impresa",
    "description": "Incluye 10 fotos impresas",
    "photoQuantity": 10,
    "packagePrice": 299.99,
    "itemStatus": true,
    "photoResolution": 300,
    "photoWidth": 10.16,
    "photoHeight": 15.24,
    "precio" : 141
  }
}
```

---

### 3. Crear nuevo producto
**Endpoint:** `POST /api/products`

**Request Body:**
```json
{
  "packageName": "Paquete Básico",
  "productClasification": "Fotografía Impresa",
  "description": "Incluye 10 fotos impresas en papel estándar",
  "photoQuantity": 10,
  "packagePrice": 299.99,
  "itemStatus": true,
  "photoResolution": 300,
  "photoWidth": 10.16,
  "photoHeight": 15.24
}
```

**Validaciones:**
- `packageName`: string, mínimo 1 carácter (requerido)
- `productClasification`: string, mínimo 1 carácter (requerido)
- `description`: string, mínimo 1 carácter (requerido)
- `photoQuantity`: number, mínimo 1 (requerido)
- `packagePrice`: number, mínimo 0 (requerido)
- `itemStatus`: boolean (requerido)
- `photoResolution`: number, mínimo 1 (requerido)
- `photoWidth`: number, mínimo 1 (requerido)
- `photoHeight`: number, mínimo 1 (requerido)

**Response:**
```json
{
  "success": true,
  "message": "Producto creado exitosamente",
  "data": {
    "id": 9,
    "packageName": "Paquete Básico",
    "productClasification": "Fotografía Impresa",
    "description": "Incluye 10 fotos impresas",
    "photoQuantity": 10,
    "packagePrice": 299.99,
    "itemStatus": true,
    "photoResolution": 300,
    "photoWidth": 10.16,
    "photoHeight": 15.24
  }
}
```

---

### 4. Actualizar producto
**Endpoint:** `PUT /api/products/:id`

**Request Body:** (todos los campos opcionales)
```json
{
  "packageName": "Paquete Básico Actualizado",
  "productClasification": "Fotografía Impresa",
  "description": "Nueva descripción",
  "photoQuantity": 15,
  "packagePrice": 349.99,
  "itemStatus": false,
  "photoResolution": 300,
  "photoWidth": 10.16,
  "photoHeight": 15.24
}
```

**Response:**
```json
{
  "success": true,
  "message": "Producto actualizado exitosamente",
  "data": {
    "id": 1,
    "packageName": "Paquete Básico Actualizado",
    "productClasification": "Fotografía Impresa",
    "description": "Nueva descripción",
    "photoQuantity": 15,
    "packagePrice": 349.99,
    "itemStatus": false,
    "photoResolution": 300,
    "photoWidth": 10.16,
    "photoHeight": 15.24
  }
}
```

---

### 5. Cambiar estado del producto
**Endpoint:** `PATCH /api/products/:id/status`

**Request Body:**
```json
{
  "itemStatus": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Estado del producto actualizado",
  "data": {
    "id": 1,
    "itemStatus": false
  }
}
```

---

### 6. Eliminar producto
**Endpoint:** `DELETE /api/products/:id`

**Response:**
```json
{
  "success": true,
  "message": "Producto eliminado exitosamente"
}
```

---

## Gestión de Pedidos

### 1. Obtener todos los pedidos
**Endpoint:** `GET /api/orders`

**Query Parameters:**
- `status` (opcional): `Enviado` | `Imprimiendo` | `Empaquetado` | `En reparto` | `Archivado` | `all`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "orderId": 1,
      "clientName": "Juan Pérez",
      "dateOfOrder": "2023-10-15",
      "orderItems": [
        {
          "productName": "Cuadro mediano",
          "package": "Mediano",
          "itemPrice": 299.99
        }
      ],
      "status": "Enviado",
      "images": []
    }
  ]
}
```

---

### 2. Obtener pedido por ID
**Endpoint:** `GET /api/orders/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": 1,
    "clientName": "Juan Pérez",
    "dateOfOrder": "2023-10-15",
    "orderItems": [
      {
        "productName": "Cuadro mediano",
        "package": "Mediano",
        "itemPrice": 299.99
      }
    ],
    "status": "Enviado",
    "images": []
  }
}
```

---

### 3. Actualizar estado del pedido
**Endpoint:** `PATCH /api/orders/:id/status`

**Request Body:**
```json
{
  "status": "Imprimiendo"
}
```

**Valores permitidos para status:**
- `Enviado` - Cliente envió las fotos
- `Imprimiendo` - Pedido en proceso de impresión
- `Empaquetado` - Pedido empaquetado
- `En reparto` - Pedido en camino al cliente
- `Archivado` - Pedido completado/archivado

**Response:**
```json
{
  "success": true,
  "message": "Estado del pedido actualizado",
  "data": {
    "orderId": 1,
    "status": "Imprimiendo"
  }
}
```

---

### 4. Obtener imágenes del pedido
**Endpoint:** `GET /api/orders/:id/images`

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": 1,
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ]
  }
}
```

---

## Modelos de Datos

### Producto (ItemPackage)
```typescript
{
  id: number;                      // ID único del producto
  packageName: string;             // Nombre del paquete
  productClasification: string;    // Clasificación del producto
  description: string;             // Descripción detallada
  photoQuantity: number;           // Cantidad de fotos incluidas
  packagePrice: number;            // Precio del paquete
  itemStatus: boolean;             // Estado activo/inactivo
  photoResolution: number;         // Resolución en píxeles
  photoWidth: number;              // Ancho en cm
  photoHeight: number;             // Alto en cm
}
```

**Clasificaciones predefinidas:**
- Calendario
- Print
- Ampliaciones
- Polaroid
- Fotografía Impresa
- Álbum Fotográfico

---

### Pedido (Order)
```typescript
{
  orderId: number;                 // ID único del pedido
  clientName: string;              // Nombre del cliente
  dateOfOrder: string;             // Fecha del pedido (YYYY-MM-DD)
  orderItems: OrderItem[];         // Items del pedido
  status: OrderStatus;             // Estado del pedido
  images: string[];                // URLs de las imágenes
}
```

---

### Item del Pedido (OrderItem)
```typescript
{
  productName: string;             // Nombre del producto
  package: string;                 // Tipo de paquete
  itemPrice: number;               // Precio del item
}
```

---

### Estados del Pedido (OrderStatus)
```typescript
type OrderStatus = 
  | "Enviado"        // Cliente envió las fotos
  | "Imprimiendo"    // En proceso de impresión
  | "Empaquetado"    // Empaquetado y listo
  | "En reparto"     // En camino al cliente
  | "Archivado";     // Completado/archivado
```

---

## Códigos de Error

### 400 - Bad Request
```json
{
  "success": false,
  "error": "Datos de entrada inválidos",
  "details": {
    "packageName": "El nombre del paquete es requerido",
    "photoQuantity": "La cantidad de fotos debe ser al menos 1"
  }
}
```

### 404 - Not Found
```json
{
  "success": false,
  "error": "Producto no encontrado"
}
```

### 500 - Internal Server Error
```json
{
  "success": false,
  "error": "Error interno del servidor"
}
```

---

## Notas Adicionales

### Filtros de Productos
- **Todos**: Retorna todos los productos sin filtro
- **Activos**: `itemStatus === true`
- **Inactivos**: `itemStatus === false`

### Flujo de Estados de Pedidos
```
Enviado → Imprimiendo → Empaquetado → En reparto → Archivado
```

### Formato de Fechas
- Todas las fechas deben estar en formato ISO 8601: `YYYY-MM-DD`
- Ejemplo: `2023-10-15`

### Unidades de Medida
- **Resolución**: píxeles (px)
- **Dimensiones**: centímetros (cm)
- **Precio**: moneda local (MXN)
