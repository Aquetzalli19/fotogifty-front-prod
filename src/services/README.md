# Servicios de API

Este directorio contiene las funciones para interactuar con el backend de FotoGifty.

## Configuración

Las peticiones se realizan a la URL base configurada en las variables de entorno:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Uso

### Productos

```typescript
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
  getProductsByCategory,
} from '@/services/products';

// Obtener todos los productos activos
const { data, success } = await getAllProducts('active');

// Obtener un producto específico
const { data: product } = await getProductById(1);

// Crear un nuevo producto
const { data: newProduct } = await createProduct({
  packageName: 'Paquete Premium',
  productClasification: 'Fotografía Impresa',
  description: 'Incluye 20 fotos de alta calidad',
  photoQuantity: 20,
  packagePrice: 499.99,
  itemStatus: true,
  photoResolution: 300,
  photoWidth: 10.16,
  photoHeight: 15.24,
});

// Actualizar un producto
await updateProduct(1, {
  packagePrice: 599.99,
  description: 'Nueva descripción',
});

// Cambiar estado del producto
await updateProductStatus(1, false); // Desactivar

// Eliminar producto
await deleteProduct(1);

// Obtener productos agrupados por categoría (para catálogo)
const { data: categories } = await getProductsByCategory();
```

### Pedidos

```typescript
import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrderImages,
  getUserOrders,
  createOrder,
} from '@/services/orders';

// Obtener todos los pedidos (admin)
const { data: orders } = await getAllOrders();

// Filtrar por estado
const { data: pendingOrders } = await getAllOrders('Imprimiendo');

// Obtener un pedido específico
const { data: order } = await getOrderById(123);

// Actualizar estado del pedido
await updateOrderStatus(123, 'Empaquetado');

// Obtener imágenes del pedido
const { data: images } = await getOrderImages(123);

// Obtener pedidos del usuario actual (vista usuario)
const { data: myOrders } = await getUserOrders();

// Crear nuevo pedido
const { data: newOrder } = await createOrder({
  clientName: 'Juan Pérez',
  dateOfOrder: '2024-12-07',
  orderItems: [
    {
      productName: 'Cuadro grande',
      package: 'Premium',
      itemPrice: 599.99,
    },
  ],
  status: 'Enviado',
  images: [],
});
```

## Manejo de Errores

Todas las funciones lanzan errores automáticamente si la petición falla. Se recomienda usar try/catch:

```typescript
try {
  const { data } = await getAllProducts();
  console.log('Productos:', data);
} catch (error) {
  console.error('Error al obtener productos:', error);
  // Mostrar mensaje de error al usuario
}
```

## Integración con React Server Components

Estas funciones se pueden usar directamente en React Server Components:

```typescript
// app/user/(presentation)/page.tsx
import { getProductsByCategory } from '@/services/products';

async function ProductsPage() {
  const { data: products } = await getProductsByCategory();

  return (
    <div>
      {products?.map((category) => (
        <ProductSection key={category.productName} item={category} />
      ))}
    </div>
  );
}
```

## Integración con Client Components

Para usar en Client Components, envuelve las llamadas en funciones async:

```typescript
'use client';

import { updateOrderStatus } from '@/services/orders';
import { useState } from 'react';

function OrderStatusButton({ orderId }: { orderId: number }) {
  const [loading, setLoading] = useState(false);

  const handleUpdateStatus = async () => {
    setLoading(true);
    try {
      await updateOrderStatus(orderId, 'Empaquetado');
      // Actualizar UI o revalidar datos
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleUpdateStatus} disabled={loading}>
      {loading ? 'Actualizando...' : 'Marcar como empaquetado'}
    </button>
  );
}
```

## Notas Importantes

- Todas las peticiones usan `fetch` nativo de Next.js
- Las respuestas siguen el formato estándar de la API: `{ success: boolean, data?: T, error?: string }`
- Los errores se lanzan automáticamente y deben manejarse con try/catch
- La URL base se configura en `.env.local` con la variable `NEXT_PUBLIC_API_URL`
