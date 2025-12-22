import { apiClient } from '@/lib/api-client';
import { StoreUser } from '@/interfaces/users';

/**
 * Servicio para la gestión de usuarios de tienda
 */

/**
 * DTO para crear un nuevo usuario de tienda
 */
export interface CrearStoreUserDTO {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  codigo_empleado: string;
  telefono: string;
}

/**
 * DTO para actualizar un usuario de tienda
 */
export interface ActualizarStoreUserDTO {
  email?: string;
  nombre?: string;
  apellido?: string;
  codigo_empleado?: string;
  telefono?: string;
  activo?: boolean;
  password?: string; // Campo opcional para cambiar la contraseña
}

/**
 * DTO para cambiar contraseña
 */
export interface CambiarPasswordDTO {
  password: string;
}

/**
 * Obtiene todos los usuarios de tienda
 */
export async function obtenerTodosStoreUsers() {
  return apiClient.get<StoreUser[]>('/stores');
}

/**
 * Obtiene un usuario de tienda por ID
 */
export async function obtenerStoreUserPorId(id: number) {
  return apiClient.get<StoreUser>(`/stores/${id}`);
}

/**
 * Crea un nuevo usuario de tienda
 */
export async function crearStoreUser(usuario: CrearStoreUserDTO) {
  return apiClient.post<StoreUser>('/stores', usuario);
}

/**
 * Actualiza un usuario de tienda
 */
export async function actualizarStoreUser(id: number, usuario: ActualizarStoreUserDTO) {
  return apiClient.put<StoreUser>(`/stores/${id}`, usuario);
}

/**
 * Cambia la contraseña de un usuario de tienda
 */
export async function cambiarPasswordStoreUser(id: number, data: CambiarPasswordDTO) {
  return apiClient.patch<{ message: string }>(`/stores/${id}/password`, data);
}

/**
 * Elimina un usuario de tienda (soft delete)
 */
export async function eliminarStoreUser(id: number) {
  return apiClient.delete<{ message: string }>(`/stores/${id}`);
}
