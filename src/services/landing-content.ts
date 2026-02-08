/**
 * Landing Content Service
 *
 * Service for managing landing page content via the CMS.
 * Currently uses mock data, will be connected to real API when backend is ready.
 */

import { apiClient } from '@/lib/api-client';
import {
  LandingSectionComplete,
  LandingContent,
  LandingSection,
  LandingSlide,
  LandingOption,
  LandingSectionDTO,
  LandingSlideCreateDTO,
  LandingSlideUpdateDTO,
  LandingOptionCreateDTO,
  LandingOptionUpdateDTO,
  SectionKey,
  ReorderDTO,
} from '@/interfaces/landing-content';
import {
  mapBackendToLandingSectionComplete,
  mapBackendToLandingSections,
  mapBackendToLandingSlide,
  mapBackendToLandingOption,
  mapLandingSectionDTOToBackend,
  mapLandingSlideCreateDTOToBackend,
  mapLandingSlideUpdateDTOToBackend,
  mapLandingOptionCreateDTOToBackend,
  mapLandingOptionUpdateDTOToBackend,
} from '@/lib/mappers/landing-content-mapper';
import { DEFAULT_LANDING_CONTENT, SECTION_ORDER } from '@/lib/landing-defaults';

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
// Configuration
// ============================================

/**
 * Set to true to use mock data instead of real API.
 * Backend is now deployed on Railway and ready to use.
 */
const USE_MOCK_DATA = false;

// In-memory mock data storage (simulates database)
let mockSections = JSON.parse(JSON.stringify(DEFAULT_LANDING_CONTENT)) as LandingContent;

/**
 * Reset mock data to defaults (useful for testing)
 */
export function resetMockData(): void {
  mockSections = JSON.parse(JSON.stringify(DEFAULT_LANDING_CONTENT));
}

// ============================================
// Section Endpoints
// ============================================

/**
 * Get all landing page content organized by section key
 */
export async function obtenerTodoContenidoLanding(): Promise<MappedApiResponse<LandingContent>> {
  if (USE_MOCK_DATA) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      success: true,
      data: mockSections,
    };
  }

  const response = await apiClient.get<ApiResponse<unknown[]>>('/landing-content/sections');

  if (response.success && response.data) {
    const sections = mapBackendToLandingSections(response.data as unknown as never[]);
    const content: LandingContent = {
      hero: null,
      extensions: null,
      product_slider: null,
      legend: null,
      calendars: null,
      single_product: null,
      prints: null,
      polaroids_banner: null,
      polaroids_single: null,
      polaroids_collage: null,
      platform_showcase: null,
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
    error: response.error || 'Error al obtener contenido de landing',
  };
}

/**
 * Get all sections as an array (sorted by order)
 */
export async function obtenerSeccionesLanding(): Promise<MappedApiResponse<LandingSectionComplete[]>> {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 100));
    const sectionsArray = SECTION_ORDER
      .map(key => mockSections[key])
      .filter((s): s is LandingSectionComplete => s !== null);
    return {
      success: true,
      data: sectionsArray,
    };
  }

  const response = await apiClient.get<ApiResponse<unknown[]>>('/landing-content/sections');

  if (response.success && response.data) {
    return {
      success: true,
      data: mapBackendToLandingSections(response.data as unknown as never[]),
      message: response.message,
    };
  }

  return {
    success: false,
    error: response.error || 'Error al obtener secciones',
  };
}

/**
 * Get a single section by key
 */
export async function obtenerSeccionPorKey(sectionKey: SectionKey): Promise<MappedApiResponse<LandingSectionComplete>> {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 50));
    const section = mockSections[sectionKey];
    if (section) {
      return {
        success: true,
        data: section,
      };
    }
    return {
      success: false,
      error: 'Sección no encontrada',
    };
  }

  const response = await apiClient.get<ApiResponse<unknown>>(`/landing-content/sections/${sectionKey}`);

  if (response.success && response.data) {
    return {
      success: true,
      data: mapBackendToLandingSectionComplete(response.data as never),
      message: response.message,
    };
  }

  return {
    success: false,
    error: response.error || 'Error al obtener sección',
  };
}

/**
 * Update a section
 */
export async function actualizarSeccion(
  sectionKey: SectionKey,
  data: LandingSectionDTO
): Promise<MappedApiResponse<LandingSection>> {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 100));
    const section = mockSections[sectionKey];
    if (!section) {
      return {
        success: false,
        error: 'Sección no encontrada',
      };
    }

    // Update section data
    const updatedSection: LandingSection = {
      ...section.section,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    mockSections[sectionKey] = {
      ...section,
      section: updatedSection,
    };

    return {
      success: true,
      data: updatedSection,
      message: 'Sección actualizada exitosamente',
    };
  }

  const backendData = mapLandingSectionDTOToBackend(data);
  const response = await apiClient.put<ApiResponse<unknown>>(
    `/landing-content/sections/${sectionKey}`,
    backendData
  );

  if (response.success && response.data) {
    const mapped = mapBackendToLandingSectionComplete(response.data as never);
    return {
      success: true,
      data: mapped.section,
      message: response.message,
    };
  }

  return {
    success: false,
    error: response.error || 'Error al actualizar sección',
  };
}

/**
 * Toggle section active status
 */
export async function toggleSeccionActiva(sectionKey: SectionKey): Promise<MappedApiResponse<{ activo: boolean }>> {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 50));
    const section = mockSections[sectionKey];
    if (!section) {
      return {
        success: false,
        error: 'Sección no encontrada',
      };
    }

    const newStatus = !section.section.activo;
    mockSections[sectionKey] = {
      ...section,
      section: {
        ...section.section,
        activo: newStatus,
        updatedAt: new Date().toISOString(),
      },
    };

    return {
      success: true,
      data: { activo: newStatus },
      message: newStatus ? 'Sección activada' : 'Sección desactivada',
    };
  }

  const response = await apiClient.patch<ApiResponse<{ activo: boolean }>>(
    `/landing-content/sections/${sectionKey}/toggle`,
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
// Slide Endpoints
// ============================================

/**
 * Create a new slide
 */
export async function crearSlide(data: LandingSlideCreateDTO): Promise<MappedApiResponse<LandingSlide>> {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 100));
    const section = mockSections[data.sectionKey];
    if (!section) {
      return {
        success: false,
        error: 'Sección no encontrada',
      };
    }

    const maxId = Math.max(0, ...section.slides.map(s => s.id));
    const maxOrder = Math.max(0, ...section.slides.map(s => s.orden));
    const newSlide: LandingSlide = {
      id: maxId + 1,
      sectionKey: data.sectionKey,
      tipo: data.tipo,
      titulo: data.titulo || null,
      descripcion: data.descripcion || null,
      imagenUrl: data.imagenUrl,
      orden: data.orden ?? maxOrder + 1,
      activo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    section.slides.push(newSlide);
    section.slides.sort((a, b) => a.orden - b.orden);

    return {
      success: true,
      data: newSlide,
      message: 'Slide creado exitosamente',
    };
  }

  const backendData = mapLandingSlideCreateDTOToBackend(data);
  const response = await apiClient.post<ApiResponse<unknown>>('/landing-content/slides', backendData);

  if (response.success && response.data) {
    return {
      success: true,
      data: mapBackendToLandingSlide(response.data as never),
      message: response.message,
    };
  }

  return {
    success: false,
    error: response.error || 'Error al crear slide',
  };
}

/**
 * Update a slide
 */
export async function actualizarSlide(
  id: number,
  data: LandingSlideUpdateDTO
): Promise<MappedApiResponse<LandingSlide>> {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 100));

    for (const sectionKey of SECTION_ORDER) {
      const section = mockSections[sectionKey];
      if (!section) continue;

      const slideIndex = section.slides.findIndex(s => s.id === id);
      if (slideIndex !== -1) {
        const updatedSlide: LandingSlide = {
          ...section.slides[slideIndex],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        section.slides[slideIndex] = updatedSlide;
        section.slides.sort((a, b) => a.orden - b.orden);

        return {
          success: true,
          data: updatedSlide,
          message: 'Slide actualizado exitosamente',
        };
      }
    }

    return {
      success: false,
      error: 'Slide no encontrado',
    };
  }

  const backendData = mapLandingSlideUpdateDTOToBackend(data);
  const response = await apiClient.put<ApiResponse<unknown>>(`/landing-content/slides/${id}`, backendData);

  if (response.success && response.data) {
    return {
      success: true,
      data: mapBackendToLandingSlide(response.data as never),
      message: response.message,
    };
  }

  return {
    success: false,
    error: response.error || 'Error al actualizar slide',
  };
}

/**
 * Delete a slide
 */
export async function eliminarSlide(id: number): Promise<MappedApiResponse<void>> {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 50));

    for (const sectionKey of SECTION_ORDER) {
      const section = mockSections[sectionKey];
      if (!section) continue;

      const slideIndex = section.slides.findIndex(s => s.id === id);
      if (slideIndex !== -1) {
        section.slides.splice(slideIndex, 1);
        return {
          success: true,
          message: 'Slide eliminado exitosamente',
        };
      }
    }

    return {
      success: false,
      error: 'Slide no encontrado',
    };
  }

  const response = await apiClient.delete(`/landing-content/slides/${id}`);
  return {
    success: response.success,
    message: response.message,
    error: response.error,
  };
}

/**
 * Reorder slides within a section
 */
export async function reordenarSlides(data: ReorderDTO): Promise<MappedApiResponse<void>> {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 50));
    const section = mockSections[data.sectionKey];
    if (!section) {
      return {
        success: false,
        error: 'Sección no encontrada',
      };
    }

    // Update orden based on new order
    data.ids.forEach((id, index) => {
      const slide = section.slides.find(s => s.id === id);
      if (slide) {
        slide.orden = index + 1;
      }
    });
    section.slides.sort((a, b) => a.orden - b.orden);

    return {
      success: true,
      message: 'Orden actualizado exitosamente',
    };
  }

  const response = await apiClient.put<ApiResponse<void>>('/landing-content/slides/reorder', {
    section_key: data.sectionKey,
    slide_ids: data.ids,
  });

  return {
    success: response.success,
    message: response.message,
    error: response.error,
  };
}

// ============================================
// Option Endpoints
// ============================================

/**
 * Create a new option
 */
export async function crearOpcion(data: LandingOptionCreateDTO): Promise<MappedApiResponse<LandingOption>> {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 100));
    const section = mockSections[data.sectionKey];
    if (!section) {
      return {
        success: false,
        error: 'Sección no encontrada',
      };
    }

    const maxId = Math.max(0, ...section.options.map(o => o.id));
    const maxOrder = Math.max(0, ...section.options.map(o => o.orden));
    const newOption: LandingOption = {
      id: maxId + 1,
      sectionKey: data.sectionKey,
      texto: data.texto,
      orden: data.orden ?? maxOrder + 1,
      activo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    section.options.push(newOption);
    section.options.sort((a, b) => a.orden - b.orden);

    return {
      success: true,
      data: newOption,
      message: 'Opción creada exitosamente',
    };
  }

  const backendData = mapLandingOptionCreateDTOToBackend(data);
  const response = await apiClient.post<ApiResponse<unknown>>('/landing-content/options', backendData);

  if (response.success && response.data) {
    return {
      success: true,
      data: mapBackendToLandingOption(response.data as never),
      message: response.message,
    };
  }

  return {
    success: false,
    error: response.error || 'Error al crear opción',
  };
}

/**
 * Update an option
 */
export async function actualizarOpcion(
  id: number,
  data: LandingOptionUpdateDTO
): Promise<MappedApiResponse<LandingOption>> {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 100));

    for (const sectionKey of SECTION_ORDER) {
      const section = mockSections[sectionKey];
      if (!section) continue;

      const optionIndex = section.options.findIndex(o => o.id === id);
      if (optionIndex !== -1) {
        const updatedOption: LandingOption = {
          ...section.options[optionIndex],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        section.options[optionIndex] = updatedOption;
        section.options.sort((a, b) => a.orden - b.orden);

        return {
          success: true,
          data: updatedOption,
          message: 'Opción actualizada exitosamente',
        };
      }
    }

    return {
      success: false,
      error: 'Opción no encontrada',
    };
  }

  const backendData = mapLandingOptionUpdateDTOToBackend(data);
  const response = await apiClient.put<ApiResponse<unknown>>(`/landing-content/options/${id}`, backendData);

  if (response.success && response.data) {
    return {
      success: true,
      data: mapBackendToLandingOption(response.data as never),
      message: response.message,
    };
  }

  return {
    success: false,
    error: response.error || 'Error al actualizar opción',
  };
}

/**
 * Delete an option
 */
export async function eliminarOpcion(id: number): Promise<MappedApiResponse<void>> {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 50));

    for (const sectionKey of SECTION_ORDER) {
      const section = mockSections[sectionKey];
      if (!section) continue;

      const optionIndex = section.options.findIndex(o => o.id === id);
      if (optionIndex !== -1) {
        section.options.splice(optionIndex, 1);
        return {
          success: true,
          message: 'Opción eliminada exitosamente',
        };
      }
    }

    return {
      success: false,
      error: 'Opción no encontrada',
    };
  }

  const response = await apiClient.delete(`/landing-content/options/${id}`);
  return {
    success: response.success,
    message: response.message,
    error: response.error,
  };
}

/**
 * Reorder options within a section
 */
export async function reordenarOpciones(data: ReorderDTO): Promise<MappedApiResponse<void>> {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 50));
    const section = mockSections[data.sectionKey];
    if (!section) {
      return {
        success: false,
        error: 'Sección no encontrada',
      };
    }

    data.ids.forEach((id, index) => {
      const option = section.options.find(o => o.id === id);
      if (option) {
        option.orden = index + 1;
      }
    });
    section.options.sort((a, b) => a.orden - b.orden);

    return {
      success: true,
      message: 'Orden actualizado exitosamente',
    };
  }

  const response = await apiClient.put<ApiResponse<void>>('/landing-content/options/reorder', {
    section_key: data.sectionKey,
    option_ids: data.ids,
  });

  return {
    success: response.success,
    message: response.message,
    error: response.error,
  };
}

// ============================================
// Image Upload
// ============================================

/**
 * Upload an image for landing content
 */
export async function subirImagenLanding(
  sectionKey: SectionKey,
  imageType: 'main' | 'background' | 'slide',
  file: File
): Promise<MappedApiResponse<{ url: string }>> {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 200));
    // In mock mode, create a local URL
    const url = URL.createObjectURL(file);
    return {
      success: true,
      data: { url },
      message: 'Imagen subida exitosamente',
    };
  }

  const formData = new FormData();
  formData.append('section_key', sectionKey);
  formData.append('image_type', imageType);
  formData.append('imagen', file);

  const response = await apiClient.postFormData<ApiResponse<{ url: string }>>(
    '/landing-content/upload',
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
