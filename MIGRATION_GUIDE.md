# Guía de Migración: Mock Data → API Real

Este documento explica cómo migrar las páginas que actualmente usan datos mock a las APIs reales.

## Configuración Inicial

1. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env.local
   ```

2. **Editar `.env.local`** con la URL de tu backend:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   # o en producción:
   # NEXT_PUBLIC_API_URL=https://api.fotogifty.com/api
   ```

## Ejemplos de Migración

### 1. Página de Productos (Catálogo de Usuario)

**Antes** (`src/app/user/(presentation)/page.tsx`):
```typescript
import { mockDataproducts } from "@/test-data/product-mockdata";

async function getProductData(): Promise<ProductSections[]> {
  try {
    return mockDataproducts;
  } catch (error) {
    console.error("Error fetching product data:", error);
    return [];
  }
}
```

**Después**:
```typescript
import { getProductsByCategory } from "@/services/products";

async function getProductData(): Promise<ProductSections[]> {
  try {
    const response = await getProductsByCategory();
    return response.data || [];
  } catch (error) {
    console.error("Error fetching product data:", error);
    return [];
  }
}
```

### 2. Página de Historial de Pedidos

**Antes** (`src/app/user/(presentation)/backlog/page.tsx`):
```typescript
import { mockDataUserOrders } from "@/test-data/order-mockdata";

async function getOrderData(): Promise<UserOrder[]> {
  try {
    return mockDataUserOrders;
  } catch (error) {
    console.error("Error fetching order data:", error);
    return [];
  }
}
```

**Después**:
```typescript
import { getUserOrders } from "@/services/orders";

async function getOrderData(): Promise<UserOrder[]> {
  try {
    const response = await getUserOrders();
    return response.data || [];
  } catch (error) {
    console.error("Error fetching order data:", error);
    return [];
  }
}
```

### 3. Actualizar Estado de Pedido (Admin)

**Antes** (`src/components/admi/UpdateOrderDialog.tsx:44-62`):
```typescript
const handleSaveChanges = async () => {
  try {
    // TODO: Update with the correct API endpoint for updating order status
    // const response = await fetch(`/api/orders/${order.orderId}`, {
    //   method: 'PUT',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ status }),
    // });
    // if (response.ok) {
    //   setOpen(false);
    // } else {
    //   console.error('Failed to update order status');
    // }
  } catch (error) {
    console.error("Error updating order status:", error);
  }
};
```

**Después**:
```typescript
import { updateOrderStatus } from "@/services/orders";
import { useState } from "react";

const UpdateOrderDialog = ({ order, setOpen }: OrderDialogProps) => {
  const [selectedStatus, setSelectedStatus] = useState(order.status);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      const response = await updateOrderStatus(order.orderId, selectedStatus);

      if (response.success) {
        setOpen(false);
        // Opcional: revalidar datos o actualizar UI
      } else {
        console.error('Failed to update order status');
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      // Mostrar mensaje de error al usuario
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent>
      {/* ... */}
      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
        {/* ... */}
      </Select>
      <Button onClick={handleSaveChanges} disabled={isLoading}>
        {isLoading ? 'Guardando...' : 'Guardar cambios'}
      </Button>
    </DialogContent>
  );
};
```

## Migración por Fases

Se recomienda migrar en este orden:

### Fase 1: Productos (Solo lectura)
- ✅ `src/app/user/(presentation)/page.tsx` - Catálogo de productos
- ✅ Cualquier componente que muestre productos

### Fase 2: Pedidos (Solo lectura)
- ✅ `src/app/user/(presentation)/backlog/page.tsx` - Historial de usuario
- ✅ `src/app/admi/(delivercontrol)/` - Vista de pedidos admin

### Fase 3: Operaciones de Admin (Escritura)
- ✅ `src/components/admi/UpdateOrderDialog.tsx` - Actualizar estado de pedido
- ✅ `src/app/admi/itemcontrol/` - Gestión de productos
- ✅ `src/app/admi/addItem/` - Crear nuevos productos

### Fase 4: Carrito y Checkout
- ✅ Integrar con Stripe
- ✅ Crear pedidos desde el carrito
- ✅ Manejo de webhooks

## Manejo de Errores en Producción

Agrega un mejor manejo de errores para producción:

```typescript
import { getProductsByCategory } from "@/services/products";
import { config } from "@/lib/config";

async function getProductData(): Promise<ProductSections[]> {
  try {
    // En desarrollo, usar mock data como fallback
    if (config.isDevelopment) {
      try {
        const response = await getProductsByCategory();
        return response.data || [];
      } catch (apiError) {
        console.warn("API no disponible, usando datos mock:", apiError);
        const { mockDataproducts } = await import("@/test-data/product-mockdata");
        return mockDataproducts;
      }
    }

    // En producción, fallar si la API no responde
    const response = await getProductsByCategory();
    if (!response.success || !response.data) {
      throw new Error("Failed to fetch products");
    }
    return response.data;

  } catch (error) {
    console.error("Error fetching product data:", error);

    // En producción, podrías querer mostrar una página de error
    if (config.isProduction) {
      throw error;
    }

    return [];
  }
}
```

## Testing de la Integración

1. **Iniciar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

2. **Verificar que la variable de entorno esté configurada**:
   - Abre la consola del navegador
   - Verifica que las peticiones se hagan a la URL correcta
   - Busca errores de CORS si el backend está en un dominio diferente

3. **Probar con el backend local**:
   - Asegúrate de que el backend esté corriendo en `http://localhost:3001`
   - Verifica que los endpoints coincidan con `BACKEND_API_DOCS.md`

4. **Manejo de CORS** (si aplica):
   - El backend debe permitir peticiones desde `http://localhost:3000` en desarrollo
   - En producción, configurar los orígenes permitidos

## Checklist de Migración

- [ ] Configurar `.env.local` con `NEXT_PUBLIC_API_URL`
- [ ] Migrar página de catálogo de productos
- [ ] Migrar página de historial de pedidos
- [ ] Migrar diálogo de actualización de pedidos (admin)
- [ ] Migrar gestión de productos (admin)
- [ ] Agregar manejo de errores y estados de carga
- [ ] Testing en desarrollo
- [ ] Testing en staging/producción
- [ ] Eliminar imports de mock data (opcional, mantener como fallback)

## Notas Adicionales

- Todas las funciones de `src/services/` son async y retornan Promises
- Las respuestas tienen el formato: `{ success: boolean, data?: T, error?: string }`
- Los errores se lanzan automáticamente, usa try/catch
- Para componentes cliente, considera usar React Query o SWR para caché y revalidación
