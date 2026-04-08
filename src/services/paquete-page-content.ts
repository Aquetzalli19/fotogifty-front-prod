/**
 * Paquete (Per-Product) Page Content Service
 *
 * Service for managing per-product page content overrides.
 * Follows the same pattern as product-page-content.ts but scoped to a specific paquete.
 * Reuses the same interfaces and mappers — the data shape is identical.
 *
 * Fallback chain: Per-producto → Global CMS → Static defaults
 */

import { apiClient } from '@/lib/api-client';
import {
  ProductPageSectionComplete,
  ProductPageContent,
  ProductPageSlide,
  ProductPageOption,
  ProductPageSectionDTO,
  ProductPageSlideCreateDTO,
  ProductPageSlideUpdateDTO,
  ProductPageOptionCreateDTO,
  ProductPageOptionUpdateDTO,
  ProductPageSectionKey,
  ProductPageReorderDTO,
} from '@/interfaces/product-page-content';
import {
  mapBackendToProductPageSectionComplete,
  mapBackendToProductPageSections,
  mapBackendToProductPageSlide,
  mapBackendToProductPageOption,
  mapProductPageSectionDTOToBackend,
  mapProductPageSlideCreateDTOToBackend,
  mapProductPageSlideUpdateDTOToBackend,
  mapProductPageOptionCreateDTOToBackend,
  mapProductPageOptionUpdateDTOToBackend,
} from '@/lib/mappers/product-page-mapper';

// ============================================
// API Response Types
// ============================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface MappedApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ============================================
// Override Status
// ============================================

export interface SectionOverrideStatus {
  sectionKey: ProductPageSectionKey;
  hasOverride: boolean;
}

// ============================================
// Merged Content (Public — with fallback)
// ============================================

export async function obtenerContenidoMergedPaquete(
  paqueteId: number
): Promise<MappedApiResponse<ProductPageContent>> {
  const response = await apiClient.get<ApiResponse<unknown[]>>(
    `/paquetes/${paqueteId}/page-content/merged`
  );

  if (response.success && response.data) {
    const sections = mapBackendToProductPageSections(response.data as unknown as never[]);
    const content: ProductPageContent = {
      gallery: null,
      why_choose: null,
      paper_types: null,
      print_services: null,
      product_types: null,
      sizes_table: null,
    };

    sections.forEach(section => {
      content[section.section.sectionKey] = section;
    });

    return {
      success: true,
      data: content,
      message: response.message,
    };
  }

  return {
    success: false,
    error: response.error || 'Error al obtener contenido merged del paquete',
  };
}

// ============================================
// Override Status (Admin)
// ============================================

export async function obtenerEstadoOverrides(
  paqueteId: number
): Promise<MappedApiResponse<SectionOverrideStatus[]>> {
  const response = await apiClient.get<ApiResponse<{ section_key: string; has_override: boolean }[]>>(
    `/paquetes/${paqueteId}/page-content/status`
  );

  if (response.success && response.data) {
    const data = (response.data as unknown as { section_key: string; has_override: boolean }[]).map(item => ({
      sectionKey: item.section_key as ProductPageSectionKey,
      hasOverride: item.has_override,
    }));
    return { success: true, data };
  }

  return {
    success: false,
    error: response.error || 'Error al obtener estado de overrides',
  };
}

// ============================================
// Sections CRUD (Admin)
// ============================================

export async function obtenerSeccionesPaquetePage(
  paqueteId: number
): Promise<MappedApiResponse<ProductPageSectionComplete[]>> {
  const response = await apiClient.get<ApiResponse<unknown[]>>(
    `/paquetes/${paqueteId}/page-content/sections`
  );

  if (response.success && response.data) {
    return {
      success: true,
      data: mapBackendToProductPageSections(response.data as unknown as never[]),
      message: response.message,
    };
  }

  return {
    success: false,
    error: response.error || 'Error al obtener secciones del paquete',
  };
}

/**
 * Loads a section for a paquete, preferring the per-product override if it exists.
 *
 * Returns `isInherited: true` when the section has no per-product override and the
 * data returned is the global fallback (read-only preview — slide/option CRUD will
 * fail with 404 against the per-product endpoints). Returns `isInherited: false`
 * when the section has a real per-product row (CRUD is safe).
 */
export async function obtenerSeccionPaquetePagePorKey(
  paqueteId: number,
  sectionKey: ProductPageSectionKey
): Promise<MappedApiResponse<ProductPageSectionComplete> & { isInherited?: boolean }> {
  // 1) Try the per-product-only endpoint first.
  const perProductRes = await obtenerSeccionesPaquetePage(paqueteId);

  if (perProductRes.success && perProductRes.data) {
    const ownSection = perProductRes.data.find(s => s.section.sectionKey === sectionKey);
    if (ownSection) {
      return { success: true, data: ownSection, isInherited: false };
    }
  }

  // 2) No per-product override — fall back to merged (global fallback) as read-only preview.
  const allSections = await obtenerContenidoMergedPaquete(paqueteId);

  if (allSections.success && allSections.data) {
    const section = allSections.data[sectionKey];
    if (section) {
      return { success: true, data: section, isInherited: true };
    }
  }

  return {
    success: false,
    error: allSections.error || 'Sección no encontrada',
  };
}

export async function actualizarSeccionPaquetePage(
  paqueteId: number,
  sectionKey: ProductPageSectionKey,
  data: ProductPageSectionDTO
): Promise<MappedApiResponse<ProductPageSectionComplete>> {
  const backendData = mapProductPageSectionDTOToBackend(data);
  const response = await apiClient.put<ApiResponse<unknown>>(
    `/paquetes/${paqueteId}/page-content/sections/${sectionKey}`,
    backendData
  );

  if (response.success && response.data) {
    const mapped = mapBackendToProductPageSectionComplete(response.data as never);
    return {
      success: true,
      data: mapped,
      message: response.message,
    };
  }

  return {
    success: false,
    error: response.error || 'Error al actualizar sección del paquete',
  };
}

export async function eliminarSeccionPaquetePage(
  paqueteId: number,
  sectionKey: ProductPageSectionKey
): Promise<MappedApiResponse<void>> {
  const response = await apiClient.delete(
    `/paquetes/${paqueteId}/page-content/sections/${sectionKey}`
  );

  return {
    success: response.success,
    message: response.message || 'Sección revertida a global',
    error: response.error,
  };
}

export async function toggleSeccionPaquetePageActiva(
  paqueteId: number,
  sectionKey: ProductPageSectionKey
): Promise<MappedApiResponse<{ activo: boolean }>> {
  const response = await apiClient.patch<ApiResponse<{ activo: boolean }>>(
    `/paquetes/${paqueteId}/page-content/sections/${sectionKey}/toggle`,
    {}
  );

  if (response.success && response.data) {
    return {
      success: true,
      data: response.data as unknown as { activo: boolean },
      message: response.message,
    };
  }

  return {
    success: response.success,
    message: response.message,
    error: response.error,
  };
}

// ============================================
// Slides CRUD (Admin)
// ============================================

export async function crearSlidePaquetePage(
  paqueteId: number,
  data: ProductPageSlideCreateDTO
): Promise<MappedApiResponse<ProductPageSlide>> {
  const backendData = mapProductPageSlideCreateDTOToBackend(data);
  const response = await apiClient.post<ApiResponse<unknown>>(
    `/paquetes/${paqueteId}/page-content/slides`,
    backendData
  );

  if (response.success && response.data) {
    return {
      success: true,
      data: mapBackendToProductPageSlide(response.data as never),
      message: response.message,
    };
  }

  return {
    success: false,
    error: response.error || 'Error al crear slide',
  };
}

export async function actualizarSlidePaquetePage(
  paqueteId: number,
  id: number,
  data: ProductPageSlideUpdateDTO
): Promise<MappedApiResponse<ProductPageSlide>> {
  const backendData = mapProductPageSlideUpdateDTOToBackend(data);
  const response = await apiClient.put<ApiResponse<unknown>>(
    `/paquetes/${paqueteId}/page-content/slides/${id}`,
    backendData
  );

  if (response.success && response.data) {
    return {
      success: true,
      data: mapBackendToProductPageSlide(response.data as never),
      message: response.message,
    };
  }

  return {
    success: false,
    error: response.error || 'Error al actualizar slide',
  };
}

export async function eliminarSlidePaquetePage(
  paqueteId: number,
  id: number
): Promise<MappedApiResponse<void>> {
  const response = await apiClient.delete(
    `/paquetes/${paqueteId}/page-content/slides/${id}`
  );

  return {
    success: response.success,
    message: response.message,
    error: response.error,
  };
}

export async function reordenarSlidesPaquetePage(
  paqueteId: number,
  data: ProductPageReorderDTO
): Promise<MappedApiResponse<void>> {
  const response = await apiClient.put<ApiResponse<void>>(
    `/paquetes/${paqueteId}/page-content/slides/reorder`,
    { section_key: data.sectionKey, slide_ids: data.ids }
  );

  return {
    success: response.success,
    message: response.message,
    error: response.error,
  };
}

// ============================================
// Options CRUD (Admin)
// ============================================

export async function crearOpcionPaquetePage(
  paqueteId: number,
  data: ProductPageOptionCreateDTO
): Promise<MappedApiResponse<ProductPageOption>> {
  const backendData = mapProductPageOptionCreateDTOToBackend(data);
  const response = await apiClient.post<ApiResponse<unknown>>(
    `/paquetes/${paqueteId}/page-content/options`,
    backendData
  );

  if (response.success && response.data) {
    return {
      success: true,
      data: mapBackendToProductPageOption(response.data as never),
      message: response.message,
    };
  }

  return {
    success: false,
    error: response.error || 'Error al crear opción',
  };
}

export async function actualizarOpcionPaquetePage(
  paqueteId: number,
  id: number,
  data: ProductPageOptionUpdateDTO
): Promise<MappedApiResponse<ProductPageOption>> {
  const backendData = mapProductPageOptionUpdateDTOToBackend(data);
  const response = await apiClient.put<ApiResponse<unknown>>(
    `/paquetes/${paqueteId}/page-content/options/${id}`,
    backendData
  );

  if (response.success && response.data) {
    return {
      success: true,
      data: mapBackendToProductPageOption(response.data as never),
      message: response.message,
    };
  }

  return {
    success: false,
    error: response.error || 'Error al actualizar opción',
  };
}

export async function eliminarOpcionPaquetePage(
  paqueteId: number,
  id: number
): Promise<MappedApiResponse<void>> {
  const response = await apiClient.delete(
    `/paquetes/${paqueteId}/page-content/options/${id}`
  );

  return {
    success: response.success,
    message: response.message,
    error: response.error,
  };
}

export async function reordenarOpcionesPaquetePage(
  paqueteId: number,
  data: ProductPageReorderDTO
): Promise<MappedApiResponse<void>> {
  const response = await apiClient.put<ApiResponse<void>>(
    `/paquetes/${paqueteId}/page-content/options/reorder`,
    { section_key: data.sectionKey, option_ids: data.ids }
  );

  return {
    success: response.success,
    message: response.message,
    error: response.error,
  };
}

// ============================================
// Clone from Global
// ============================================

export async function clonarDesdeGlobal(
  paqueteId: number,
  sectionKeys?: ProductPageSectionKey[]
): Promise<MappedApiResponse<ProductPageSectionComplete[]>> {
  const response = await apiClient.post<ApiResponse<unknown[]>>(
    `/paquetes/${paqueteId}/page-content/clone-from-global`,
    { section_keys: sectionKeys ?? null }
  );

  if (response.success && response.data) {
    return {
      success: true,
      data: mapBackendToProductPageSections(response.data as unknown as never[]),
      message: response.message,
    };
  }

  return {
    success: false,
    error: response.error || 'Error al clonar desde global',
  };
}

// ============================================
// Image Upload
// ============================================

export async function subirImagenPaquetePage(
  paqueteId: number,
  sectionKey: ProductPageSectionKey,
  imageType: 'main' | 'slide',
  file: File
): Promise<MappedApiResponse<{ url: string }>> {
  const formData = new FormData();
  formData.append('section_key', sectionKey);
  formData.append('image_type', imageType);
  formData.append('imagen', file);

  const response = await apiClient.postFormData<ApiResponse<{ url: string }>>(
    `/paquetes/${paqueteId}/page-content/upload`,
    formData
  );

  if (response.success && response.data) {
    return {
      success: true,
      data: response.data as unknown as { url: string },
      message: response.message,
    };
  }

  return {
    success: response.success,
    message: response.message,
    error: response.error,
  };
}
