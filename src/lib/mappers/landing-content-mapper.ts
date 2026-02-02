/**
 * Landing Content Mappers
 *
 * Maps between backend (snake_case, Spanish) and frontend (camelCase) formats.
 */

import {
  LandingSection,
  LandingSlide,
  LandingOption,
  LandingSectionComplete,
  LandingSectionDTO,
  LandingSlideCreateDTO,
  LandingSlideUpdateDTO,
  LandingOptionCreateDTO,
  LandingOptionUpdateDTO,
  CarouselConfig,
  SectionKey,
  SlideType,
} from '@/interfaces/landing-content';

// ============================================
// Backend Interface Types
// ============================================

interface LandingSectionBackend {
  id: number;
  section_key: string;
  titulo: string | null;
  subtitulo: string | null;
  descripcion: string | null;
  texto_primario: string | null;
  texto_secundario: string | null;
  color_primario: string | null;
  color_secundario: string | null;
  color_gradiente_inicio: string | null;
  color_gradiente_medio: string | null;
  color_gradiente_fin: string | null;
  imagen_principal_url: string | null;
  imagen_fondo_url: string | null;
  boton_texto: string | null;
  boton_color: string | null;
  boton_enlace: string | null;
  configuracion_extra: CarouselConfig | null;
  orden: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  slides?: LandingSlideBackend[];
  options?: LandingOptionBackend[];
}

interface LandingSlideBackend {
  id: number;
  section_key: string;
  tipo: string;
  titulo: string | null;
  descripcion: string | null;
  imagen_url: string;
  orden: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

interface LandingOptionBackend {
  id: number;
  section_key: string;
  texto: string;
  orden: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// Section Mappers
// ============================================

/**
 * Map backend section to frontend format
 */
export function mapBackendToLandingSection(backend: LandingSectionBackend): LandingSection {
  return {
    id: backend.id,
    sectionKey: backend.section_key as SectionKey,
    titulo: backend.titulo,
    subtitulo: backend.subtitulo,
    descripcion: backend.descripcion,
    textoPrimario: backend.texto_primario,
    textoSecundario: backend.texto_secundario,
    colorPrimario: backend.color_primario,
    colorSecundario: backend.color_secundario,
    colorGradienteInicio: backend.color_gradiente_inicio,
    colorGradienteMedio: backend.color_gradiente_medio,
    colorGradienteFin: backend.color_gradiente_fin,
    imagenPrincipalUrl: backend.imagen_principal_url,
    imagenFondoUrl: backend.imagen_fondo_url,
    botonTexto: backend.boton_texto,
    botonColor: backend.boton_color,
    botonEnlace: backend.boton_enlace,
    configuracionExtra: backend.configuracion_extra,
    orden: backend.orden,
    activo: backend.activo,
    createdAt: backend.created_at,
    updatedAt: backend.updated_at,
  };
}

/**
 * Map backend section with nested slides and options
 */
export function mapBackendToLandingSectionComplete(backend: LandingSectionBackend): LandingSectionComplete {
  return {
    section: mapBackendToLandingSection(backend),
    slides: (backend.slides || []).map(mapBackendToLandingSlide),
    options: (backend.options || []).map(mapBackendToLandingOption),
  };
}

/**
 * Map frontend section DTO to backend format
 */
export function mapLandingSectionDTOToBackend(dto: LandingSectionDTO): Record<string, unknown> {
  const backend: Record<string, unknown> = {};

  if (dto.titulo !== undefined) backend.titulo = dto.titulo;
  if (dto.subtitulo !== undefined) backend.subtitulo = dto.subtitulo;
  if (dto.descripcion !== undefined) backend.descripcion = dto.descripcion;
  if (dto.textoPrimario !== undefined) backend.texto_primario = dto.textoPrimario;
  if (dto.textoSecundario !== undefined) backend.texto_secundario = dto.textoSecundario;
  if (dto.colorPrimario !== undefined) backend.color_primario = dto.colorPrimario;
  if (dto.colorSecundario !== undefined) backend.color_secundario = dto.colorSecundario;
  if (dto.colorGradienteInicio !== undefined) backend.color_gradiente_inicio = dto.colorGradienteInicio;
  if (dto.colorGradienteMedio !== undefined) backend.color_gradiente_medio = dto.colorGradienteMedio;
  if (dto.colorGradienteFin !== undefined) backend.color_gradiente_fin = dto.colorGradienteFin;
  if (dto.imagenPrincipalUrl !== undefined) backend.imagen_principal_url = dto.imagenPrincipalUrl;
  if (dto.imagenFondoUrl !== undefined) backend.imagen_fondo_url = dto.imagenFondoUrl;
  if (dto.botonTexto !== undefined) backend.boton_texto = dto.botonTexto;
  if (dto.botonColor !== undefined) backend.boton_color = dto.botonColor;
  if (dto.botonEnlace !== undefined) backend.boton_enlace = dto.botonEnlace;
  if (dto.configuracionExtra !== undefined) backend.configuracion_extra = dto.configuracionExtra;
  if (dto.activo !== undefined) backend.activo = dto.activo;

  return backend;
}

// ============================================
// Slide Mappers
// ============================================

/**
 * Map backend slide to frontend format
 */
export function mapBackendToLandingSlide(backend: LandingSlideBackend): LandingSlide {
  return {
    id: backend.id,
    sectionKey: backend.section_key as SectionKey,
    tipo: backend.tipo as SlideType,
    titulo: backend.titulo,
    descripcion: backend.descripcion,
    imagenUrl: backend.imagen_url,
    orden: backend.orden,
    activo: backend.activo,
    createdAt: backend.created_at,
    updatedAt: backend.updated_at,
  };
}

/**
 * Map frontend slide create DTO to backend format
 */
export function mapLandingSlideCreateDTOToBackend(dto: LandingSlideCreateDTO): Record<string, unknown> {
  return {
    section_key: dto.sectionKey,
    tipo: dto.tipo,
    titulo: dto.titulo ?? null,
    descripcion: dto.descripcion ?? null,
    imagen_url: dto.imagenUrl,
    orden: dto.orden,
  };
}

/**
 * Map frontend slide update DTO to backend format
 */
export function mapLandingSlideUpdateDTOToBackend(dto: LandingSlideUpdateDTO): Record<string, unknown> {
  const backend: Record<string, unknown> = {};

  if (dto.titulo !== undefined) backend.titulo = dto.titulo;
  if (dto.descripcion !== undefined) backend.descripcion = dto.descripcion;
  if (dto.imagenUrl !== undefined) backend.imagen_url = dto.imagenUrl;
  if (dto.orden !== undefined) backend.orden = dto.orden;
  if (dto.activo !== undefined) backend.activo = dto.activo;

  return backend;
}

// ============================================
// Option Mappers
// ============================================

/**
 * Map backend option to frontend format
 */
export function mapBackendToLandingOption(backend: LandingOptionBackend): LandingOption {
  return {
    id: backend.id,
    sectionKey: backend.section_key as SectionKey,
    texto: backend.texto,
    orden: backend.orden,
    activo: backend.activo,
    createdAt: backend.created_at,
    updatedAt: backend.updated_at,
  };
}

/**
 * Map frontend option create DTO to backend format
 */
export function mapLandingOptionCreateDTOToBackend(dto: LandingOptionCreateDTO): Record<string, unknown> {
  return {
    section_key: dto.sectionKey,
    texto: dto.texto,
    orden: dto.orden,
  };
}

/**
 * Map frontend option update DTO to backend format
 */
export function mapLandingOptionUpdateDTOToBackend(dto: LandingOptionUpdateDTO): Record<string, unknown> {
  const backend: Record<string, unknown> = {};

  if (dto.texto !== undefined) backend.texto = dto.texto;
  if (dto.orden !== undefined) backend.orden = dto.orden;
  if (dto.activo !== undefined) backend.activo = dto.activo;

  return backend;
}

// ============================================
// Bulk Mappers
// ============================================

/**
 * Map array of backend sections to frontend format
 */
export function mapBackendToLandingSections(backendSections: LandingSectionBackend[]): LandingSectionComplete[] {
  return backendSections.map(mapBackendToLandingSectionComplete);
}
