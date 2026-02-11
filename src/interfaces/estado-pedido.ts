/**
 * Estado de pedido dinámico desde el backend
 */
export interface EstadoPedido {
  id: number;
  nombre: string;
  descripcion?: string;
  color?: string; // hex, ej: "#FF9800"
  orden: number;
  activo: boolean;
}

/**
 * DTO para crear un nuevo estado de pedido
 */
export interface CrearEstadoPedidoDTO {
  nombre: string;
  descripcion?: string;
  color?: string;
  orden?: number;
}

/**
 * DTO para actualizar un estado de pedido existente
 */
export interface ActualizarEstadoPedidoDTO {
  nombre?: string;
  descripcion?: string;
  color?: string;
  orden?: number;
  activo?: boolean;
}

/**
 * Respuesta de la API para estados de pedido
 */
export interface EstadosPedidoResponse {
  success: boolean;
  data: EstadoPedido[];
  message?: string;
}

/**
 * Respuesta de la API para un estado de pedido individual
 */
export interface EstadoPedidoResponse {
  success: boolean;
  data: EstadoPedido;
  message?: string;
}
