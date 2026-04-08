/**
 * Product Page Content Service
 *
 * Service for managing product page content via the CMS.
 * Follows the same pattern as landing-content.ts.
 */

import { apiClient } from '@/lib/api-client';
import {
  ProductPageSectionComplete,
  ProductPageContent,
  ProductPageSection,
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
import { DEFAULT_PRODUCT_PAGE_CONTENT, PRODUCT_PAGE_SECTION_ORDER } from '@/lib/product-page-defaults';

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
 * Toggle to false when backend endpoints are ready.
 */
const USE_MOCK_DATA = false;

let mockSections = JSON.parse(JSON.stringify(DEFAULT_PRODUCT_PAGE_CONTENT)) as ProductPageContent;

export function resetProductPageMockData(): void {
  mockSections = JSON.parse(JSON.stringify(DEFAULT_PRODUCT_PAGE_CONTENT));
}

// ============================================
// Section Endpoints
// ============================================

export async function obtenerTodoContenidoProductPage(): Promise<MappedApiResponse<ProductPageContent>> {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      success: true,
      data: mockSections,
    };
  }

  const response = await apiClient.get<ApiResponse<unknown[]>>('/product-page-content/sections');

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
    error: response.error || 'Error al obtener contenido de página de producto',
  };
}

export async function obtenerSeccionesProductPage(): Promise<MappedApiResponse<ProductPageSectionComplete[]>> {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 100));
    const sectionsArray = PRODUCT_PAGE_SECTION_ORDER
      .map(key => mockSections[key])
      .filter((s): s is ProductPageSectionComplete => s !== null);
    return {
      success: true,
      data: sectionsArray,
    };
  }

  const response = await apiClient.get<ApiResponse<unknown[]>>('/product-page-content/sections');

  if (response.success && response.data) {
    return {
      success: true,
      data: mapBackendToProductPageSections(response.data as unknown as never[]),
      message: response.message,
    };
  }

  return {
    success: false,
    error: response.error || 'Error al obtener secciones',
  };
}

export async function obtenerSeccionProductPagePorKey(sectionKey: ProductPageSectionKey): Promise<MappedApiResponse<ProductPageSectionComplete>> {
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

  const allSections = await obtenerSeccionesProductPage();

  if (allSections.success && allSections.data) {
    const section = allSections.data.find(s => s.section.sectionKey === sectionKey);
    if (section) {
      return {
        success: true,
        data: section,
      };
    }
  }

  return {
    success: false,
    error: allSections.error || 'Sección no encontrada',
  };
}

export async function actualizarSeccionProductPage(
  sectionKey: ProductPageSectionKey,
  data: ProductPageSectionDTO
): Promise<MappedApiResponse<ProductPageSection>> {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 100));
    const section = mockSections[sectionKey];
    if (!section) {
      return {
        success: false,
        error: 'Sección no encontrada',
      };
    }

    const updatedSection: ProductPageSection = {
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

  const backendData = mapProductPageSectionDTOToBackend(data);
  const response = await apiClient.put<ApiResponse<unknown>>(
    `/product-page-content/sections/${sectionKey}`,
    backendData
  );

  if (response.success && response.data) {
    const mapped = mapBackendToProductPageSectionComplete(response.data as never);
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

export async function toggleSeccionProductPageActiva(sectionKey: ProductPageSectionKey): Promise<MappedApiResponse<{ activo: boolean }>> {
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
    `/product-page-content/sections/${sectionKey}/toggle`,
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

export async function crearSlideProductPage(data: ProductPageSlideCreateDTO): Promise<MappedApiResponse<ProductPageSlide>> {
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
    const newSlide: ProductPageSlide = {
      id: maxId + 1,
      sectionKey: data.sectionKey,
      tipo: data.tipo,
      titulo: data.titulo || null,
      descripcion: data.descripcion || null,
      imagenUrl: data.imagenUrl || null,
      icono: data.icono || null,
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

  const backendData = mapProductPageSlideCreateDTOToBackend(data);
  const response = await apiClient.post<ApiResponse<unknown>>('/product-page-content/slides', backendData);

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

export async function actualizarSlideProductPage(
  id: number,
  data: ProductPageSlideUpdateDTO
): Promise<MappedApiResponse<ProductPageSlide>> {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 100));

    for (const sectionKey of PRODUCT_PAGE_SECTION_ORDER) {
      const section = mockSections[sectionKey];
      if (!section) continue;

      const slideIndex = section.slides.findIndex(s => s.id === id);
      if (slideIndex !== -1) {
        const updatedSlide: ProductPageSlide = {
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

  const backendData = mapProductPageSlideUpdateDTOToBackend(data);
  const response = await apiClient.put<ApiResponse<unknown>>(`/product-page-content/slides/${id}`, backendData);

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

export async function eliminarSlideProductPage(id: number): Promise<MappedApiResponse<void>> {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 50));

    for (const sectionKey of PRODUCT_PAGE_SECTION_ORDER) {
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

  const response = await apiClient.delete(`/product-page-content/slides/${id}`);
  return {
    success: response.success,
    message: response.message,
    error: response.error,
  };
}

export async function reordenarSlidesProductPage(data: ProductPageReorderDTO): Promise<MappedApiResponse<void>> {
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

  const response = await apiClient.put<ApiResponse<void>>('/product-page-content/slides/reorder', {
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

export async function crearOpcionProductPage(data: ProductPageOptionCreateDTO): Promise<MappedApiResponse<ProductPageOption>> {
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
    const newOption: ProductPageOption = {
      id: maxId + 1,
      sectionKey: data.sectionKey,
      slideId: data.slideId ?? null,
      texto: data.texto,
      textoSecundario: data.textoSecundario ?? null,
      textoTerciario: data.textoTerciario ?? null,
      textoCuarto: data.textoCuarto ?? null,
      textoQuinto: data.textoQuinto ?? null,
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

  const backendData = mapProductPageOptionCreateDTOToBackend(data);
  const response = await apiClient.post<ApiResponse<unknown>>('/product-page-content/options', backendData);

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

export async function actualizarOpcionProductPage(
  id: number,
  data: ProductPageOptionUpdateDTO
): Promise<MappedApiResponse<ProductPageOption>> {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 100));

    for (const sectionKey of PRODUCT_PAGE_SECTION_ORDER) {
      const section = mockSections[sectionKey];
      if (!section) continue;

      const optionIndex = section.options.findIndex(o => o.id === id);
      if (optionIndex !== -1) {
        const updatedOption: ProductPageOption = {
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

  const backendData = mapProductPageOptionUpdateDTOToBackend(data);
  const response = await apiClient.put<ApiResponse<unknown>>(`/product-page-content/options/${id}`, backendData);

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

export async function eliminarOpcionProductPage(id: number): Promise<MappedApiResponse<void>> {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 50));

    for (const sectionKey of PRODUCT_PAGE_SECTION_ORDER) {
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

  const response = await apiClient.delete(`/product-page-content/options/${id}`);
  return {
    success: response.success,
    message: response.message,
    error: response.error,
  };
}

export async function reordenarOpcionesProductPage(data: ProductPageReorderDTO): Promise<MappedApiResponse<void>> {
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

  const response = await apiClient.put<ApiResponse<void>>('/product-page-content/options/reorder', {
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

export async function subirImagenProductPage(
  sectionKey: ProductPageSectionKey,
  imageType: 'main' | 'slide',
  file: File
): Promise<MappedApiResponse<{ url: string }>> {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 200));
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
    '/product-page-content/upload',
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
