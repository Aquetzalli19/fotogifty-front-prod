import { apiClient } from '@/lib/api-client';
import { StoreConfiguration, StoreConfigurationDTO } from '@/interfaces/store-config';

// Tipo para la respuesta del backend
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Obtener configuración de la tienda
 */
export async function obtenerConfiguracionTienda(): Promise<ApiResponse<StoreConfiguration>> {
  try {
    const response = await apiClient.get<StoreConfiguration>('/configuracion-tienda');
    return response;
  } catch (error) {
    console.error('Error obteniendo configuración de tienda:', error);
    throw error;
  }
}

/**
 * Actualizar configuración de la tienda (Admin only)
 */
export async function actualizarConfiguracionTienda(
  data: StoreConfigurationDTO
): Promise<ApiResponse<StoreConfiguration>> {
  try {
    console.log('📤 Actualizando configuración de tienda:', data);
    const response = await apiClient.put<StoreConfiguration>(
      '/configuracion-tienda',
      data
    );
    console.log('✅ Configuración actualizada:', response);
    return response;
  } catch (error) {
    console.error('Error actualizando configuración de tienda:', error);
    throw error;
  }
}
