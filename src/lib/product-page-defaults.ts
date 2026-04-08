/**
 * Default Product Page Content
 *
 * Fallback values for all product page sections.
 * Used when the API is unavailable or during initial setup.
 * Data sourced from the original product-detail-data.ts static content.
 */

import {
  ProductPageContent,
  ProductPageSectionComplete,
  ProductPageSectionKey,
} from '@/interfaces/product-page-content';

// ============================================
// Gallery Section
// ============================================

const galleryDefaults: ProductPageSectionComplete = {
  section: {
    id: 1,
    sectionKey: 'gallery',
    titulo: 'Imprime Tus Mejores Momentos',
    subtitulo: 'Cada foto cuenta una historia. Nosotros la imprimimos con la calidad que merece.',
    descripcion: null,
    imagenPrincipalUrl: null,
    orden: 1,
    activo: true,
  },
  slides: [
    { id: 1, sectionKey: 'gallery', tipo: 'gallery_image', titulo: 'Impresión de foto profesional', descripcion: 'col-span-2 row-span-2', imagenUrl: '/slide1.jpg', icono: null, orden: 1, activo: true },
    { id: 2, sectionKey: 'gallery', tipo: 'gallery_image', titulo: 'Foto impresa de alta calidad', descripcion: '', imagenUrl: '/slide2.jpg', icono: null, orden: 2, activo: true },
    { id: 3, sectionKey: 'gallery', tipo: 'gallery_image', titulo: 'Detalle de impresión fotográfica', descripcion: '', imagenUrl: '/slide3.jpg', icono: null, orden: 3, activo: true },
    { id: 4, sectionKey: 'gallery', tipo: 'gallery_image', titulo: 'Colección de fotos impresas', descripcion: '', imagenUrl: '/slide4.jpg', icono: null, orden: 4, activo: true },
    { id: 5, sectionKey: 'gallery', tipo: 'gallery_image', titulo: 'Producto de impresión', descripcion: '', imagenUrl: '/SingleProduct.jpg', icono: null, orden: 5, activo: true },
    { id: 6, sectionKey: 'gallery', tipo: 'gallery_image', titulo: 'Ejemplo de foto impresa', descripcion: 'col-span-2', imagenUrl: '/product-slider/slide1.jpg', icono: null, orden: 6, activo: true },
  ],
  options: [],
};

// ============================================
// Why Choose Section
// ============================================

const whyChooseDefaults: ProductPageSectionComplete = {
  section: {
    id: 2,
    sectionKey: 'why_choose',
    titulo: 'Por Qué Elegir FotoGifty',
    subtitulo: 'Nos dedicamos a transformar tus recuerdos digitales en impresiones de la más alta calidad.',
    descripcion: null,
    imagenPrincipalUrl: null,
    orden: 2,
    activo: true,
  },
  slides: [
    { id: 7, sectionKey: 'why_choose', tipo: 'value_card', titulo: 'Calidad Profesional', descripcion: 'Impresiones en papel fotográfico premium con tecnología de última generación para colores vibrantes y detalles nítidos.', imagenUrl: null, icono: 'Award', orden: 1, activo: true },
    { id: 8, sectionKey: 'why_choose', tipo: 'value_card', titulo: 'Personalización Total', descripcion: 'Editor integrado con filtros, ajustes y efectos para que cada foto quede exactamente como la imaginas.', imagenUrl: null, icono: 'Palette', orden: 2, activo: true },
    { id: 9, sectionKey: 'why_choose', tipo: 'value_card', titulo: 'Envío a Todo México', descripcion: 'Recibe tus impresiones en la puerta de tu casa con envío seguro y rastreable a cualquier parte del país.', imagenUrl: null, icono: 'Truck', orden: 3, activo: true },
    { id: 10, sectionKey: 'why_choose', tipo: 'value_card', titulo: 'Pago 100% Seguro', descripcion: 'Transacciones protegidas con Stripe. Tu información financiera siempre está segura con nosotros.', imagenUrl: null, icono: 'Shield', orden: 4, activo: true },
    { id: 11, sectionKey: 'why_choose', tipo: 'value_card', titulo: 'Entrega Rápida', descripcion: 'Procesamos tu pedido en tiempo récord para que disfrutes tus fotos impresas lo antes posible.', imagenUrl: null, icono: 'Clock', orden: 5, activo: true },
    { id: 12, sectionKey: 'why_choose', tipo: 'value_card', titulo: 'Garantía de Satisfacción', descripcion: 'Si no estás satisfecho con la calidad de impresión, te reimprimimos sin costo adicional.', imagenUrl: null, icono: 'HeartHandshake', orden: 6, activo: true },
  ],
  options: [],
};

// ============================================
// Paper Types Section
// ============================================

const paperTypesDefaults: ProductPageSectionComplete = {
  section: {
    id: 3,
    sectionKey: 'paper_types',
    titulo: 'Tipos de Papel',
    subtitulo: 'Elige el acabado perfecto para cada ocasión. Todos nuestros papeles son de grado profesional.',
    descripcion: null,
    imagenPrincipalUrl: null,
    orden: 3,
    activo: true,
  },
  slides: [
    { id: 13, sectionKey: 'paper_types', tipo: 'paper_type', titulo: 'Lustre', descripcion: 'El acabado preferido por fotógrafos profesionales. Ofrece una textura suave con un brillo sutil que reduce reflejos y resalta los detalles de la imagen.', imagenUrl: '/slide1.jpg', icono: null, orden: 1, activo: true },
    { id: 14, sectionKey: 'paper_types', tipo: 'paper_type', titulo: 'Mate', descripcion: 'Acabado sin brillo que ofrece una apariencia sofisticada y artística. Perfecto para fotos en blanco y negro y fotografía artística.', imagenUrl: '/slide2.jpg', icono: null, orden: 2, activo: true },
    { id: 15, sectionKey: 'paper_types', tipo: 'paper_type', titulo: 'Brillante', descripcion: 'El acabado clásico con brillo intenso que hace que los colores resalten al máximo. Ideal para fotos coloridas y vibrantes.', imagenUrl: '/slide3.jpg', icono: null, orden: 3, activo: true },
  ],
  options: [
    // Lustre features (slideId: 13)
    { id: 1, sectionKey: 'paper_types', slideId: 13, texto: 'Textura semi-mate elegante', textoSecundario: null, textoTerciario: null, textoCuarto: null, textoQuinto: null, orden: 1, activo: true },
    { id: 2, sectionKey: 'paper_types', slideId: 13, texto: 'Reduce reflejos y huellas', textoSecundario: null, textoTerciario: null, textoCuarto: null, textoQuinto: null, orden: 2, activo: true },
    { id: 3, sectionKey: 'paper_types', slideId: 13, texto: 'Ideal para retratos y paisajes', textoSecundario: null, textoTerciario: null, textoCuarto: null, textoQuinto: null, orden: 3, activo: true },
    { id: 4, sectionKey: 'paper_types', slideId: 13, texto: 'Colores ricos y naturales', textoSecundario: null, textoTerciario: null, textoCuarto: null, textoQuinto: null, orden: 4, activo: true },
    { id: 5, sectionKey: 'paper_types', slideId: 13, texto: 'Resistente al desgaste', textoSecundario: null, textoTerciario: null, textoCuarto: null, textoQuinto: null, orden: 5, activo: true },
    // Mate features (slideId: 14)
    { id: 6, sectionKey: 'paper_types', slideId: 14, texto: 'Sin reflejos ni brillos', textoSecundario: null, textoTerciario: null, textoCuarto: null, textoQuinto: null, orden: 1, activo: true },
    { id: 7, sectionKey: 'paper_types', slideId: 14, texto: 'Apariencia artística y elegante', textoSecundario: null, textoTerciario: null, textoCuarto: null, textoQuinto: null, orden: 2, activo: true },
    { id: 8, sectionKey: 'paper_types', slideId: 14, texto: 'Perfecto para fotos B&N', textoSecundario: null, textoTerciario: null, textoCuarto: null, textoQuinto: null, orden: 3, activo: true },
    { id: 9, sectionKey: 'paper_types', slideId: 14, texto: 'Fácil de enmarcar', textoSecundario: null, textoTerciario: null, textoCuarto: null, textoQuinto: null, orden: 4, activo: true },
    { id: 10, sectionKey: 'paper_types', slideId: 14, texto: 'Textura suave al tacto', textoSecundario: null, textoTerciario: null, textoCuarto: null, textoQuinto: null, orden: 5, activo: true },
    // Brillante features (slideId: 15)
    { id: 11, sectionKey: 'paper_types', slideId: 15, texto: 'Colores ultra vibrantes', textoSecundario: null, textoTerciario: null, textoCuarto: null, textoQuinto: null, orden: 1, activo: true },
    { id: 12, sectionKey: 'paper_types', slideId: 15, texto: 'Brillo intenso y llamativo', textoSecundario: null, textoTerciario: null, textoCuarto: null, textoQuinto: null, orden: 2, activo: true },
    { id: 13, sectionKey: 'paper_types', slideId: 15, texto: 'Contraste máximo', textoSecundario: null, textoTerciario: null, textoCuarto: null, textoQuinto: null, orden: 3, activo: true },
    { id: 14, sectionKey: 'paper_types', slideId: 15, texto: 'Ideal para fotos a color', textoSecundario: null, textoTerciario: null, textoCuarto: null, textoQuinto: null, orden: 4, activo: true },
    { id: 15, sectionKey: 'paper_types', slideId: 15, texto: 'El clásico favorito', textoSecundario: null, textoTerciario: null, textoCuarto: null, textoQuinto: null, orden: 5, activo: true },
  ],
};

// ============================================
// Print Services Section
// ============================================

const printServicesDefaults: ProductPageSectionComplete = {
  section: {
    id: 4,
    sectionKey: 'print_services',
    titulo: 'Nuestros Servicios de Impresión',
    subtitulo: 'Ofrecemos una variedad de productos para que tus recuerdos cobren vida.',
    descripcion: null,
    imagenPrincipalUrl: null,
    orden: 4,
    activo: true,
  },
  slides: [
    { id: 16, sectionKey: 'print_services', tipo: 'service_card', titulo: 'Impresiones Estándar', descripcion: 'Fotos impresas en múltiples tamaños con la calidad que tus recuerdos merecen.', imagenUrl: '/slide1.jpg', icono: null, orden: 1, activo: true },
    { id: 17, sectionKey: 'print_services', tipo: 'service_card', titulo: 'Calendarios Personalizados', descripcion: 'Crea calendarios únicos con tus fotos favoritas para cada mes del año.', imagenUrl: '/slide2.jpg', icono: null, orden: 2, activo: true },
    { id: 18, sectionKey: 'print_services', tipo: 'service_card', titulo: 'Fotos Estilo Polaroid', descripcion: 'El encanto retro de las polaroid con la calidad de impresión moderna.', imagenUrl: '/slide3.jpg', icono: null, orden: 3, activo: true },
    { id: 19, sectionKey: 'print_services', tipo: 'service_card', titulo: 'Paquetes Especiales', descripcion: 'Combina diferentes tamaños y estilos en un solo pedido con descuentos exclusivos.', imagenUrl: '/slide4.jpg', icono: null, orden: 4, activo: true },
  ],
  options: [],
};

// ============================================
// Product Types Section
// ============================================

const productTypesDefaults: ProductPageSectionComplete = {
  section: {
    id: 5,
    sectionKey: 'product_types',
    titulo: 'Nuestros Productos',
    subtitulo: 'Tres estilos únicos para dar vida a tus fotos favoritas.',
    descripcion: null,
    imagenPrincipalUrl: null,
    orden: 5,
    activo: true,
  },
  slides: [
    { id: 20, sectionKey: 'product_types', tipo: 'product_type', titulo: 'Impresiones Estándar', descripcion: 'Disponibles en múltiples tamaños, desde 4×6 hasta 8×10. Perfectas para enmarcar o regalar.', imagenUrl: '/slide1.jpg', icono: null, orden: 1, activo: true },
    { id: 21, sectionKey: 'product_types', tipo: 'product_type', titulo: 'Calendarios', descripcion: '12 meses con tus fotos favoritas. Personaliza cada mes con tu editor integrado.', imagenUrl: '/Calendar.png', icono: null, orden: 2, activo: true },
    { id: 22, sectionKey: 'product_types', tipo: 'product_type', titulo: 'Polaroid', descripcion: 'El estilo retro que nunca pasa de moda. Marco blanco clásico con espacio para texto.', imagenUrl: '/polaroid/Polaroid.png', icono: null, orden: 3, activo: true },
  ],
  options: [],
};

// ============================================
// Sizes Table Section
// ============================================

const sizesTableDefaults: ProductPageSectionComplete = {
  section: {
    id: 6,
    sectionKey: 'sizes_table',
    titulo: 'Tamaños y Opciones',
    subtitulo: 'Encuentra el tamaño perfecto para cada momento. Todos con impresión a 300 DPI.',
    descripcion: null,
    imagenPrincipalUrl: null,
    orden: 6,
    activo: true,
  },
  slides: [],
  options: [
    { id: 16, sectionKey: 'sizes_table', slideId: null, texto: '4×6"', textoSecundario: '10 × 15 cm', textoTerciario: '300 DPI', textoCuarto: 'Estándar', textoQuinto: '$15.00', orden: 1, activo: true },
    { id: 17, sectionKey: 'sizes_table', slideId: null, texto: '5×7"', textoSecundario: '13 × 18 cm', textoTerciario: '300 DPI', textoCuarto: 'Estándar', textoQuinto: '$25.00', orden: 2, activo: true },
    { id: 18, sectionKey: 'sizes_table', slideId: null, texto: '8×10"', textoSecundario: '20 × 25 cm', textoTerciario: '300 DPI', textoCuarto: 'Estándar', textoQuinto: '$45.00', orden: 3, activo: true },
    { id: 19, sectionKey: 'sizes_table', slideId: null, texto: 'Polaroid', textoSecundario: '7.6 × 7.6 cm', textoTerciario: '300 DPI', textoCuarto: 'Polaroid', textoQuinto: '$12.00', orden: 4, activo: true },
    { id: 20, sectionKey: 'sizes_table', slideId: null, texto: 'Calendario', textoSecundario: '21.6 × 28 cm', textoTerciario: '300 DPI', textoCuarto: 'Calendario', textoQuinto: '$99.00', orden: 5, activo: true },
  ],
};

// ============================================
// Exports
// ============================================

/**
 * Complete default product page content
 */
export const DEFAULT_PRODUCT_PAGE_CONTENT: ProductPageContent = {
  gallery: galleryDefaults,
  why_choose: whyChooseDefaults,
  paper_types: paperTypesDefaults,
  print_services: printServicesDefaults,
  product_types: productTypesDefaults,
  sizes_table: sizesTableDefaults,
};

/**
 * Get default content for a specific section
 */
export function getDefaultProductPageSection(sectionKey: ProductPageSectionKey): ProductPageSectionComplete | null {
  return DEFAULT_PRODUCT_PAGE_CONTENT[sectionKey] || null;
}

/**
 * Get all section keys in display order
 */
export const PRODUCT_PAGE_SECTION_ORDER: ProductPageSectionKey[] = [
  'gallery',
  'why_choose',
  'paper_types',
  'print_services',
  'product_types',
  'sizes_table',
];

/**
 * Get all default sections as a sorted array
 */
export function getDefaultProductPageSectionsArray(): ProductPageSectionComplete[] {
  return PRODUCT_PAGE_SECTION_ORDER
    .map(key => DEFAULT_PRODUCT_PAGE_CONTENT[key])
    .filter((s): s is ProductPageSectionComplete => s !== null);
}
