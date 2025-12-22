import { apiClient } from '@/lib/api-client';
import { AdmiOrder, UserOrder } from '@/interfaces/order-summary';

/**
 * Servicio para la gestión de pedidos
 * Todas las funciones retornan Promises y manejan errores automáticamente
 */

/**
 * Tipo para el estado de los pedidos
 */
export type OrderStatus = 'Enviado' | 'Imprimiendo' | 'Empaquetado' | 'En reparto' | 'Archivado';

/**
 * Obtiene todos los pedidos (vista admin)
 * @param status - Filtro opcional de estado
 * @returns Lista de pedidos
 */
export async function getAllOrders(status?: OrderStatus | 'all') {
  const params = status ? { status } : undefined;
  return apiClient.get<AdmiOrder[]>('/orders', { params });
}

/**
 * Obtiene un pedido por su ID
 * @param id - ID del pedido
 * @returns Datos del pedido
 */
export async function getOrderById(id: number) {
  return apiClient.get<AdmiOrder>(`/orders/${id}`);
}

/**
 * Actualiza el estado de un pedido
 * @param id - ID del pedido
 * @param status - Nuevo estado
 * @returns Pedido actualizado
 */
export async function updateOrderStatus(id: number, status: OrderStatus) {
  return apiClient.patch<{ orderId: number; status: OrderStatus }>(`/orders/${id}/status`, {
    status,
  });
}

/**
 * Obtiene las imágenes de un pedido
 * @param id - ID del pedido
 * @returns URLs de las imágenes
 */
export async function getOrderImages(id: number) {
  return apiClient.get<{ orderId: number; images: string[] }>(`/orders/${id}/images`);
}

/**
 * Obtiene los pedidos del usuario actual (vista usuario)
 * Esta función asume que el backend manejará la autenticación
 * y retornará solo los pedidos del usuario autenticado
 * @returns Lista de pedidos del usuario
 */
export async function getUserOrders() {
  // Este endpoint podría ser diferente, por ejemplo /api/user/orders
  // Ajusta según tu implementación de backend
  return apiClient.get<UserOrder[]>('/user/orders');
}

/**
 * Crea un nuevo pedido
 * @param order - Datos del pedido
 * @returns Pedido creado
 */
export async function createOrder(order: Omit<AdmiOrder, 'orderId'>) {
  return apiClient.post<AdmiOrder>('/orders', order);
}
