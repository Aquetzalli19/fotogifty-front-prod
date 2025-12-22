import { apiClient } from '@/lib/api-client';
import { Cliente } from '@/interfaces/users';

/**
 * Servicio para la gestión de clientes (usuarios finales)
 */

/**
 * Obtiene todos los clientes
 */
export async function obtenerTodosClientes() {
  return apiClient.get<Cliente[]>('/usuarios');
}

/**
 * Obtiene un cliente por ID
 */
export async function obtenerClientePorId(id: number) {
  return apiClient.get<Cliente>(`/usuarios/${id}`);
}

/**
 * Actualiza la información de un cliente
 */
export async function actualizarCliente(id: number, data: Partial<Omit<Cliente, 'id' | 'fecha_creacion'>>) {
  return apiClient.put<Cliente>(`/usuarios/${id}`, data);
}

/**
 * Cambia la contraseña de un cliente
 */
export async function cambiarContraseñaCliente(id: number, currentPassword: string, newPassword: string) {
  return apiClient.put<Cliente>(`/usuarios/${id}/password`, {
    currentPassword,
    newPassword
  });
}
