/**
 * Default Landing Page Content
 *
 * This file contains the default/fallback values for all landing page sections.
 * These are used when the API is unavailable or during initial setup.
 */

import {
  LandingContent,
  LandingSectionComplete,
  SectionKey,
} from '@/interfaces/landing-content';

/**
 * Default Hero section data
 */
const heroDefaults: LandingSectionComplete = {
  section: {
    id: 1,
    sectionKey: 'hero',
    titulo: 'Imprime y recibe tus fotos',
    subtitulo: 'en pocos clics',
    descripcion: null,
    textoPrimario: null,
    textoSecundario: null,
    colorPrimario: '#E04F8B',
    colorSecundario: null,
    colorGradienteInicio: null,
    colorGradienteMedio: null,
    colorGradienteFin: null,
    imagenPrincipalUrl: null,
    imagenFondoUrl: null,
    botonTexto: 'Imprime prints',
    botonColor: '#F5A524',
    botonEnlace: '/login',
    configuracionExtra: {
      autoplay: true,
      autoplaySpeed: 3000,
      transitionSpeed: 3000,
      infinite: true,
    },
    orden: 1,
    activo: true,
  },
  slides: [
    { id: 1, sectionKey: 'hero', tipo: 'hero_slide', titulo: null, descripcion: null, imagenUrl: '/slide1.jpg', orden: 1, activo: true },
    { id: 2, sectionKey: 'hero', tipo: 'hero_slide', titulo: null, descripcion: null, imagenUrl: '/slide2.jpg', orden: 2, activo: true },
    { id: 3, sectionKey: 'hero', tipo: 'hero_slide', titulo: null, descripcion: null, imagenUrl: '/slide3.jpg', orden: 3, activo: true },
    { id: 4, sectionKey: 'hero', tipo: 'hero_slide', titulo: null, descripcion: null, imagenUrl: '/slide4.jpg', orden: 4, activo: true },
  ],
  options: [],
};

/**
 * Default Extensions section data
 */
const extensionsDefaults: LandingSectionComplete = {
  section: {
    id: 2,
    sectionKey: 'extensions',
    titulo: 'Ampliaciones',
    subtitulo: 'Perfectas para enmarcar, regalar o conservar en álbumes.',
    descripcion: null,
    textoPrimario: null,
    textoSecundario: null,
    colorPrimario: null,
    colorSecundario: null,
    colorGradienteInicio: null,
    colorGradienteMedio: null,
    colorGradienteFin: null,
    imagenPrincipalUrl: '/slide3.jpg',
    imagenFondoUrl: null,
    botonTexto: 'Ordenar',
    botonColor: '#E04F8B',
    botonEnlace: '/login',
    configuracionExtra: null,
    orden: 2,
    activo: true,
  },
  slides: [],
  options: [
    { id: 1, sectionKey: 'extensions', texto: 'Pack 50 Prints 4x6', orden: 1, activo: true },
    { id: 2, sectionKey: 'extensions', texto: 'Pack 50 Prints 4x6', orden: 2, activo: true },
    { id: 3, sectionKey: 'extensions', texto: 'Pack 50 Prints 4x6', orden: 3, activo: true },
  ],
};

/**
 * Default Product Slider section data
 */
const productSliderDefaults: LandingSectionComplete = {
  section: {
    id: 3,
    sectionKey: 'product_slider',
    titulo: null,
    subtitulo: null,
    descripcion: null,
    textoPrimario: 'Cada fotografía es impresa en papel lustre profesional',
    textoSecundario: ', que realza los colores y los detalles con un acabado elegante y duradero.',
    colorPrimario: '#E04F8B',
    colorSecundario: null,
    colorGradienteInicio: null,
    colorGradienteMedio: null,
    colorGradienteFin: null,
    imagenPrincipalUrl: null,
    imagenFondoUrl: null,
    botonTexto: null,
    botonColor: null,
    botonEnlace: null,
    configuracionExtra: {
      autoplay: true,
      autoplaySpeed: 3000,
      transitionSpeed: 500,
      infinite: true,
    },
    orden: 3,
    activo: true,
  },
  slides: [
    { id: 5, sectionKey: 'product_slider', tipo: 'product_slide', titulo: 'Pack 50 5x7', descripcion: 'Impresas en papel lustre profesional con revelado tradicional.', imagenUrl: '/product-slider/slide1.jpg', orden: 1, activo: true },
    { id: 6, sectionKey: 'product_slider', tipo: 'product_slide', titulo: 'Pack 50 5x7', descripcion: 'Impresas en papel lustre profesional con revelado tradicional.', imagenUrl: '/product-slider/slide1.jpg', orden: 2, activo: true },
    { id: 7, sectionKey: 'product_slider', tipo: 'product_slide', titulo: 'Pack 50 5x7', descripcion: 'Impresas en papel lustre profesional con revelado tradicional.', imagenUrl: '/product-slider/slide1.jpg', orden: 3, activo: true },
    { id: 8, sectionKey: 'product_slider', tipo: 'product_slide', titulo: 'Pack 50 5x7', descripcion: 'Impresas en papel lustre profesional con revelado tradicional.', imagenUrl: '/product-slider/slide1.jpg', orden: 4, activo: true },
  ],
  options: [],
};

/**
 * Default Legend section data
 */
const legendDefaults: LandingSectionComplete = {
  section: {
    id: 4,
    sectionKey: 'legend',
    titulo: null,
    subtitulo: null,
    descripcion: null,
    textoPrimario: 'Imprime tus recuerdos',
    textoSecundario: '¡Regala sus mejores momentos!',
    colorPrimario: null,
    colorSecundario: null,
    colorGradienteInicio: '#FCD34D00', // amber-300 transparent
    colorGradienteMedio: '#38BDF880', // sky-400 50%
    colorGradienteFin: '#EC489980', // pink-500 50%
    imagenPrincipalUrl: null,
    imagenFondoUrl: '/slide3.jpg',
    botonTexto: null,
    botonColor: null,
    botonEnlace: null,
    configuracionExtra: null,
    orden: 4,
    activo: true,
  },
  slides: [],
  options: [],
};

/**
 * Default Calendars section data
 */
const calendarsDefaults: LandingSectionComplete = {
  section: {
    id: 5,
    sectionKey: 'calendars',
    titulo: 'Calendarios',
    subtitulo: 'Perfectas para enmarcar, regalar o conservar en álbumes.',
    descripcion: 'Nuestras photo prints transforman tus recuerdos digitales en piezas tangibles que perduran en el tiempo.',
    textoPrimario: null,
    textoSecundario: null,
    colorPrimario: null,
    colorSecundario: '#F5A524',
    colorGradienteInicio: null,
    colorGradienteMedio: null,
    colorGradienteFin: null,
    imagenPrincipalUrl: null,
    imagenFondoUrl: null,
    botonTexto: 'Ordenar',
    botonColor: '#E04F8B',
    botonEnlace: '/login',
    configuracionExtra: null,
    orden: 5,
    activo: true,
  },
  slides: [
    { id: 9, sectionKey: 'calendars', tipo: 'collage_image', titulo: null, descripcion: null, imagenUrl: '/slide3.jpg', orden: 1, activo: true },
    { id: 10, sectionKey: 'calendars', tipo: 'collage_image', titulo: null, descripcion: null, imagenUrl: '/slide3.jpg', orden: 2, activo: true },
    { id: 11, sectionKey: 'calendars', tipo: 'collage_image', titulo: null, descripcion: null, imagenUrl: '/slide3.jpg', orden: 3, activo: true },
    { id: 12, sectionKey: 'calendars', tipo: 'collage_image', titulo: null, descripcion: null, imagenUrl: '/slide3.jpg', orden: 4, activo: true },
  ],
  options: [
    { id: 4, sectionKey: 'calendars', texto: 'Pack 50 Prints 4x6', orden: 1, activo: true },
    { id: 5, sectionKey: 'calendars', texto: 'Pack 50 Prints 4x6', orden: 2, activo: true },
    { id: 6, sectionKey: 'calendars', texto: 'Pack 50 Prints 4x6', orden: 3, activo: true },
  ],
};

/**
 * Default Single Product section data
 */
const singleProductDefaults: LandingSectionComplete = {
  section: {
    id: 6,
    sectionKey: 'single_product',
    titulo: 'Pack de 100 fotografías tamaño 4x6',
    subtitulo: null,
    descripcion: null,
    textoPrimario: null,
    textoSecundario: null,
    colorPrimario: null,
    colorSecundario: null,
    colorGradienteInicio: null,
    colorGradienteMedio: null,
    colorGradienteFin: null,
    imagenPrincipalUrl: null,
    imagenFondoUrl: '/SingleProduct.jpg',
    botonTexto: 'Ordenar',
    botonColor: '#E04F8B',
    botonEnlace: '#',
    configuracionExtra: null,
    orden: 6,
    activo: true,
  },
  slides: [],
  options: [],
};

/**
 * Default Prints section data
 */
const printsDefaults: LandingSectionComplete = {
  section: {
    id: 7,
    sectionKey: 'prints',
    titulo: 'Prints',
    subtitulo: 'Perfectas para enmarcar, regalar o conservar en álbumes.',
    descripcion: 'Nuestras photo prints transforman tus recuerdos digitales en piezas tangibles que perduran en el tiempo.',
    textoPrimario: null,
    textoSecundario: null,
    colorPrimario: '#E04F8B',
    colorSecundario: null,
    colorGradienteInicio: null,
    colorGradienteMedio: null,
    colorGradienteFin: null,
    imagenPrincipalUrl: '/slide1.jpg',
    imagenFondoUrl: null,
    botonTexto: 'Ordenar',
    botonColor: '#E04F8B',
    botonEnlace: '/login',
    configuracionExtra: null,
    orden: 7,
    activo: true,
  },
  slides: [],
  options: [
    { id: 7, sectionKey: 'prints', texto: 'Pack 50 Prints 4x6', orden: 1, activo: true },
    { id: 8, sectionKey: 'prints', texto: 'Pack 50 Prints 4x6', orden: 2, activo: true },
    { id: 9, sectionKey: 'prints', texto: 'Pack 50 Prints 4x6', orden: 3, activo: true },
  ],
};

/**
 * Default Polaroids Banner section data
 */
const polaroidsBannerDefaults: LandingSectionComplete = {
  section: {
    id: 8,
    sectionKey: 'polaroids_banner',
    titulo: null,
    subtitulo: null,
    descripcion: null,
    textoPrimario: 'Cada fotografía es impresa en papel lustre profesional',
    textoSecundario: ', que realza los colores y los detalles con un acabado elegante y duradero.',
    colorPrimario: '#F5A524',
    colorSecundario: null,
    colorGradienteInicio: null,
    colorGradienteMedio: null,
    colorGradienteFin: null,
    imagenPrincipalUrl: null,
    imagenFondoUrl: null,
    botonTexto: null,
    botonColor: null,
    botonEnlace: null,
    configuracionExtra: null,
    orden: 8,
    activo: true,
  },
  slides: [],
  options: [],
};

/**
 * Default Polaroids Single section data
 */
const polaroidsSingleDefaults: LandingSectionComplete = {
  section: {
    id: 9,
    sectionKey: 'polaroids_single',
    titulo: 'Imprime tus recuerdos,',
    subtitulo: 'Pack 50 fotos polaroid',
    descripcion: 'consérvalos para siempre.',
    textoPrimario: null,
    textoSecundario: null,
    colorPrimario: '#E04F8B',
    colorSecundario: null,
    colorGradienteInicio: null,
    colorGradienteMedio: null,
    colorGradienteFin: null,
    imagenPrincipalUrl: '/slide3.jpg',
    imagenFondoUrl: null,
    botonTexto: 'Ordenar',
    botonColor: '#47BEE5',
    botonEnlace: '/login',
    configuracionExtra: null,
    orden: 9,
    activo: true,
  },
  slides: [],
  options: [],
};

/**
 * Default Polaroids Collage section data
 */
const polaroidsCollageDefaults: LandingSectionComplete = {
  section: {
    id: 10,
    sectionKey: 'polaroids_collage',
    titulo: 'Polaroid Prints',
    subtitulo: 'Perfectas para decorar tus espacios, crear murales, álbumes creativos o regalar recuerdos con un estilo único y atemporal.',
    descripcion: null,
    textoPrimario: null,
    textoSecundario: null,
    colorPrimario: null,
    colorSecundario: null,
    colorGradienteInicio: null,
    colorGradienteMedio: null,
    colorGradienteFin: null,
    imagenPrincipalUrl: null,
    imagenFondoUrl: null,
    botonTexto: 'Ordenar',
    botonColor: '#E04F8B',
    botonEnlace: '/login',
    configuracionExtra: null,
    orden: 10,
    activo: true,
  },
  slides: [
    { id: 13, sectionKey: 'polaroids_collage', tipo: 'collage_image', titulo: null, descripcion: null, imagenUrl: '/slide3.jpg', orden: 1, activo: true },
    { id: 14, sectionKey: 'polaroids_collage', tipo: 'collage_image', titulo: null, descripcion: null, imagenUrl: '/slide3.jpg', orden: 2, activo: true },
    { id: 15, sectionKey: 'polaroids_collage', tipo: 'collage_image', titulo: null, descripcion: null, imagenUrl: '/slide3.jpg', orden: 3, activo: true },
    { id: 16, sectionKey: 'polaroids_collage', tipo: 'collage_image', titulo: null, descripcion: null, imagenUrl: '/slide3.jpg', orden: 4, activo: true },
  ],
  options: [
    { id: 10, sectionKey: 'polaroids_collage', texto: 'Pack 50 Prints 4x6', orden: 1, activo: true },
    { id: 11, sectionKey: 'polaroids_collage', texto: 'Pack 50 Prints 4x6', orden: 2, activo: true },
    { id: 12, sectionKey: 'polaroids_collage', texto: 'Pack 50 Prints 4x6', orden: 3, activo: true },
  ],
};

/**
 * Default Platform Showcase section data
 */
const platformShowcaseDefaults: LandingSectionComplete = {
  section: {
    id: 11,
    sectionKey: 'platform_showcase',
    titulo: null,
    subtitulo: null,
    descripcion: null,
    textoPrimario: 'Edita, envía y recibe tu pedido.',
    textoSecundario: 'Todo desde la comodidad de tu casa.',
    colorPrimario: '#E04F8B',
    colorSecundario: null,
    colorGradienteInicio: '#0891B2B3', // cyan-600 70%
    colorGradienteMedio: '#FCD34DB3', // amber-300 70%
    colorGradienteFin: '#EC4899B3', // pink-500 70%
    imagenPrincipalUrl: '/MainUser.png',
    imagenFondoUrl: '/MainUser.png',
    botonTexto: null,
    botonColor: null,
    botonEnlace: null,
    configuracionExtra: null,
    orden: 11,
    activo: true,
  },
  slides: [],
  options: [],
};

/**
 * Complete default landing content
 */
export const DEFAULT_LANDING_CONTENT: LandingContent = {
  hero: heroDefaults,
  extensions: extensionsDefaults,
  product_slider: productSliderDefaults,
  legend: legendDefaults,
  calendars: calendarsDefaults,
  single_product: singleProductDefaults,
  prints: printsDefaults,
  polaroids_banner: polaroidsBannerDefaults,
  polaroids_single: polaroidsSingleDefaults,
  polaroids_collage: polaroidsCollageDefaults,
  platform_showcase: platformShowcaseDefaults,
};

/**
 * Get default content for a specific section
 */
export function getDefaultSection(sectionKey: SectionKey): LandingSectionComplete | null {
  return DEFAULT_LANDING_CONTENT[sectionKey] || null;
}

/**
 * Get all section keys in order
 */
export const SECTION_ORDER: SectionKey[] = [
  'hero',
  'extensions',
  'product_slider',
  'legend',
  'calendars',
  'single_product',
  'prints',
  'polaroids_banner',
  'polaroids_single',
  'polaroids_collage',
  'platform_showcase',
];

/**
 * Check if a section is a Polaroid sub-section
 */
export function isPolaroidSection(sectionKey: SectionKey): boolean {
  return sectionKey.startsWith('polaroids_');
}

/**
 * Get all default sections as an array (sorted by order)
 */
export function getDefaultSectionsArray(): LandingSectionComplete[] {
  return SECTION_ORDER.map(key => DEFAULT_LANDING_CONTENT[key]).filter((s): s is LandingSectionComplete => s !== null);
}
