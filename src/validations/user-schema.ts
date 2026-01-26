import z from "zod";

export const UserSchema = z
  .object({
    firstName: z.string().min(1, { message: "Se necesita un nombre" }),
    lastName: z.string().min(1, { message: "Se necesita un apellido" }),
    countryCode: z.string().min(1, { message: "Selecciona un código de país" }),
    phoneNumber: z
      .string()
      .min(9, { message: "El número debe tener al menos 9 dígitos" })
      .max(11, { message: "El número no puede tener más de 11 dígitos" })
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
      .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
      .refine((value) => /[0-9]/.test(value), {
        message: "La contraseña debe contener al menos un número",
      })
      .refine((value) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value), {
        message: "La contraseña debe contener al menos un carácter especial",
      }),
    confirmPassword: z.string().min(1, { message: "Confirma tu contraseña" }),
    acceptTerms: z.boolean().refine((value) => value === true, {
      message: "Debes aceptar los términos y condiciones",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type UserSchemaType = z.infer<typeof UserSchema>;
