/**
 * Product Page Content Validation Schemas
 *
 * Zod schemas for validating product page CMS data.
 */

import { z } from 'zod';

// ============================================
// Common Validators
// ============================================

const imageUrlSchema = z
  .string()
  .refine(
    (val) => {
      if (!val) return true;
      if (val.startsWith('/')) return true;
      if (val.startsWith('blob:')) return true;
      if (val.startsWith('data:')) return true;
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
// Enum Schemas
// ============================================

export const productPageSectionKeySchema = z.enum([
  'gallery',
  'why_choose',
  'paper_types',
  'print_services',
  'product_types',
  'sizes_table',
]);

export const productPageSlideTypeSchema = z.enum([
  'gallery_image',
  'value_card',
  'paper_type',
  'service_card',
  'product_type',
]);

// ============================================
// Section Schemas
// ============================================

export const productPageSectionDTOSchema = z.object({
  titulo: z.string().max(255).nullable().optional(),
  subtitulo: z.string().max(1000).nullable().optional(),
  descripcion: z.string().max(2000).nullable().optional(),
  imagenPrincipalUrl: z.string().nullable().optional(),
  activo: z.boolean().optional(),
});

// ============================================
// Slide Schemas
// ============================================

export const productPageSlideCreateSchema = z.object({
  sectionKey: productPageSectionKeySchema,
  tipo: productPageSlideTypeSchema,
  titulo: z.string().max(255).nullable().optional(),
  descripcion: z.string().max(1000).nullable().optional(),
  imagenUrl: imageUrlSchema.nullable().optional(),
  icono: z.string().max(50).nullable().optional(),
  orden: z.number().min(0).optional(),
});

export const productPageSlideUpdateSchema = z.object({
  titulo: z.string().max(255).nullable().optional(),
  descripcion: z.string().max(1000).nullable().optional(),
  imagenUrl: imageUrlSchema.nullable().optional(),
  icono: z.string().max(50).nullable().optional(),
  orden: z.number().min(0).optional(),
  activo: z.boolean().optional(),
});

// ============================================
// Option Schemas
// ============================================

export const productPageOptionCreateSchema = z.object({
  sectionKey: productPageSectionKeySchema,
  slideId: z.number().positive().nullable().optional(),
  texto: z.string().min(1, 'Texto es requerido').max(255),
  textoSecundario: z.string().max(255).nullable().optional(),
  textoTerciario: z.string().max(255).nullable().optional(),
  textoCuarto: z.string().max(255).nullable().optional(),
  textoQuinto: z.string().max(255).nullable().optional(),
  orden: z.number().min(0).optional(),
});

export const productPageOptionUpdateSchema = z.object({
  texto: z.string().min(1, 'Texto es requerido').max(255).optional(),
  textoSecundario: z.string().max(255).nullable().optional(),
  textoTerciario: z.string().max(255).nullable().optional(),
  textoCuarto: z.string().max(255).nullable().optional(),
  textoQuinto: z.string().max(255).nullable().optional(),
  orden: z.number().min(0).optional(),
  activo: z.boolean().optional(),
});

// ============================================
// Reorder Schema
// ============================================

export const productPageReorderSchema = z.object({
  sectionKey: productPageSectionKeySchema,
  ids: z.array(z.number().positive()),
});

// ============================================
// Image Upload Schema
// ============================================

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const productPageImageUploadSchema = z.object({
  sectionKey: productPageSectionKeySchema,
  imageType: z.enum(['main', 'slide']),
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

export type ProductPageSectionDTOInput = z.infer<typeof productPageSectionDTOSchema>;
export type ProductPageSlideCreateInput = z.infer<typeof productPageSlideCreateSchema>;
export type ProductPageSlideUpdateInput = z.infer<typeof productPageSlideUpdateSchema>;
export type ProductPageOptionCreateInput = z.infer<typeof productPageOptionCreateSchema>;
export type ProductPageOptionUpdateInput = z.infer<typeof productPageOptionUpdateSchema>;
export type ProductPageReorderInput = z.infer<typeof productPageReorderSchema>;

// ============================================
// Validation Helpers
// ============================================

export function validateProductPageSectionDTO(data: unknown) {
  return productPageSectionDTOSchema.safeParse(data);
}

export function validateProductPageSlideCreate(data: unknown) {
  return productPageSlideCreateSchema.safeParse(data);
}

export function validateProductPageSlideUpdate(data: unknown) {
  return productPageSlideUpdateSchema.safeParse(data);
}

export function validateProductPageOptionCreate(data: unknown) {
  return productPageOptionCreateSchema.safeParse(data);
}

export function validateProductPageOptionUpdate(data: unknown) {
  return productPageOptionUpdateSchema.safeParse(data);
}
