"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { actualizarCliente } from "@/services/usuarios";
import { useToast } from "@/hooks/useToast";

interface EmailEditParams {
  prevEmail: string;
  userId?: number; // Agregamos el ID de usuario para la actualización
}

const ChangeEmailSchema = z.object({
  newEmail: z
    .string()
    .min(1, { message: "Se necesita un correo electrónico" })
    .email({ message: "Ingresa un correo electrónico válido" })
    .refine((email) => email.trim() === email, {
      message: "El correo no debe contener espacios al inicio o final",
    }),
  currentPassword: z
    .string()
    .min(1, { message: "Por favor, ingresa tu contraseña actual." }),
});

export default function EmailEdit({ prevEmail, userId }: EmailEditParams) {
  const [isVerified, setIsVerified] = useState(false);
  const { success, error: showError } = useToast();

  const emailForm = useForm<z.infer<typeof ChangeEmailSchema>>({
    resolver: zodResolver(ChangeEmailSchema),
    defaultValues: {
      newEmail: prevEmail,
      currentPassword: "",
    },
    mode: "onSubmit",
  });

  const onSubmit = async (values: z.infer<typeof ChangeEmailSchema>) => {
    if (!userId) {
      showError('ID de usuario no disponible.');
      return;
    }

    try {
      // En una implementación real, haríamos una verificación de contraseña
      // Aquí se usaría la función de actualización de cliente
      const response = await actualizarCliente(userId, {
        email: values.newEmail
      });

      if (response.success) {
        success('Email actualizado correctamente.');
        emailForm.reset();
        setIsVerified(false);
      } else {
        showError(response.message || 'Error al actualizar el email.');
      }
    } catch (error) {
      console.error('Error al actualizar el email:', error);
      showError('Error al actualizar el email. Por favor, inténtalo de nuevo.');
    }
  };

  const handleVerifyPassword = async () => {
    const currentPassword = emailForm.getValues('currentPassword');
    if (!currentPassword) {
      showError('Por favor, ingresa tu contraseña actual.');
      return;
    }

    // En una implementación real, aquí verificaríamos con el backend
    // que la contraseña actual es correcta antes de permitir la edición
    setIsVerified(true);
  };

  const { control, handleSubmit, getValues } = emailForm;
  return (
    <div className="py-4">
      <div className="space-y-2 mb-6">
        <Separator />
        <h3 className="font-semibold pt-4">Verifica tu identidad</h3>
        <p className="text-sm text-muted-foreground">
          Ingresa tu contraseña actual para poder editar tu correo.
        </p>
        <Label htmlFor="current-password-email">Contraseña Actual</Label>
        <div className="flex items-center gap-2">
          <FormField
            control={control}
            name="currentPassword"
            render={({ field }) => (
              <FormControl>
                <Input
                  id="current-password-email"
                  type="password"
                  placeholder="••••••••"
                  {...field}
                />
              </FormControl>
            )}
          />
          <Button onClick={handleVerifyPassword} type="button">
            Verificar
          </Button>
        </div>
        <Separator className="!mt-6" />
      </div>

      <Form {...emailForm}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={control}
            name="newEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nuevo Correo Electrónico:</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="nuevo@correo.com"
                    {...field}
                    disabled={!isVerified}
                    className={`${
                      !isVerified
                        ? "bg-zinc-200 text-zinc-700 opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="w-full justify-end flex pt-4">
            <Button type="submit" disabled={!isVerified}>
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
