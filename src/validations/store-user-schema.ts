import z from "zod";

/**
 * Schema para crear un nuevo usuario de tienda
 */
export const CreateStoreUserSchema = z
  .object({
    nombre: z.string().min(1, { message: "El nombre es requerido" }),
    apellido: z.string().min(1, { message: "El apellido es requerido" }),
    email: z
      .string()
      .min(1, { message: "El correo electrónico es requerido" })
      .email({ message: "Ingresa un correo electrónico válido" }),
    telefono: z
      .string()
      .min(10, { message: "El teléfono debe tener al menos 10 dígitos" })
      .refine((value) => /^[0-9]+$/.test(value), {
        message: "El número de teléfono solo debe contener dígitos",
      }),
    codigo_empleado: z.string().min(1, { message: "El código de empleado es requerido" }),
    password: z
      .string()
      .min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
    confirmPassword: z.string().min(1, { message: "Confirma la contraseña" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type CreateStoreUserSchemaType = z.infer<typeof CreateStoreUserSchema>;

/**
 * Schema para editar un usuario de tienda
 */
export const EditStoreUserSchema = z.object({
  nombre: z.string().min(1, { message: "El nombre es requerido" }),
  apellido: z.string().min(1, { message: "El apellido es requerido" }),
  email: z
    .string()
    .min(1, { message: "El correo electrónico es requerido" })
    .email({ message: "Ingresa un correo electrónico válido" }),
  telefono: z
    .string()
    .min(10, { message: "El teléfono debe tener al menos 10 dígitos" }),
  codigo_empleado: z.string().min(1, { message: "El código de empleado es requerido" }),
  activo: z.boolean(),
});

export type EditStoreUserSchemaType = z.infer<typeof EditStoreUserSchema>;

/**
 * Schema para cambiar contraseña
 */
export const ChangePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
    confirmPassword: z.string().min(1, { message: "Confirma la contraseña" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type ChangePasswordSchemaType = z.infer<typeof ChangePasswordSchema>;
