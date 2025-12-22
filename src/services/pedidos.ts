import { apiClient } from '@/lib/api-client';
import { AdmiOrder } from '@/interfaces/order-summary';

/**
 * Servicio para la gestión de pedidos
 */

/**
 * Obtiene todos los pedidos (admin)
 */
export async function obtenerTodosPedidos(): Promise<AdmiOrder[]> {
  const response = await apiClient.get<AdmiOrder[]>('/pedidos');
  return response.data || [];
}

/**
 * Obtiene los pedidos de un usuario específico
 * Requiere autenticación
 */
export async function obtenerPedidosUsuario(usuarioId: number): Promise<AdmiOrder[]> {
  const response = await apiClient.get<AdmiOrder[]>(`/pedidos/usuario/${usuarioId}`);
  return response.data || [];
}

/**
 * Obtiene un pedido por ID
 */
export async function obtenerPedidoPorId(id: number): Promise<AdmiOrder | null> {
  const response = await apiClient.get<AdmiOrder>(`/pedidos/${id}`);
  return response.data || null;
}

/**
 * Actualiza el estado de un pedido
 * Estados válidos: Pendiente, En Proceso, Enviado, Entregado, Cancelado
 * Requiere rol de admin
 */
export async function actualizarEstadoPedido(id: number, nuevoEstado: string): Promise<AdmiOrder | null> {
  const response = await apiClient.patch<AdmiOrder>(`/pedidos/${id}/estado`, {
    estado: nuevoEstado
  });
  return response.data || null;
}