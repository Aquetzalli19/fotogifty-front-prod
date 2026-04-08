/**
 * Product Page Content Mappers
 *
 * Maps between backend (snake_case, Spanish) and frontend (camelCase) formats.
 */

import {
  ProductPageSection,
  ProductPageSlide,
  ProductPageOption,
  ProductPageSectionComplete,
  ProductPageSectionDTO,
  ProductPageSlideCreateDTO,
  ProductPageSlideUpdateDTO,
  ProductPageOptionCreateDTO,
  ProductPageOptionUpdateDTO,
  ProductPageSectionKey,
  ProductPageSlideType,
} from '@/interfaces/product-page-content';

// ============================================
// Backend Interface Types
// ============================================

interface ProductPageSectionBackend {
  id: number;
  section_key: string;
  titulo: string | null;
  subtitulo: string | null;
  descripcion: string | null;
  imagen_principal_url: string | null;
  orden: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  slides?: ProductPageSlideBackend[];
  options?: ProductPageOptionBackend[];
}

interface ProductPageSlideBackend {
  id: number;
  section_key: string;
  tipo: string;
  titulo: string | null;
  descripcion: string | null;
  imagen_url: string | null;
  icono: string | null;
  paquete_link_id?: number | null;
  orden: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  options?: ProductPageOptionBackend[];
}

interface ProductPageOptionBackend {
  id: number;
  section_key: string;
  slide_id: number | null;
  texto: string;
  texto_secundario: string | null;
  texto_terciario: string | null;
  texto_cuarto: string | null;
  texto_quinto: string | null;
  orden: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// Helpers
// ============================================

function toBoolean(value: unknown, defaultValue = true): boolean {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'true' || lower === '1') return true;
    if (lower === 'false' || lower === '0') return false;
  }
  return defaultValue;
}

// ============================================
// Section Mappers
// ============================================

export function mapBackendToProductPageSection(backend: ProductPageSectionBackend): ProductPageSection {
  return {
    id: backend.id,
    sectionKey: backend.section_key as ProductPageSectionKey,
    titulo: backend.titulo,
    subtitulo: backend.subtitulo,
    descripcion: backend.descripcion,
    imagenPrincipalUrl: backend.imagen_principal_url,
    orden: backend.orden,
    activo: toBoolean(backend.activo, true),
    createdAt: backend.created_at,
    updatedAt: backend.updated_at,
  };
}

export function mapBackendToProductPageSectionComplete(backend: ProductPageSectionBackend): ProductPageSectionComplete {
  const slides = (backend.slides || []).map(mapBackendToProductPageSlide);

  // Collect options from both section-level AND nested inside slides.
  // Backend may nest options inside slides (e.g. paper_types slide.options[])
  // We flatten them into a single array with slideId set correctly.
  const sectionLevelOptions = (backend.options || []).map(mapBackendToProductPageOption);

  const nestedOptions: ProductPageOption[] = [];
  for (const slide of backend.slides || []) {
    if (slide.options && slide.options.length > 0) {
      for (const opt of slide.options) {
        const mapped = mapBackendToProductPageOption({
          ...opt,
          slide_id: opt.slide_id ?? slide.id,
          section_key: opt.section_key || backend.section_key,
        });
        nestedOptions.push(mapped);
      }
    }
  }

  // Merge, deduplicating by id (section-level takes precedence if duplicated)
  const seenIds = new Set(sectionLevelOptions.map(o => o.id));
  const allOptions = [
    ...sectionLevelOptions,
    ...nestedOptions.filter(o => !seenIds.has(o.id)),
  ];

  return {
    section: mapBackendToProductPageSection(backend),
    slides,
    options: allOptions,
  };
}

export function mapProductPageSectionDTOToBackend(dto: ProductPageSectionDTO): Record<string, unknown> {
  const backend: Record<string, unknown> = {};

  if (dto.titulo !== undefined) backend.titulo = dto.titulo;
  if (dto.subtitulo !== undefined) backend.subtitulo = dto.subtitulo;
  if (dto.descripcion !== undefined) backend.descripcion = dto.descripcion;
  if (dto.imagenPrincipalUrl !== undefined) backend.imagen_principal_url = dto.imagenPrincipalUrl;
  if (dto.activo !== undefined) backend.activo = dto.activo;

  return backend;
}

// ============================================
// Slide Mappers
// ============================================

export function mapBackendToProductPageSlide(backend: ProductPageSlideBackend): ProductPageSlide {
  return {
    id: backend.id,
    sectionKey: backend.section_key as ProductPageSectionKey,
    tipo: backend.tipo as ProductPageSlideType,
    titulo: backend.titulo,
    descripcion: backend.descripcion,
    imagenUrl: backend.imagen_url,
    icono: backend.icono,
    paqueteLinkId: backend.paquete_link_id ?? null,
    orden: backend.orden,
    activo: toBoolean(backend.activo, true),
    createdAt: backend.created_at,
    updatedAt: backend.updated_at,
  };
}

export function mapProductPageSlideCreateDTOToBackend(dto: ProductPageSlideCreateDTO): Record<string, unknown> {
  return {
    section_key: dto.sectionKey,
    tipo: dto.tipo,
    titulo: dto.titulo ?? null,
    descripcion: dto.descripcion ?? null,
    imagen_url: dto.imagenUrl ?? null,
    icono: dto.icono ?? null,
    paquete_link_id: dto.paqueteLinkId ?? null,
    orden: dto.orden,
  };
}

export function mapProductPageSlideUpdateDTOToBackend(dto: ProductPageSlideUpdateDTO): Record<string, unknown> {
  const backend: Record<string, unknown> = {};

  if (dto.titulo !== undefined) backend.titulo = dto.titulo;
  if (dto.descripcion !== undefined) backend.descripcion = dto.descripcion;
  if (dto.imagenUrl !== undefined) backend.imagen_url = dto.imagenUrl;
  if (dto.icono !== undefined) backend.icono = dto.icono;
  if (dto.paqueteLinkId !== undefined) backend.paquete_link_id = dto.paqueteLinkId;
  if (dto.orden !== undefined) backend.orden = dto.orden;
  if (dto.activo !== undefined) backend.activo = dto.activo;

  return backend;
}

// ============================================
// Option Mappers
// ============================================

export function mapBackendToProductPageOption(backend: ProductPageOptionBackend): ProductPageOption {
  return {
    id: backend.id,
    sectionKey: backend.section_key as ProductPageSectionKey,
    slideId: backend.slide_id,
    texto: backend.texto,
    textoSecundario: backend.texto_secundario,
    textoTerciario: backend.texto_terciario,
    textoCuarto: backend.texto_cuarto,
    textoQuinto: backend.texto_quinto,
    orden: backend.orden,
    activo: toBoolean(backend.activo, true),
    createdAt: backend.created_at,
    updatedAt: backend.updated_at,
  };
}

export function mapProductPageOptionCreateDTOToBackend(dto: ProductPageOptionCreateDTO): Record<string, unknown> {
  return {
    section_key: dto.sectionKey,
    slide_id: dto.slideId ?? null,
    texto: dto.texto,
    texto_secundario: dto.textoSecundario ?? null,
    texto_terciario: dto.textoTerciario ?? null,
    texto_cuarto: dto.textoCuarto ?? null,
    texto_quinto: dto.textoQuinto ?? null,
    orden: dto.orden,
  };
}

export function mapProductPageOptionUpdateDTOToBackend(dto: ProductPageOptionUpdateDTO): Record<string, unknown> {
  const backend: Record<string, unknown> = {};

  if (dto.texto !== undefined) backend.texto = dto.texto;
  if (dto.textoSecundario !== undefined) backend.texto_secundario = dto.textoSecundario;
  if (dto.textoTerciario !== undefined) backend.texto_terciario = dto.textoTerciario;
  if (dto.textoCuarto !== undefined) backend.texto_cuarto = dto.textoCuarto;
  if (dto.textoQuinto !== undefined) backend.texto_quinto = dto.textoQuinto;
  if (dto.orden !== undefined) backend.orden = dto.orden;
  if (dto.activo !== undefined) backend.activo = dto.activo;

  return backend;
}

// ============================================
// Bulk Mappers
// ============================================

export function mapBackendToProductPageSections(backendSections: ProductPageSectionBackend[]): ProductPageSectionComplete[] {
  return backendSections.map(mapBackendToProductPageSectionComplete);
}
