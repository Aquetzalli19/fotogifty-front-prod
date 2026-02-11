/**
 * Servicio para gestionar estados de pedidos dinámicos
 */

import { apiClient } from "@/lib/api-client";
import {
  EstadoPedido,
  CrearEstadoPedidoDTO,
  ActualizarEstadoPedidoDTO,
} from "@/interfaces/estado-pedido";

/**
 * Obtiene todos los estados de pedido
 * @param incluirInactivos - Si es true, incluye estados inactivos (?todos=true)
 * @returns Lista de estados ordenados por campo 'orden'
 */
export async function obtenerEstadosPedido(incluirInactivos = false) {
  const endpoint = incluirInactivos
    ? "/estados-pedido?todos=true"
    : "/estados-pedido";

  return apiClient.get<EstadoPedido[]>(endpoint);
}

/**
 * Obtiene un estado de pedido por ID
 * @param id - ID del estado
 * @returns Estado de pedido
 */
export async function obtenerEstadoPedidoPorId(id: number) {
  return apiClient.get<EstadoPedido>(`/estados-pedido/${id}`);
}

/**
 * Crea un nuevo estado de pedido
 * @param dto - Datos del estado a crear
 * @returns Estado creado
 */
export async function crearEstadoPedido(dto: CrearEstadoPedidoDTO) {
  return apiClient.post<EstadoPedido>("/estados-pedido", dto);
}

/**
 * Actualiza un estado de pedido existente
 * @param id - ID del estado a actualizar
 * @param dto - Datos a actualizar
 * @returns Estado actualizado
 */
export async function actualizarEstadoPedido(
  id: number,
  dto: ActualizarEstadoPedidoDTO
) {
  return apiClient.put<EstadoPedido>(`/estados-pedido/${id}`, dto);
}

/**
 * Elimina un estado de pedido
 * @param id - ID del estado a eliminar
 * @returns Confirmación de eliminación
 * @throws Error si hay pedidos asociados al estado
 */
export async function eliminarEstadoPedido(id: number) {
  return apiClient.delete<{ message: string }>(`/estados-pedido/${id}`);
}

/**
 * Actualiza el estado de un pedido específico
 * @param pedidoId - ID del pedido
 * @param estado - Nombre del nuevo estado
 * @returns Pedido actualizado
 */
export async function actualizarEstadoDePedido(
  pedidoId: number,
  estado: string
) {
  return apiClient.patch<{ message: string; pedido: unknown }>(`/pedidos/${pedidoId}/estado`, { estado });
}
