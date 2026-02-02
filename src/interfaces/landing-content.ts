/**
 * Landing Page CMS Interfaces
 *
 * These interfaces define the data structures for the landing page content management system.
 * The system manages 11 sections (Polaroids is split into 3 sub-sections).
 */

/**
 * Valid section keys for the landing page.
 * Each key corresponds to a specific section of the landing page.
 */
export type SectionKey =
  | 'hero'
  | 'extensions'
  | 'product_slider'
  | 'legend'
  | 'calendars'
  | 'single_product'
  | 'prints'
  | 'polaroids_banner'
  | 'polaroids_single'
  | 'polaroids_collage'
  | 'platform_showcase';

/**
 * Slide types for carousel and collage sections
 */
export type SlideType = 'hero_slide' | 'product_slide' | 'collage_image';

/**
 * Configuration for carousel behavior
 */
export interface CarouselConfig {
  autoplay: boolean;
  autoplaySpeed: number;
  transitionSpeed: number;
  infinite: boolean;
}

/**
 * Main section data structure
 * Contains all possible fields that a section can have.
 * Not all fields are used by every section.
 */
export interface LandingSection {
  id: number;
  sectionKey: SectionKey;
  titulo: string | null;
  subtitulo: string | null;
  descripcion: string | null;
  textoPrimario: string | null;
  textoSecundario: string | null;
  colorPrimario: string | null;
  colorSecundario: string | null;
  colorGradienteInicio: string | null;
  colorGradienteMedio: string | null;
  colorGradienteFin: string | null;
  imagenPrincipalUrl: string | null;
  imagenFondoUrl: string | null;
  botonTexto: string | null;
  botonColor: string | null;
  botonEnlace: string | null;
  configuracionExtra: CarouselConfig | null;
  orden: number;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Slide data structure for carousels and collages
 */
export interface LandingSlide {
  id: number;
  sectionKey: SectionKey;
  tipo: SlideType;
  titulo: string | null;
  descripcion: string | null;
  imagenUrl: string;
  orden: number;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Option data structure for size/format selections
 */
export interface LandingOption {
  id: number;
  sectionKey: SectionKey;
  texto: string;
  orden: number;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Complete section data including slides and options
 */
export interface LandingSectionComplete {
  section: LandingSection;
  slides: LandingSlide[];
  options: LandingOption[];
}

/**
 * All landing content organized by section key
 */
export interface LandingContent {
  hero: LandingSectionComplete | null;
  extensions: LandingSectionComplete | null;
  product_slider: LandingSectionComplete | null;
  legend: LandingSectionComplete | null;
  calendars: LandingSectionComplete | null;
  single_product: LandingSectionComplete | null;
  prints: LandingSectionComplete | null;
  polaroids_banner: LandingSectionComplete | null;
  polaroids_single: LandingSectionComplete | null;
  polaroids_collage: LandingSectionComplete | null;
  platform_showcase: LandingSectionComplete | null;
}

// ============================================
// DTOs for creating and updating content
// ============================================

/**
 * DTO for updating a section
 */
export interface LandingSectionDTO {
  titulo?: string | null;
  subtitulo?: string | null;
  descripcion?: string | null;
  textoPrimario?: string | null;
  textoSecundario?: string | null;
  colorPrimario?: string | null;
  colorSecundario?: string | null;
  colorGradienteInicio?: string | null;
  colorGradienteMedio?: string | null;
  colorGradienteFin?: string | null;
  imagenPrincipalUrl?: string | null;
  imagenFondoUrl?: string | null;
  botonTexto?: string | null;
  botonColor?: string | null;
  botonEnlace?: string | null;
  configuracionExtra?: CarouselConfig | null;
  activo?: boolean;
}

/**
 * DTO for creating a slide
 */
export interface LandingSlideCreateDTO {
  sectionKey: SectionKey;
  tipo: SlideType;
  titulo?: string | null;
  descripcion?: string | null;
  imagenUrl: string;
  orden?: number;
}

/**
 * DTO for updating a slide
 */
export interface LandingSlideUpdateDTO {
  titulo?: string | null;
  descripcion?: string | null;
  imagenUrl?: string;
  orden?: number;
  activo?: boolean;
}

/**
 * DTO for creating an option
 */
export interface LandingOptionCreateDTO {
  sectionKey: SectionKey;
  texto: string;
  orden?: number;
}

/**
 * DTO for updating an option
 */
export interface LandingOptionUpdateDTO {
  texto?: string;
  orden?: number;
  activo?: boolean;
}

/**
 * DTO for reordering slides or options
 */
export interface ReorderDTO {
  sectionKey: SectionKey;
  ids: number[];
}

// ============================================
// Section metadata for admin UI
// ============================================

/**
 * Metadata about each section for the admin interface
 */
export interface SectionMetadata {
  key: SectionKey;
  name: string;
  description: string;
  hasSlides: boolean;
  hasOptions: boolean;
  slideType?: SlideType;
  maxSlides?: number;
  editableFields: (keyof LandingSection)[];
}

/**
 * Section metadata configuration
 */
export const SECTION_METADATA: Record<SectionKey, SectionMetadata> = {
  hero: {
    key: 'hero',
    name: 'Hero',
    description: 'Sección principal con carrusel de imágenes',
    hasSlides: true,
    hasOptions: false,
    slideType: 'hero_slide',
    maxSlides: 10,
    editableFields: ['titulo', 'subtitulo', 'botonTexto', 'botonColor', 'botonEnlace', 'configuracionExtra'],
  },
  extensions: {
    key: 'extensions',
    name: 'Ampliaciones',
    description: 'Sección de ampliaciones con imagen y opciones',
    hasSlides: false,
    hasOptions: true,
    editableFields: ['titulo', 'subtitulo', 'imagenPrincipalUrl', 'botonColor'],
  },
  product_slider: {
    key: 'product_slider',
    name: 'Slider de Productos',
    description: 'Carrusel de productos destacados',
    hasSlides: true,
    hasOptions: false,
    slideType: 'product_slide',
    maxSlides: 10,
    editableFields: ['textoPrimario', 'textoSecundario', 'configuracionExtra'],
  },
  legend: {
    key: 'legend',
    name: 'Leyenda',
    description: 'Sección con texto y fondo con parallax',
    hasSlides: false,
    hasOptions: false,
    editableFields: ['textoPrimario', 'textoSecundario', 'imagenFondoUrl', 'colorGradienteInicio', 'colorGradienteMedio', 'colorGradienteFin'],
  },
  calendars: {
    key: 'calendars',
    name: 'Calendarios',
    description: 'Sección de calendarios con collage de imágenes',
    hasSlides: true,
    hasOptions: true,
    slideType: 'collage_image',
    maxSlides: 4,
    editableFields: ['titulo', 'subtitulo', 'descripcion'],
  },
  single_product: {
    key: 'single_product',
    name: 'Producto Destacado',
    description: 'Producto individual con imagen de fondo',
    hasSlides: false,
    hasOptions: false,
    editableFields: ['titulo', 'imagenFondoUrl', 'botonTexto', 'botonColor', 'botonEnlace'],
  },
  prints: {
    key: 'prints',
    name: 'Prints',
    description: 'Sección de prints con imagen dual',
    hasSlides: false,
    hasOptions: true,
    editableFields: ['titulo', 'subtitulo', 'descripcion', 'imagenPrincipalUrl'],
  },
  polaroids_banner: {
    key: 'polaroids_banner',
    name: 'Polaroids - Banner',
    description: 'Banner de texto para sección Polaroids',
    hasSlides: false,
    hasOptions: false,
    editableFields: ['textoPrimario', 'textoSecundario', 'colorPrimario'],
  },
  polaroids_single: {
    key: 'polaroids_single',
    name: 'Polaroids - Individual',
    description: 'Producto Polaroid destacado',
    hasSlides: false,
    hasOptions: false,
    editableFields: ['titulo', 'subtitulo', 'descripcion', 'imagenPrincipalUrl', 'botonColor'],
  },
  polaroids_collage: {
    key: 'polaroids_collage',
    name: 'Polaroids - Collage',
    description: 'Collage de Polaroids con opciones',
    hasSlides: true,
    hasOptions: true,
    slideType: 'collage_image',
    maxSlides: 4,
    editableFields: ['titulo', 'subtitulo'],
  },
  platform_showcase: {
    key: 'platform_showcase',
    name: 'Showcase de Plataforma',
    description: 'Sección mostrando la plataforma',
    hasSlides: false,
    hasOptions: false,
    editableFields: ['textoPrimario', 'textoSecundario', 'imagenPrincipalUrl', 'colorGradienteInicio', 'colorGradienteMedio', 'colorGradienteFin'],
  },
};

/**
 * Get human-readable label for a section field
 */
export const FIELD_LABELS: Record<keyof LandingSection, string> = {
  id: 'ID',
  sectionKey: 'Clave de Sección',
  titulo: 'Título',
  subtitulo: 'Subtítulo',
  descripcion: 'Descripción',
  textoPrimario: 'Texto Primario',
  textoSecundario: 'Texto Secundario',
  colorPrimario: 'Color Primario',
  colorSecundario: 'Color Secundario',
  colorGradienteInicio: 'Gradiente Inicio',
  colorGradienteMedio: 'Gradiente Medio',
  colorGradienteFin: 'Gradiente Fin',
  imagenPrincipalUrl: 'Imagen Principal',
  imagenFondoUrl: 'Imagen de Fondo',
  botonTexto: 'Texto del Botón',
  botonColor: 'Color del Botón',
  botonEnlace: 'Enlace del Botón',
  configuracionExtra: 'Configuración del Carrusel',
  orden: 'Orden',
  activo: 'Activo',
  createdAt: 'Fecha de Creación',
  updatedAt: 'Fecha de Actualización',
};
