/**
 * Interfaz para Usuario de Tienda (Store User)
 */
export interface StoreUser {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  codigo_empleado: string;
  telefono: string;
  activo: boolean;
  fecha_creacion?: string;
}

/**
 * Interfaz para Cliente
 */
export interface Cliente {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  telefono: string;
  activo: boolean;
  fecha_creacion?: string;
  fecha_ultima_compra?: string;
  total_pedidos?: number;
  fecha_ultima_conexion?: string;
}
