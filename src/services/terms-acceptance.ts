/**
 * Servicio para gestión de aceptación de términos y condiciones
 */

import { apiClient } from '@/lib/api-client';
import {
  TermsAcceptanceStatus,
  BackendTermsStatusItem,
  AcceptTermsRequest,
  AcceptTermsResponse,
} from '@/interfaces/terms-acceptance';
import { obtenerDocumentoLegalActivo } from './legal-documents';

// Tipo para la respuesta del backend
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Verificar si el usuario tiene términos pendientes de aceptar
 * @param userId - ID del usuario
 * @returns Estado de aceptación de términos
 */
export async function verificarEstadoTerminos(
  userId: number
): Promise<ApiResponse<TermsAcceptanceStatus>> {
  try {
    // El backend retorna un array con información de cada tipo de documento
    const response = await apiClient.get<BackendTermsStatusItem[]>(
      `/usuarios/${userId}/terms-status`
    );

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Error al verificar términos'
      };
    }

    // Buscar el item de términos ('terms') en el array
    const termsItem = response.data.find(item => item.tipo === 'terms');

    if (!termsItem) {
      return {
        success: false,
        error: 'No se encontró información de términos'
      };
    }

    // Cargar el documento legal activo si se requiere aceptación
    let termsDocument = null;
    if (termsItem.requiere_aceptacion) {
      try {
        const docResponse = await obtenerDocumentoLegalActivo('terms');
        if (docResponse.success && docResponse.data) {
          termsDocument = docResponse.data;
        }
      } catch (err) {
        console.warn('No se pudo cargar documento de términos:', err);
      }
    }

    // Transformar al formato que espera el frontend
    const transformedData: TermsAcceptanceStatus = {
      needsAcceptance: termsItem.requiere_aceptacion,
      currentVersion: termsItem.version_actual,
      currentDocumentId: termsDocument?.id || 0,
      userAcceptedVersion: termsItem.version_aceptada || null,
      userAcceptedDate: termsItem.fecha_aceptacion || null,
      termsDocument: termsDocument,
    };

    return {
      success: true,
      data: transformedData
    };
  } catch (error) {
    console.error('Error verificando estado de términos:', error);
    throw error;
  }
}

/**
 * Registrar aceptación de términos por parte del usuario
 * @param userId - ID del usuario
 * @param tipoDocumento - Tipo de documento ('terms' o 'privacy')
 * @returns Confirmación de aceptación
 */
export async function aceptarTerminos(
  userId: number,
  tipoDocumento: 'terms' | 'privacy' = 'terms'
): Promise<ApiResponse<AcceptTermsResponse>> {
  try {
    const response = await apiClient.post<AcceptTermsResponse>(
      `/usuarios/${userId}/accept-terms`,
      { tipo_documento: tipoDocumento }
    );

    return response;
  } catch (error) {
    console.error('Error aceptando términos:', error);
    throw error;
  }
}

/**
 * Obtener términos activos con estado de aceptación del usuario
 * Alias de verificarEstadoTerminos para mayor claridad en algunos contextos
 * @param userId - ID del usuario
 * @returns Estado de aceptación con documento completo
 */
export async function obtenerTerminosConEstado(
  userId: number
): Promise<ApiResponse<TermsAcceptanceStatus>> {
  return verificarEstadoTerminos(userId);
}
