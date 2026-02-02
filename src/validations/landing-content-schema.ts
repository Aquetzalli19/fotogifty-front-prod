/**
 * Landing Content Validation Schemas
 *
 * Zod schemas for validating landing page CMS data.
 */

import { z } from 'zod';

// ============================================
// Common Validators
// ============================================

/**
 * Hex color validation (#RRGGBB or #RRGGBBAA)
 */
const hexColorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/, {
    message: 'Color debe ser hexadecimal válido (#RRGGBB o #RRGGBBAA)',
  })
  .nullable();

/**
 * URL validation (allows relative paths starting with / or full URLs)
 */
const urlSchema = z
  .string()
  .refine(
    (val) => {
      if (!val) return true;
      // Allow relative paths starting with /
      if (val.startsWith('/')) return true;
      // Allow full URLs
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'URL debe ser válida (relativa /path o absoluta https://...)' }
  )
  .nullable();

/**
 * Image URL validation
 */
const imageUrlSchema = z
  .string()
  .refine(
    (val) => {
      if (!val) return true;
      // Allow relative paths
      if (val.startsWith('/')) return true;
      // Allow blob URLs (for preview)
      if (val.startsWith('blob:')) return true;
      // Allow data URLs (for embedded images)
      if (val.startsWith('data:')) return true;
      // Allow full URLs
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'URL de imagen debe ser válida' }
  );

// ============================================
// Section Key Schema
// ============================================

export const sectionKeySchema = z.enum([
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
]);

export const slideTypeSchema = z.enum(['hero_slide', 'product_slide', 'collage_image']);

// ============================================
// Carousel Config Schema
// ============================================

export const carouselConfigSchema = z.object({
  autoplay: z.boolean(),
  autoplaySpeed: z.number().min(500).max(10000),
  transitionSpeed: z.number().min(100).max(5000),
  infinite: z.boolean(),
});

// ============================================
// Section Schemas
// ============================================

/**
 * Schema for updating a section
 */
export const landingSectionDTOSchema = z.object({
  titulo: z.string().max(255).nullable().optional(),
  subtitulo: z.string().max(1000).nullable().optional(),
  descripcion: z.string().max(2000).nullable().optional(),
  textoPrimario: z.string().max(500).nullable().optional(),
  textoSecundario: z.string().max(500).nullable().optional(),
  colorPrimario: hexColorSchema.optional(),
  colorSecundario: hexColorSchema.optional(),
  colorGradienteInicio: hexColorSchema.optional(),
  colorGradienteMedio: hexColorSchema.optional(),
  colorGradienteFin: hexColorSchema.optional(),
  imagenPrincipalUrl: urlSchema.optional(),
  imagenFondoUrl: urlSchema.optional(),
  botonTexto: z.string().max(100).nullable().optional(),
  botonColor: hexColorSchema.optional(),
  botonEnlace: urlSchema.optional(),
  configuracionExtra: carouselConfigSchema.nullable().optional(),
  activo: z.boolean().optional(),
});

// ============================================
// Slide Schemas
// ============================================

/**
 * Schema for creating a slide
 */
export const landingSlideCreateSchema = z.object({
  sectionKey: sectionKeySchema,
  tipo: slideTypeSchema,
  titulo: z.string().max(255).nullable().optional(),
  descripcion: z.string().max(500).nullable().optional(),
  imagenUrl: imageUrlSchema,
  orden: z.number().min(0).optional(),
});

/**
 * Schema for updating a slide
 */
export const landingSlideUpdateSchema = z.object({
  titulo: z.string().max(255).nullable().optional(),
  descripcion: z.string().max(500).nullable().optional(),
  imagenUrl: imageUrlSchema.optional(),
  orden: z.number().min(0).optional(),
  activo: z.boolean().optional(),
});

// ============================================
// Option Schemas
// ============================================

/**
 * Schema for creating an option
 */
export const landingOptionCreateSchema = z.object({
  sectionKey: sectionKeySchema,
  texto: z.string().min(1, 'Texto es requerido').max(255),
  orden: z.number().min(0).optional(),
});

/**
 * Schema for updating an option
 */
export const landingOptionUpdateSchema = z.object({
  texto: z.string().min(1, 'Texto es requerido').max(255).optional(),
  orden: z.number().min(0).optional(),
  activo: z.boolean().optional(),
});

// ============================================
// Reorder Schema
// ============================================

export const reorderSchema = z.object({
  sectionKey: sectionKeySchema,
  ids: z.array(z.number().positive()),
});

// ============================================
// Image Upload Schema
// ============================================

/**
 * Max file size: 5MB
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Allowed image types
 */
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const imageUploadSchema = z.object({
  sectionKey: sectionKeySchema,
  imageType: z.enum(['main', 'background', 'slide']),
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: 'La imagen debe ser menor a 5MB',
    })
    .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
      message: 'Formato de imagen no soportado. Use JPG, PNG o WebP',
    }),
});

// ============================================
// Type Exports
// ============================================

export type LandingSectionDTOInput = z.infer<typeof landingSectionDTOSchema>;
export type LandingSlideCreateInput = z.infer<typeof landingSlideCreateSchema>;
export type LandingSlideUpdateInput = z.infer<typeof landingSlideUpdateSchema>;
export type LandingOptionCreateInput = z.infer<typeof landingOptionCreateSchema>;
export type LandingOptionUpdateInput = z.infer<typeof landingOptionUpdateSchema>;
export type ReorderInput = z.infer<typeof reorderSchema>;
export type ImageUploadInput = z.infer<typeof imageUploadSchema>;

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate section DTO
 */
export function validateSectionDTO(data: unknown) {
  return landingSectionDTOSchema.safeParse(data);
}

/**
 * Validate slide create DTO
 */
export function validateSlideCreate(data: unknown) {
  return landingSlideCreateSchema.safeParse(data);
}

/**
 * Validate slide update DTO
 */
export function validateSlideUpdate(data: unknown) {
  return landingSlideUpdateSchema.safeParse(data);
}

/**
 * Validate option create DTO
 */
export function validateOptionCreate(data: unknown) {
  return landingOptionCreateSchema.safeParse(data);
}

/**
 * Validate option update DTO
 */
export function validateOptionUpdate(data: unknown) {
  return landingOptionUpdateSchema.safeParse(data);
}

/**
 * Validate image upload
 */
export function validateImageUpload(data: unknown) {
  return imageUploadSchema.safeParse(data);
}

/**
 * Validate hex color string
 */
export function isValidHexColor(color: string | null | undefined): boolean {
  if (!color) return true;
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(color);
}
