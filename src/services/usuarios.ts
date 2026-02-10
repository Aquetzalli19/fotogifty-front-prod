import { apiClient, ApiResponse } from '@/lib/api-client';
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
 * Verifica la contraseña actual del usuario
 * Retorna success: true si la contraseña es correcta
 */
export async function verificarContraseña(id: number, password: string): Promise<ApiResponse<{ valid: boolean }>> {
  try {
    const response = await apiClient.post<{ valid: boolean }>(`/usuarios/${id}/verify-password`, {
      password
    });
    console.log('🔑 verificarContraseña response:', JSON.stringify(response));
    // Handle different possible response structures from backend
    const raw = response as unknown as Record<string, unknown>;
    const valid = (response.data as { valid?: boolean })?.valid
      ?? (raw.datos as { valid?: boolean })?.valid
      ?? raw.valid;
    return {
      success: response.success,
      data: { valid: !!valid },
      message: response.message,
    };
  } catch (error) {
    console.error('Error verificando contraseña:', error);
    return {
      success: false,
      data: { valid: false },
      message: error instanceof Error ? error.message : 'Error al verificar la contraseña'
    };
  }
}

/**
 * Actualiza la información de un cliente
 */
export async function actualizarCliente(id: number, data: Partial<Omit<Cliente, 'id' | 'fecha_creacion'>>) {
  return apiClient.put<Cliente>(`/usuarios/${id}`, data);
}

/**
 * Actualiza el email de un cliente con verificación de contraseña
 * Requiere la contraseña actual para confirmar la identidad
 */
export async function actualizarEmailCliente(
  id: number,
  newEmail: string,
  currentPassword: string
): Promise<ApiResponse<Cliente>> {
  try {
    const response = await apiClient.put<Cliente>(`/usuarios/${id}/email`, {
      email: newEmail,
      currentPassword
    });
    return response;
  } catch (error) {
    console.error('Error actualizando email:', error);
    return {
      success: false,
      message: 'Error al actualizar el email. Verifica tu contraseña.'
    };
  }
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
