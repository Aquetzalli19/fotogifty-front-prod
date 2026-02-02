import { apiClient } from '@/lib/api-client';
import { LegalDocument, LegalDocumentDTO, LegalDocumentType } from '@/interfaces/legal-documents';
import {
  mapBackendToLegalDocument,
  mapBackendToLegalDocuments,
  mapLegalDocumentDTOToBackend,
  mapPartialLegalDocumentDTOToBackend,
} from '@/lib/mappers/legal-document-mapper';

// Tipo para la respuesta del backend
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Tipo para la respuesta mapeada al frontend
interface MappedApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Obtener documento legal activo por tipo
 */
export async function obtenerDocumentoLegalActivo(
  type: LegalDocumentType
): Promise<MappedApiResponse<LegalDocument>> {
  const response = await apiClient.get<ApiResponse<unknown>>(`/legal-documents/active/${type}`);

  if (response.success && response.data) {
    return {
      success: response.success,
      data: mapBackendToLegalDocument(response.data as never),
      message: response.message,
      error: response.error,
    };
  }

  return {
    success: response.success,
    message: response.message,
    error: response.error,
  };
}

/**
 * Obtener todos los documentos legales (Admin)
 */
export async function obtenerTodosDocumentosLegales(): Promise<MappedApiResponse<LegalDocument[]>> {
  const response = await apiClient.get<ApiResponse<unknown>>('/legal-documents');

  if (response.success && response.data) {
    return {
      success: response.success,
      data: mapBackendToLegalDocuments(response.data as unknown as never[]),
      message: response.message,
      error: response.error,
    };
  }

  return {
    success: response.success,
    message: response.message,
    error: response.error,
  };
}

/**
 * Obtener documento legal por ID (Admin)
 */
export async function obtenerDocumentoLegalPorId(id: number): Promise<MappedApiResponse<LegalDocument>> {
  const response = await apiClient.get<ApiResponse<unknown>>(`/legal-documents/${id}`);

  if (response.success && response.data) {
    return {
      success: response.success,
      data: mapBackendToLegalDocument(response.data as never),
      message: response.message,
      error: response.error,
    };
  }

  return {
    success: response.success,
    message: response.message,
    error: response.error,
  };
}

/**
 * Crear documento legal (Admin)
 */
export async function crearDocumentoLegal(data: LegalDocumentDTO): Promise<MappedApiResponse<LegalDocument>> {
  const backendData = mapLegalDocumentDTOToBackend(data);
  console.log('📤 Enviando documento legal al backend:', backendData);
  const response = await apiClient.post<ApiResponse<unknown>>('/legal-documents', backendData);

  if (response.success && response.data) {
    console.log('📥 Documento creado - Respuesta del backend:', response.data);
    const mappedData = mapBackendToLegalDocument(response.data as never);
    console.log('✅ Documento mapeado:', mappedData);
    return {
      success: response.success,
      data: mappedData,
      message: response.message,
      error: response.error,
    };
  }

  return {
    success: response.success,
    message: response.message,
    error: response.error,
  };
}

/**
 * Actualizar documento legal (Admin)
 */
export async function actualizarDocumentoLegal(
  id: number,
  data: Partial<LegalDocumentDTO>
): Promise<MappedApiResponse<LegalDocument>> {
  const backendData = mapPartialLegalDocumentDTOToBackend(data);
  const response = await apiClient.put<ApiResponse<unknown>>(`/legal-documents/${id}`, backendData);

  if (response.success && response.data) {
    return {
      success: response.success,
      data: mapBackendToLegalDocument(response.data as never),
      message: response.message,
      error: response.error,
    };
  }

  return {
    success: response.success,
    message: response.message,
    error: response.error,
  };
}

/**
 * Eliminar documento legal (Admin)
 */
export async function eliminarDocumentoLegal(id: number) {
  return apiClient.delete(`/legal-documents/${id}`);
}

/**
 * Activar documento legal (Admin)
 */
export async function activarDocumentoLegal(id: number): Promise<MappedApiResponse<LegalDocument>> {
  const response = await apiClient.post<ApiResponse<unknown>>(`/legal-documents/${id}/activate`, {});

  if (response.success && response.data) {
    return {
      success: response.success,
      data: mapBackendToLegalDocument(response.data as never),
      message: response.message,
      error: response.error,
    };
  }

  return {
    success: response.success,
    message: response.message,
    error: response.error,
  };
}
