import z from "zod";

export const UserSchema = z
  .object({
    firstName: z.string().min(1, { message: "Se necesita un nombre" }),
    lastName: z.string().min(1, { message: "Se necesita un apellido" }),
    phoneNumber: z
      .string()
      .min(10, { message: "El número debe tener al menos 10 dígitos" })
      .refine((value) => /^[0-9]+$/.test(value), {
        message: "El número de teléfono solo debe contener dígitos",
      }),
    email: z
      .string()
      .min(1, { message: "Se necesita un correo electrónico" })
      .email({ message: "Ingresa un correo electrónico válido" })
      .refine((email) => email.trim() === email, {
        message: "El correo no debe contener espacios al inicio o final",
      }),
    password: z
      .string()
      .min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
    confirmPassword: z.string().min(8, { message: "Confirma tu contraseña" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type UserSchemaType = z.infer<typeof UserSchema>;
