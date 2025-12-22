/**
 * Tipos de usuario en el sistema
 */
export type UserType = 'cliente' | 'admin' | 'super_admin' | 'store';

/**
 * Interfaz base para todos los usuarios
 */
export interface BaseUser {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  telefono: string;
  activo: boolean;
  tipo: UserType;
  fecha_creacion?: string;
  fecha_ultima_conexion?: string;
}

/**
 * Interfaz para Cliente
 */
export interface Cliente extends BaseUser {
  tipo: 'cliente';
  fecha_ultima_compra?: string;
  total_pedidos?: number;
}

/**
 * Interfaz para Usuario de Tienda (Store User)
 */
export interface StoreUser extends BaseUser {
  tipo: 'store';
  codigo_empleado?: string;
}

/**
 * Interfaz para Administrador
 */
export interface AdminUser extends BaseUser {
  tipo: 'admin' | 'super_admin';
}

/**
 * Tipo unificado para cualquier usuario autenticado
 */
export type AuthenticatedUser = Cliente | StoreUser | AdminUser;
