import { apiClient } from '@/lib/api-client';
import type {
  AnalyticsData,
  AnalyticsFilters,
  KPIs,
  VentasPorDia,
  ProductoVendido,
  VentasPorCategoria,
  EstadoPedidos
} from '@/interfaces/analytics';

/**
 * Servicio para obtener estadísticas y analytics del negocio
 */

/**
 * Obtiene todos los datos de analytics según los filtros
 */
export async function obtenerAnalytics(filters: AnalyticsFilters): Promise<AnalyticsData | null> {
  try {
    const response = await apiClient.get<AnalyticsData>('/analytics', {
      params: {
        fechaInicio: filters.fechaInicio,
        fechaFin: filters.fechaFin,
        ...(filters.categoria && { categoria: filters.categoria })
      }
    });

    return response.data || null;
  } catch (error) {
    console.error('Error al obtener analytics:', error);
    return null;
  }
}

/**
 * Obtiene solo los KPIs principales
 */
export async function obtenerKPIs(filters: AnalyticsFilters): Promise<KPIs | null> {
  try {
    const response = await apiClient.get<KPIs>('/analytics/kpis', {
      params: {
        fechaInicio: filters.fechaInicio,
        fechaFin: filters.fechaFin
      }
    });

    return response.data || null;
  } catch (error) {
    console.error('Error al obtener KPIs:', error);
    return null;
  }
}

/**
 * Obtiene ventas por día
 */
export async function obtenerVentasPorDia(filters: AnalyticsFilters): Promise<VentasPorDia[]> {
  try {
    const response = await apiClient.get<VentasPorDia[]>('/analytics/ventas-por-dia', {
      params: {
        fechaInicio: filters.fechaInicio,
        fechaFin: filters.fechaFin
      }
    });

    return response.data || [];
  } catch (error) {
    console.error('Error al obtener ventas por día:', error);
    return [];
  }
}

/**
 * Obtiene productos más vendidos
 */
export async function obtenerProductosTopVentas(filters: AnalyticsFilters, limit: number = 10): Promise<ProductoVendido[]> {
  try {
    const response = await apiClient.get<ProductoVendido[]>('/analytics/productos-top', {
      params: {
        fechaInicio: filters.fechaInicio,
        fechaFin: filters.fechaFin,
        limit
      }
    });

    return response.data || [];
  } catch (error) {
    console.error('Error al obtener productos top ventas:', error);
    return [];
  }
}

/**
 * Obtiene ventas por categoría
 */
export async function obtenerVentasPorCategoria(filters: AnalyticsFilters): Promise<VentasPorCategoria[]> {
  try {
    const response = await apiClient.get<VentasPorCategoria[]>('/analytics/ventas-por-categoria', {
      params: {
        fechaInicio: filters.fechaInicio,
        fechaFin: filters.fechaFin
      }
    });

    return response.data || [];
  } catch (error) {
    console.error('Error al obtener ventas por categoría:', error);
    return [];
  }
}

/**
 * Obtiene distribución de estados de pedidos
 */
export async function obtenerEstadosPedidos(filters: AnalyticsFilters): Promise<EstadoPedidos[]> {
  try {
    const response = await apiClient.get<EstadoPedidos[]>('/analytics/estados-pedidos', {
      params: {
        fechaInicio: filters.fechaInicio,
        fechaFin: filters.fechaFin
      }
    });

    return response.data || [];
  } catch (error) {
    console.error('Error al obtener estados de pedidos:', error);
    return [];
  }
}
