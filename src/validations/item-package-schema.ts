import z from "zod";

export const ItemPackageSchema = z.object({
  packageName: z.string().min(1, { message: "El nombre del paquete es requerido" }),
  productClasification: z.string().min(1, { message: "La categoría es requerida" }),
  description: z.string().optional(),
  photoQuantity: z
    .number()
    .min(1, { message: "La cantidad de fotos no puede ser 0" })
    .positive({ message: "La cantidad de fotos debe ser mayor a 0" }),
  packagePrice: z
    .number()
    .min(0.01, { message: "El precio no puede ser 0" })
    .positive({ message: "El precio debe ser mayor a 0" }),
  itemStatus: z.boolean(),
  photoResolution: z
    .number()
    .min(1, { message: "La resolución no puede ser 0" })
    .positive({ message: "La resolución debe ser mayor a 0" }),
  photoWidth: z
    .number()
    .min(0.01, { message: "El ancho no puede ser 0" })
    .positive({ message: "El ancho debe ser mayor a 0" }),
  photoHeight: z
    .number()
    .min(0.01, { message: "El alto no puede ser 0" })
    .positive({ message: "El alto debe ser mayor a 0" }),
});

export type ItemPackageSchemaType = z.infer<typeof ItemPackageSchema>;