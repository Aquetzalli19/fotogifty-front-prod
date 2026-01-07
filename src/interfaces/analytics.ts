/**
 * Interfaces para el dashboard de analytics
 */

// KPIs principales
export interface KPIs {
  ventasTotales: number;
  numeroPedidos: number;
  ticketPromedio: number;
  tasaCrecimiento: number; // Porcentaje vs período anterior
}

// Ventas por día
export interface VentasPorDia {
  fecha: string; // YYYY-MM-DD
  ventas: number;
  pedidos: number;
}

// Producto más vendido
export interface ProductoVendido {
  id_paquete: number;
  nombre_paquete: string;
  categoria_paquete: string;
  cantidad: number;
  ingresos: number;
}

// Ventas por categoría
export interface VentasPorCategoria {
  categoria: string;
  ventas: number;
  pedidos: number;
  porcentaje: number;
  [key: string]: string | number; // Firma de índice para compatibilidad con Recharts
}

// Estados de pedidos
export interface EstadoPedidos {
  estado: string;
  cantidad: number;
  porcentaje: number;
  [key: string]: string | number; // Firma de índice para compatibilidad con Recharts
}

// Resumen de analytics completo
export interface AnalyticsData {
  kpis: KPIs;
  ventasPorDia: VentasPorDia[];
  productosTopVentas: ProductoVendido[];
  ventasPorCategoria: VentasPorCategoria[];
  estadosPedidos: EstadoPedidos[];
}

// Filtros para obtener analytics
export interface AnalyticsFilters {
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string;    // YYYY-MM-DD
  categoria?: string;
}

// Estructura de pedido para exportación
export interface PedidoExport {
  id: number;
  fecha: string;
  cliente: string;
  total: number;
  estado: string;
  productos: string;
  cantidad: number;
}

// Para exportar a Excel
export interface ExcelExportData {
  pedidos: PedidoExport[];  // Lista completa de pedidos
  ventasPorProducto: ProductoVendido[];
  ventasPorCategoria: VentasPorCategoria[];
  kpis: KPIs;
}
