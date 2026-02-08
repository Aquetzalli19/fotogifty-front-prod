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
import { Separator } from "@/components/ui/separator";
import { verificarContraseña, actualizarEmailCliente } from "@/services/usuarios";
import { useToast } from "@/hooks/useToast";
import { useAuthStore } from "@/stores/auth-store";
import { Loader2 } from "lucide-react";

interface EmailEditParams {
  prevEmail: string;
  userId?: number;
  onSuccess?: () => void;
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

export default function EmailEdit({ prevEmail, userId, onSuccess }: EmailEditParams) {
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error: showError } = useToast();
  const { updateUserData } = useAuthStore();

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

    // Verificar que el email sea diferente al actual
    if (values.newEmail === prevEmail) {
      showError('El nuevo correo debe ser diferente al actual.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Usar el nuevo endpoint que incluye verificación de contraseña
      const response = await actualizarEmailCliente(
        userId,
        values.newEmail,
        values.currentPassword
      );

      if (response.success && response.data) {
        // Actualizar el store con los nuevos datos
        updateUserData(response.data);
        success('Email actualizado correctamente.');
        emailForm.reset();
        setIsVerified(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        showError(response.message || 'Error al actualizar el email. Verifica tu contraseña.');
      }
    } catch (error) {
      console.error('Error al actualizar el email:', error);
      showError('Error al actualizar el email. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPassword = async () => {
    if (!userId) {
      showError('ID de usuario no disponible.');
      return;
    }

    const currentPassword = emailForm.getValues('currentPassword');
    if (!currentPassword) {
      showError('Por favor, ingresa tu contraseña actual.');
      return;
    }

    setIsVerifying(true);
    try {
      // Verificar la contraseña con el backend
      const response = await verificarContraseña(userId, currentPassword);

      if (response.success && response.data?.valid) {
        setIsVerified(true);
        success('Contraseña verificada correctamente.');
      } else if (!response.success) {
        showError(response.message || 'Error al verificar la contraseña.');
      } else {
        showError('Contraseña incorrecta. Por favor, inténtalo de nuevo.');
        emailForm.setError('currentPassword', {
          type: 'manual',
          message: 'Contraseña incorrecta'
        });
      }
    } catch (error) {
      console.error('Error verificando contraseña:', error);
      showError('Error al verificar la contraseña. Por favor, inténtalo de nuevo.');
    } finally {
      setIsVerifying(false);
    }
  };

  const { control, handleSubmit } = emailForm;

  return (
    <div className="py-4">
      <Form {...emailForm}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2 mb-6">
            <Separator />
            <h3 className="font-semibold pt-4">Verifica tu identidad</h3>
            <p className="text-sm text-muted-foreground">
              Ingresa tu contraseña actual para poder editar tu correo.
            </p>
            <FormField
              control={control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="current-password-email">Contraseña Actual</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input
                        id="current-password-email"
                        type="password"
                        placeholder="••••••••"
                        disabled={isVerified || isVerifying}
                        {...field}
                      />
                    </FormControl>
                    <Button
                      onClick={handleVerifyPassword}
                      type="button"
                      disabled={isVerified || isVerifying}
                      variant={isVerified ? "outline" : "default"}
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verificando...
                        </>
                      ) : isVerified ? (
                        "✓ Verificado"
                      ) : (
                        "Verificar"
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator className="!mt-6" />
          </div>

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
                {!isVerified && (
                  <p className="text-xs text-muted-foreground">
                    Verifica tu contraseña para habilitar este campo
                  </p>
                )}
              </FormItem>
            )}
          />

          <div className="w-full justify-end flex pt-4">
            <Button type="submit" disabled={!isVerified || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
