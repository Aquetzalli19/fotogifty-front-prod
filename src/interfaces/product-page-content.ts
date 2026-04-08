/**
 * Product Page CMS Interfaces
 *
 * Data structures for the product page content management system.
 * Manages 6 sections of marketing content shared across all product detail pages.
 */

/**
 * Valid section keys for the product page.
 */
export type ProductPageSectionKey =
  | 'gallery'
  | 'why_choose'
  | 'paper_types'
  | 'print_services'
  | 'product_types'
  | 'sizes_table';

/**
 * Slide types for product page sections
 */
export type ProductPageSlideType =
  | 'gallery_image'
  | 'value_card'
  | 'paper_type'
  | 'service_card'
  | 'product_type';

/**
 * Main section data structure
 */
export interface ProductPageSection {
  id: number;
  sectionKey: ProductPageSectionKey;
  titulo: string | null;
  subtitulo: string | null;
  descripcion: string | null;
  imagenPrincipalUrl: string | null;
  orden: number;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Slide data structure for cards, images, paper types, etc.
 */
export interface ProductPageSlide {
  id: number;
  sectionKey: ProductPageSectionKey;
  tipo: ProductPageSlideType;
  titulo: string | null;
  descripcion: string | null;
  imagenUrl: string | null;
  icono: string | null;
  /**
   * Optional link to a package (paquete). When set, the slide becomes
   * clickable on the public page and navigates to `/user/product/:id`.
   * Used primarily by `product_type` slides in the "Nuestros Productos"
   * section to let customers jump to a specific paquete.
   */
  paqueteLinkId?: number | null;
  orden: number;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Option data structure for features, table rows, etc.
 */
export interface ProductPageOption {
  id: number;
  sectionKey: ProductPageSectionKey;
  slideId: number | null;
  texto: string;
  textoSecundario: string | null;
  textoTerciario: string | null;
  textoCuarto: string | null;
  textoQuinto: string | null;
  orden: number;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Complete section data including slides and options
 */
export interface ProductPageSectionComplete {
  section: ProductPageSection;
  slides: ProductPageSlide[];
  options: ProductPageOption[];
}

/**
 * All product page content organized by section key
 */
export interface ProductPageContent {
  gallery: ProductPageSectionComplete | null;
  why_choose: ProductPageSectionComplete | null;
  paper_types: ProductPageSectionComplete | null;
  print_services: ProductPageSectionComplete | null;
  product_types: ProductPageSectionComplete | null;
  sizes_table: ProductPageSectionComplete | null;
}

// ============================================
// DTOs for creating and updating content
// ============================================

/**
 * DTO for updating a section
 */
export interface ProductPageSectionDTO {
  titulo?: string | null;
  subtitulo?: string | null;
  descripcion?: string | null;
  imagenPrincipalUrl?: string | null;
  activo?: boolean;
}

/**
 * DTO for creating a slide
 */
export interface ProductPageSlideCreateDTO {
  sectionKey: ProductPageSectionKey;
  tipo: ProductPageSlideType;
  titulo?: string | null;
  descripcion?: string | null;
  imagenUrl?: string | null;
  icono?: string | null;
  paqueteLinkId?: number | null;
  orden?: number;
}

/**
 * DTO for updating a slide
 */
export interface ProductPageSlideUpdateDTO {
  titulo?: string | null;
  descripcion?: string | null;
  imagenUrl?: string | null;
  icono?: string | null;
  paqueteLinkId?: number | null;
  orden?: number;
  activo?: boolean;
}

/**
 * DTO for creating an option
 */
export interface ProductPageOptionCreateDTO {
  sectionKey: ProductPageSectionKey;
  slideId?: number | null;
  texto: string;
  textoSecundario?: string | null;
  textoTerciario?: string | null;
  textoCuarto?: string | null;
  textoQuinto?: string | null;
  orden?: number;
}

/**
 * DTO for updating an option
 */
export interface ProductPageOptionUpdateDTO {
  texto?: string;
  textoSecundario?: string | null;
  textoTerciario?: string | null;
  textoCuarto?: string | null;
  textoQuinto?: string | null;
  orden?: number;
  activo?: boolean;
}

/**
 * DTO for reordering slides or options
 */
export interface ProductPageReorderDTO {
  sectionKey: ProductPageSectionKey;
  ids: number[];
}

// ============================================
// Section metadata for admin UI
// ============================================

/**
 * Metadata about each section for the admin interface
 */
export interface ProductPageSectionMetadata {
  key: ProductPageSectionKey;
  name: string;
  description: string;
  hasSlides: boolean;
  hasOptions: boolean;
  slideType?: ProductPageSlideType;
  maxSlides?: number;
  editableFields: (keyof ProductPageSection)[];
}

/**
 * Section metadata configuration
 */
export const PRODUCT_PAGE_SECTION_METADATA: Record<ProductPageSectionKey, ProductPageSectionMetadata> = {
  gallery: {
    key: 'gallery',
    name: 'Galería de Imágenes',
    description: 'Mosaico de imágenes representativas del servicio de impresión',
    hasSlides: true,
    hasOptions: false,
    slideType: 'gallery_image',
    maxSlides: 8,
    editableFields: ['titulo', 'subtitulo'],
  },
  why_choose: {
    key: 'why_choose',
    name: 'Por Qué Elegirnos',
    description: 'Cards de beneficios y valores de FotoGifty',
    hasSlides: true,
    hasOptions: false,
    slideType: 'value_card',
    maxSlides: 8,
    editableFields: ['titulo', 'subtitulo'],
  },
  paper_types: {
    key: 'paper_types',
    name: 'Tipos de Papel',
    description: 'Tabs con información sobre los tipos de papel disponibles',
    hasSlides: true,
    hasOptions: true,
    slideType: 'paper_type',
    maxSlides: 5,
    editableFields: ['titulo', 'subtitulo'],
  },
  print_services: {
    key: 'print_services',
    name: 'Servicios de Impresión',
    description: 'Cards de los diferentes servicios de impresión ofrecidos',
    hasSlides: true,
    hasOptions: false,
    slideType: 'service_card',
    maxSlides: 6,
    editableFields: ['titulo', 'subtitulo'],
  },
  product_types: {
    key: 'product_types',
    name: 'Tipos de Producto',
    description: 'Showcase visual de los tipos de producto disponibles',
    hasSlides: true,
    hasOptions: false,
    slideType: 'product_type',
    maxSlides: 6,
    editableFields: ['titulo', 'subtitulo'],
  },
  sizes_table: {
    key: 'sizes_table',
    name: 'Tabla de Tamaños',
    description: 'Tabla comparativa de tamaños, dimensiones y precios',
    hasSlides: false,
    hasOptions: true,
    editableFields: ['titulo', 'subtitulo'],
  },
};

/**
 * Field labels for the admin UI (Spanish)
 */
export const PRODUCT_PAGE_FIELD_LABELS: Record<keyof ProductPageSection, string> = {
  id: 'ID',
  sectionKey: 'Clave de Sección',
  titulo: 'Título',
  subtitulo: 'Subtítulo',
  descripcion: 'Descripción',
  imagenPrincipalUrl: 'Imagen Principal',
  orden: 'Orden',
  activo: 'Activo',
  createdAt: 'Fecha de Creación',
  updatedAt: 'Fecha de Actualización',
};
