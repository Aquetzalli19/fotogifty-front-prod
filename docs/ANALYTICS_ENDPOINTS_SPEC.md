# 📊 Especificación de Endpoints de Analytics

Documentación completa de los endpoints que el backend debe implementar para el dashboard de analytics.

---

## 🎯 Endpoint Principal: Obtener Todos los Analytics

### `GET /api/analytics`

Retorna todos los datos de analytics en una sola petición.

**Query Parameters:**
- `fechaInicio` (string, required): Fecha de inicio en formato YYYY-MM-DD
- `fechaFin` (string, required): Fecha de fin en formato YYYY-MM-DD
- `categoria` (string, optional): Filtrar por categoría específica

**Response:**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "ventasTotales": 45000.50,
      "numeroPedidos": 120,
      "ticketPromedio": 375.00,
      "tasaCrecimiento": 12.5
    },
    "ventasPorDia": [
      {
        "fecha": "2025-01-01",
        "ventas": 1500.00,
        "pedidos": 5
      },
      {
        "fecha": "2025-01-02",
        "ventas": 2300.00,
        "pedidos": 8
      }
    ],
    "productosTopVentas": [
      {
        "id_paquete": 1,
        "nombre_paquete": "Calendario 2025",
        "categoria_paquete": "Calendarios",
        "cantidad": 45,
        "ingresos": 15000.00
      }
    ],
    "ventasPorCategoria": [
      {
        "categoria": "Calendarios",
        "ventas": 20000.00,
        "pedidos": 60,
        "porcentaje": 44.44
      },
      {
        "categoria": "Polaroids",
        "ventas": 15000.00,
        "pedidos": 40,
        "porcentaje": 33.33
      }
    ],
    "estadosPedidos": [
      {
        "estado": "Entregado",
        "cantidad": 80,
        "porcentaje": 66.67
      },
      {
        "estado": "En Proceso",
        "cantidad": 30,
        "porcentaje": 25.00
      },
      {
        "estado": "Pendiente",
        "cantidad": 10,
        "porcentaje": 8.33
      }
    ]
  }
}
```

**Lógica de Cálculo:**

```typescript
// Pseudocódigo del backend

async function obtenerAnalytics(fechaInicio: Date, fechaFin: Date, categoria?: string) {
  // 1. Obtener pedidos en el rango de fechas
  const pedidos = await Pedido.findAll({
    where: {
      creado_en: {
        [Op.between]: [fechaInicio, fechaFin]
      },
      // Solo pedidos pagados o completados
      estado_pago: 'pagado'
    },
    include: [
      {
        model: ItemPedido,
        as: 'items_pedido',
        include: [
          {
            model: Paquete,
            as: 'paquete'
          }
        ]
      }
    ]
  });

  // 2. Calcular KPIs
  const ventasTotales = pedidos.reduce((sum, p) => sum + p.total, 0);
  const numeroPedidos = pedidos.length;
  const ticketPromedio = numeroPedidos > 0 ? ventasTotales / numeroPedidos : 0;

  // 3. Calcular ventas por día
  const ventasPorDiaMap = new Map();
  pedidos.forEach(pedido => {
    const fecha = pedido.creado_en.toISOString().split('T')[0];
    const current = ventasPorDiaMap.get(fecha) || { ventas: 0, pedidos: 0 };
    ventasPorDiaMap.set(fecha, {
      ventas: current.ventas + pedido.total,
      pedidos: current.pedidos + 1
    });
  });

  const ventasPorDia = Array.from(ventasPorDiaMap.entries())
    .map(([fecha, data]) => ({
      fecha,
      ventas: data.ventas,
      pedidos: data.pedidos
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  // 4. Productos más vendidos
  const productosMap = new Map();
  pedidos.forEach(pedido => {
    pedido.items_pedido.forEach(item => {
      const current = productosMap.get(item.id_paquete) || {
        id_paquete: item.id_paquete,
        nombre_paquete: item.paquete.nombre,
        categoria_paquete: item.paquete.categoria.nombre,
        cantidad: 0,
        ingresos: 0
      };
      productosMap.set(item.id_paquete, {
        ...current,
        cantidad: current.cantidad + item.cantidad,
        ingresos: current.ingresos + (item.precio_unitario * item.cantidad)
      });
    });
  });

  const productosTopVentas = Array.from(productosMap.values())
    .sort((a, b) => b.ingresos - a.ingresos)
    .slice(0, 10);

  // 5. Ventas por categoría
  const categoriasMap = new Map();
  pedidos.forEach(pedido => {
    pedido.items_pedido.forEach(item => {
      const categoria = item.paquete.categoria.nombre;
      const current = categoriasMap.get(categoria) || { ventas: 0, pedidos: 0 };
      categoriasMap.set(categoria, {
        ventas: current.ventas + (item.precio_unitario * item.cantidad),
        pedidos: current.pedidos + 1
      });
    });
  });

  const totalVentas = Array.from(categoriasMap.values())
    .reduce((sum, cat) => sum + cat.ventas, 0);

  const ventasPorCategoria = Array.from(categoriasMap.entries())
    .map(([categoria, data]) => ({
      categoria,
      ventas: data.ventas,
      pedidos: data.pedidos,
      porcentaje: totalVentas > 0 ? (data.ventas / totalVentas) * 100 : 0
    }));

  // 6. Estados de pedidos
  const estadosMap = new Map();
  pedidos.forEach(pedido => {
    const estado = pedido.estado;
    estadosMap.set(estado, (estadosMap.get(estado) || 0) + 1);
  });

  const totalPedidos = pedidos.length;
  const estadosPedidos = Array.from(estadosMap.entries())
    .map(([estado, cantidad]) => ({
      estado,
      cantidad,
      porcentaje: totalPedidos > 0 ? (cantidad / totalPedidos) * 100 : 0
    }));

  return {
    kpis: {
      ventasTotales,
      numeroPedidos,
      ticketPromedio,
      tasaCrecimiento: 0 // TODO: calcular vs período anterior
    },
    ventasPorDia,
    productosTopVentas,
    ventasPorCategoria,
    estadosPedidos
  };
}
```

---

## 📌 Endpoints Individuales (Opcionales)

Si prefieres endpoints separados en lugar del endpoint principal:

### `GET /api/analytics/kpis`

Retorna solo los KPIs principales.

**Query Parameters:**
- `fechaInicio` (string, required)
- `fechaFin` (string, required)

**Response:**
```json
{
  "success": true,
  "data": {
    "ventasTotales": 45000.50,
    "numeroPedidos": 120,
    "ticketPromedio": 375.00,
    "tasaCrecimiento": 12.5
  }
}
```

---

### `GET /api/analytics/ventas-por-dia`

Retorna ventas agrupadas por día.

**Query Parameters:**
- `fechaInicio` (string, required)
- `fechaFin` (string, required)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "fecha": "2025-01-01",
      "ventas": 1500.00,
      "pedidos": 5
    }
  ]
}
```

---

### `GET /api/analytics/productos-top`

Retorna los productos más vendidos.

**Query Parameters:**
- `fechaInicio` (string, required)
- `fechaFin` (string, required)
- `limit` (number, optional, default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id_paquete": 1,
      "nombre_paquete": "Calendario 2025",
      "categoria_paquete": "Calendarios",
      "cantidad": 45,
      "ingresos": 15000.00
    }
  ]
}
```

---

### `GET /api/analytics/ventas-por-categoria`

Retorna ventas agrupadas por categoría.

**Query Parameters:**
- `fechaInicio` (string, required)
- `fechaFin` (string, required)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "categoria": "Calendarios",
      "ventas": 20000.00,
      "pedidos": 60,
      "porcentaje": 44.44
    }
  ]
}
```

---

### `GET /api/analytics/estados-pedidos`

Retorna distribución de estados de pedidos.

**Query Parameters:**
- `fechaInicio` (string, required)
- `fechaFin` (string, required)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "estado": "Entregado",
      "cantidad": 80,
      "porcentaje": 66.67
    }
  ]
}
```

---

## 🔐 Seguridad

Todos los endpoints deben:
- ✅ Requerir autenticación (Bearer token)
- ✅ Verificar rol de admin (`requireAdmin` middleware)
- ✅ Validar fechas (fechaInicio <= fechaFin)
- ✅ Sanitizar inputs

---

## 🚀 Implementación Sugerida

### Estructura de Archivos

```
backend/
├── src/
│   ├── controllers/
│   │   └── analytics.controller.ts    # Lógica de analytics
│   ├── routes/
│   │   └── analytics.routes.ts        # Rutas /api/analytics
│   └── services/
│       └── analytics.service.ts       # Cálculos de métricas
```

### Ejemplo de Ruta

```typescript
// src/routes/analytics.routes.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/roles';
import { AnalyticsController } from '../controllers/analytics.controller';

const router = Router();
const analyticsController = new AnalyticsController();

// Endpoint principal
router.get(
  '/analytics',
  authenticateToken,
  requireAdmin,
  analyticsController.getAnalytics
);

// Endpoints individuales (opcionales)
router.get('/analytics/kpis', authenticateToken, requireAdmin, analyticsController.getKPIs);
router.get('/analytics/ventas-por-dia', authenticateToken, requireAdmin, analyticsController.getVentasPorDia);
router.get('/analytics/productos-top', authenticateToken, requireAdmin, analyticsController.getProductosTop);
router.get('/analytics/ventas-por-categoria', authenticateToken, requireAdmin, analyticsController.getVentasPorCategoria);
router.get('/analytics/estados-pedidos', authenticateToken, requireAdmin, analyticsController.getEstadosPedidos);

export default router;
```

---

## ✅ Checklist de Implementación

- [ ] Crear `AnalyticsController` con método `getAnalytics()`
- [ ] Implementar cálculo de KPIs desde pedidos
- [ ] Implementar agrupación por día
- [ ] Implementar top productos por ingresos
- [ ] Implementar ventas por categoría con porcentajes
- [ ] Implementar distribución de estados
- [ ] Agregar validaciones de fechas
- [ ] Agregar middleware de autenticación
- [ ] Agregar middleware `requireAdmin`
- [ ] Probar con Postman/Thunder Client
- [ ] Documentar en Swagger

---

## 🧪 Ejemplo de Request

```bash
# Obtener analytics del último mes
GET http://localhost:3001/api/analytics?fechaInicio=2024-12-01&fechaFin=2025-01-05
Authorization: Bearer <token>
```

---

## 📊 Optimizaciones Sugeridas

1. **Caché**: Cachear resultados por 5-10 minutos
2. **Índices**: Agregar índices en `creado_en` y `estado_pago`
3. **Paginación**: Para tablas grandes de productos
4. **Queries optimizadas**: Usar agregaciones SQL en lugar de loops

---

**Una vez implementado, el frontend conectará automáticamente** ✅
