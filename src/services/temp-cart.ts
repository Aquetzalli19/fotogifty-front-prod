/**
 * Servicio para gestión de carrito y customizaciones temporales
 *
 * Este servicio se comunica con los endpoints del backend para:
 * - Persistir carrito entre sesiones del mismo usuario
 * - Sincronizar customizaciones con el servidor
 * - Manejar imágenes temporales en S3
 */

import { apiClient, ApiResponse } from '@/lib/api-client';

// ============================================================================
// INTERFACES
// ============================================================================

export interface TempCartItem {
  id: string;
  packageId: number;
  packageName: string;
  categoryName: string;
  price: number;
  quantity: number;
  imageUrl: string;
  dimensions?: {
    width: number;
    height: number;
    resolution: number;
  };
}

export interface TempCartData {
  items: TempCartItem[];
  lastModified: number;
}

export interface TempCustomizationData {
  cartItemId: string;
  instanceIndex: number;
  editorType: 'standard' | 'calendar' | 'polaroid';
  data: Record<string, unknown>;
  completed: boolean;
}

export interface TempImageData {
  id: number;
  s3Key: string;
  url: string;
}

export interface TempImageUrlData {
  url: string;
  expiresIn: number;
}

// ============================================================================
// CARRITO TEMPORAL
// ============================================================================

/**
 * Obtiene el carrito temporal del usuario autenticado
 */
export async function obtenerCarritoTemporal(): Promise<ApiResponse<TempCartData | null>> {
  try {
    const response = await apiClient.get<TempCartData | null>('/cart/temp');
    return response;
  } catch (error) {
    console.error('Error obteniendo carrito temporal:', error);
    return { success: false, data: null, message: 'Error al obtener carrito' };
  }
}

/**
 * Guarda el carrito temporal del usuario
 */
export async function guardarCarritoTemporal(items: TempCartItem[]): Promise<ApiResponse<void>> {
  try {
    const response = await apiClient.put<void>('/cart/temp', { items });
    return response;
  } catch (error) {
    console.error('Error guardando carrito temporal:', error);
    return { success: false, message: 'Error al guardar carrito' };
  }
}

/**
 * Elimina el carrito temporal del usuario
 */
export async function eliminarCarritoTemporal(): Promise<ApiResponse<void>> {
  try {
    const response = await apiClient.delete<void>('/cart/temp');
    return response;
  } catch (error) {
    console.error('Error eliminando carrito temporal:', error);
    return { success: false, message: 'Error al eliminar carrito' };
  }
}

// ============================================================================
// CUSTOMIZACIONES TEMPORALES
// ============================================================================

/**
 * Obtiene todas las customizaciones temporales del usuario
 */
export async function obtenerCustomizacionesTemporales(): Promise<ApiResponse<TempCustomizationData[]>> {
  try {
    const response = await apiClient.get<TempCustomizationData[]>('/customizations/temp');
    return response;
  } catch (error) {
    console.error('Error obteniendo customizaciones:', error);
    return { success: false, data: [], message: 'Error al obtener customizaciones' };
  }
}

/**
 * Guarda una customización específica
 */
export async function guardarCustomizacionTemporal(
  cartItemId: string,
  instanceIndex: number,
  editorType: 'standard' | 'calendar' | 'polaroid',
  data: Record<string, unknown>,
  completed: boolean
): Promise<ApiResponse<void>> {
  try {
    const response = await apiClient.put<void>(
      `/customizations/temp/${cartItemId}/${instanceIndex}`,
      { editorType, data, completed }
    );
    return response;
  } catch (error) {
    console.error('Error guardando customización:', error);
    return { success: false, message: 'Error al guardar customización' };
  }
}

/**
 * Elimina una customización específica
 */
export async function eliminarCustomizacionTemporal(
  cartItemId: string,
  instanceIndex: number
): Promise<ApiResponse<void>> {
  try {
    const response = await apiClient.delete<void>(
      `/customizations/temp/${cartItemId}/${instanceIndex}`
    );
    return response;
  } catch (error) {
    console.error('Error eliminando customización:', error);
    return { success: false, message: 'Error al eliminar customización' };
  }
}

/**
 * Elimina TODAS las customizaciones del usuario
 */
export async function eliminarTodasCustomizaciones(): Promise<ApiResponse<void>> {
  try {
    const response = await apiClient.delete<void>('/customizations/temp');
    return response;
  } catch (error) {
    console.error('Error eliminando customizaciones:', error);
    return { success: false, message: 'Error al eliminar customizaciones' };
  }
}

// ============================================================================
// IMÁGENES TEMPORALES
// ============================================================================

/**
 * Sube una imagen temporal a S3
 */
export async function subirImagenTemporal(file: File): Promise<ApiResponse<TempImageData>> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    // Para FormData, necesitamos usar fetch directamente
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const response = await fetch('/api/images/temp', {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error subiendo imagen temporal:', error);
    return {
      success: false,
      data: { id: 0, s3Key: '', url: '' },
      message: 'Error al subir imagen'
    };
  }
}

/**
 * Obtiene una URL firmada fresca para una imagen temporal
 */
export async function obtenerUrlImagenTemporal(imageId: number): Promise<ApiResponse<TempImageUrlData>> {
  try {
    const response = await apiClient.get<TempImageUrlData>(`/images/temp/${imageId}/url`);
    return response;
  } catch (error) {
    console.error('Error obteniendo URL de imagen:', error);
    return {
      success: false,
      data: { url: '', expiresIn: 0 },
      message: 'Error al obtener URL'
    };
  }
}

/**
 * Elimina una imagen temporal específica
 */
export async function eliminarImagenTemporal(imageId: number): Promise<ApiResponse<void>> {
  try {
    const response = await apiClient.delete<void>(`/images/temp/${imageId}`);
    return response;
  } catch (error) {
    console.error('Error eliminando imagen:', error);
    return { success: false, message: 'Error al eliminar imagen' };
  }
}

/**
 * Elimina TODAS las imágenes temporales del usuario
 */
export async function eliminarTodasImagenes(): Promise<ApiResponse<void>> {
  try {
    const response = await apiClient.delete<void>('/images/temp');
    return response;
  } catch (error) {
    console.error('Error eliminando imágenes:', error);
    return { success: false, message: 'Error al eliminar imágenes' };
  }
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Debounce utility para guardar automáticamente
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Sincroniza el carrito local con el backend (con debounce de 2 segundos)
 */
export const sincronizarCarritoConBackend = debounce(async (items: TempCartItem[]) => {
  const result = await guardarCarritoTemporal(items);
  if (result.success) {
    console.log('✅ Carrito sincronizado con backend');
  } else {
    console.warn('⚠️ Error sincronizando carrito:', result.message);
  }
}, 2000);
