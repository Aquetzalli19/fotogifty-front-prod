# Documentación API Real - FotoGifty

Documentación basada en el Swagger de la API corriendo en `http://localhost:3001/api-docs`

## URL Base

```
http://localhost:3001/api
```

## Endpoints Disponibles

### 📦 Paquetes

#### Obtener todos los paquetes
```
GET /api/paquetes
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Paquete Básico",
      "categoria_id": 2,
      "descripcion": "Paquete básico de fotografía impresa",
      "cantidad_fotos": 10,
      "precio": 299.99,
      "estado": true,
      "resolucion_foto": 300,
      "ancho_foto": 10,
      "alto_foto": 15
    }
  ]
}
```

#### Obtener paquete por ID
```
GET /api/paquetes/:id
```

**Parámetros:**
- `id` (path): ID del paquete

#### Obtener paquetes por categoría
```
GET /api/paquetes/categoria/:categoriaId
```

**Parámetros:**
- `categoriaId` (path): ID de la categoría

#### Crear paquete
```
POST /api/paquetes
```

**Body:**
```json
{
  "nombre": "Paquete Básico",
  "categoria_id": 1,
  "descripcion": "Incluye 10 fotos impresas",
  "cantidad_fotos": 10,
  "precio": 299.99,
  "estado": true,
  "resolucion_foto": 300,
  "ancho_foto": 10.16,
  "alto_foto": 15.24
}
```

**Campos requeridos:**
- `nombre`
- `cantidad_fotos`
- `precio`
- `estado`

#### Actualizar paquete
```
PUT /api/paquetes/:id
```

**Body:** (todos los campos opcionales)
```json
{
  "nombre": "Paquete Actualizado",
  "precio": 399.99,
  "estado": false
}
```

#### Eliminar paquete
```
DELETE /api/paquetes/:id
```

**Nota:** Cambia el estado a inactivo, no elimina físicamente

---

### 🏷️ Categorías

#### Obtener todas las categorías
```
GET /api/categorias
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Fotografía Impresa",
      "descripcion": "Paquetes de fotografía impresa",
      "activo": true,
      "fecha_creacion": "2025-11-23T05:06:45.826Z"
    }
  ]
}
```

#### Obtener categoría por ID
```
GET /api/categorias/:id
```

#### Crear categoría
```
POST /api/categorias
```

**Body:**
```json
{
  "nombre": "Calendario",
  "descripcion": "Categoría para productos de calendarios",
  "activo": true
}
```

**Campos requeridos:**
- `nombre`

#### Actualizar categoría
```
PUT /api/categorias/:id
```

#### Eliminar categoría
```
DELETE /api/categorias/:id
```

---

### 🔐 Autenticación

#### Login de Cliente
```
POST /api/auth/login/cliente
```

**Body:**
```json
{
  "email": "cliente@ejemplo.com",
  "password": "password123"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "id": 1,
    "email": "cliente@ejemplo.com",
    "nombre": "Juan",
    "apellido": "Pérez"
  }
}
```

#### Login de Administrador
```
POST /api/auth/login/admin
```

**Body:** (mismo que login de cliente)

#### Registro de Administrador
```
POST /api/admin/registro
```

**Body:**
```json
{
  "email": "admin@ejemplo.com",
  "password": "password123",
  "nombre": "Carlos",
  "apellido": "García",
  "telefono": "+34698765432",
  "tipo": "admin"
}
```

**Campos requeridos:**
- `email`
- `password`
- `nombre`
- `apellido`
- `tipo` (valores: `"admin"` | `"super_admin"`)

---

### 📸 Fotos

#### Subir foto
```
POST /api/fotos/upload
```

**Content-Type:** `multipart/form-data`

**Nota:** Este endpoint sube fotos a S3 y guarda la referencia en la BD

---

### 📋 Pedidos

#### Crear pedido
```
POST /api/pedidos
```

**Body:**
```json
{
  "nombre_cliente": "Juan Pérez",
  "email_cliente": "juan@ejemplo.com",
  "direccion_envio": "Calle Principal 123",
  "items_pedido": [
    {
      "paquete_id": 1,
      "cantidad": 2,
      "precio_unitario": 299.99
    }
  ]
}
```

---

## Servicios Creados en el Frontend

### Paquetes (`src/services/packages.ts`)
```typescript
import { obtenerTodosPaquetes, obtenerPaquetePorId, obtenerPaquetesPorCategoria } from '@/services/packages';

// Obtener todos los paquetes
const { data, success } = await obtenerTodosPaquetes();

// Obtener paquete específico
const { data: paquete } = await obtenerPaquetePorId(1);

// Obtener por categoría
const { data: paquetes } = await obtenerPaquetesPorCategoria(1);
```

### Categorías (`src/services/categories.ts`)
```typescript
import { obtenerTodasCategorias, crearCategoria } from '@/services/categories';

// Obtener todas
const { data } = await obtenerTodasCategorias();

// Crear nueva
const { data: nueva } = await crearCategoria({
  nombre: 'Calendario',
  descripcion: 'Productos de calendarios',
  activo: true
});
```

### Autenticación (`src/services/auth.ts`)
```typescript
import { loginCliente, loginAdmin } from '@/services/auth';

// Login cliente
const { data: usuario } = await loginCliente({
  email: 'cliente@ejemplo.com',
  password: 'password123'
});

// Login admin
const { data: admin } = await loginAdmin({
  email: 'admin@ejemplo.com',
  password: 'password123'
});
```

---

## Probar la Conexión

### Opción 1: Página de Prueba

Ve a: `http://localhost:3000/test-api`

Esta página tiene botones para probar los diferentes endpoints.

### Opción 2: Desde la Consola del Navegador

```javascript
// En la consola del navegador
const response = await fetch('http://localhost:3001/api/paquetes');
const data = await response.json();
console.log(data);
```

### Opción 3: cURL desde la Terminal

```bash
# Obtener paquetes
curl http://localhost:3001/api/paquetes

# Obtener categorías
curl http://localhost:3001/api/categorias

# Login de cliente
curl -X POST http://localhost:3001/api/auth/login/cliente \
  -H "Content-Type: application/json" \
  -d '{"email":"cliente@ejemplo.com","password":"password123"}'
```

---

## Diferencias con la Documentación Anterior

### Nombres de Campos

**Antes (Documentación teórica):**
- `packageName`
- `productClasification`
- `photoQuantity`
- `packagePrice`
- `itemStatus`

**Ahora (API Real):**
- `nombre`
- `categoria_id`
- `cantidad_fotos`
- `precio`
- `estado`

### Estructura de Respuesta

La API real siempre retorna:
```json
{
  "success": boolean,
  "data": any,
  "message": string (opcional)
}
```

---

## Próximos Pasos

1. ✅ Servicios creados: `packages.ts`, `categories.ts`, `auth.ts`
2. ✅ Página de prueba creada: `/test-api`
3. ⏳ Migrar componentes del frontend para usar estos servicios
4. ⏳ Implementar manejo de autenticación (tokens/cookies)
5. ⏳ Agregar servicios para pedidos cuando estén disponibles
6. ⏳ Implementar upload de fotos con FormData

---

## Notas Importantes

- La API usa **snake_case** (ej: `categoria_id`) mientras el frontend usa **camelCase**
- Considera crear un mapper/transformer para convertir entre ambos formatos
- El campo `estado` es booleano: `true` = activo, `false` = inactivo
- Las eliminaciones son soft-deletes (cambian estado a inactivo)
