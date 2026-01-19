import z from "zod";

/**
 * Schema para verificación de identidad (paso 1: email + teléfono)
 */
export const VerifyIdentitySchema = z.object({
  email: z
    .string()
    .min(1, { message: "El correo electrónico es requerido" })
    .email({ message: "Ingresa un correo electrónico válido" })
    .refine((email) => email.trim() === email, {
      message: "El correo no debe contener espacios al inicio o final",
    }),
  phoneNumber: z
    .string()
    .min(10, { message: "El número debe tener al menos 10 dígitos" })
    .refine((value) => /^[0-9]+$/.test(value), {
      message: "El número de teléfono solo debe contener dígitos",
    }),
});

export type VerifyIdentitySchemaType = z.infer<typeof VerifyIdentitySchema>;

/**
 * Schema para cambio de contraseña (paso 2: nueva contraseña)
 */
export const ResetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
    confirmPassword: z.string().min(8, { message: "Confirma tu contraseña" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type ResetPasswordSchemaType = z.infer<typeof ResetPasswordSchema>;
