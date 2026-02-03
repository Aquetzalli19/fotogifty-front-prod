"use client";

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
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { verificarContraseña, cambiarContraseñaCliente } from "@/services/usuarios";
import { useToast } from "@/hooks/useToast";
import { Loader2 } from "lucide-react";

interface PasswordEditProps {
  userId: number;
  onPasswordChangeSuccess?: () => void;
  onSuccess?: () => void;
}

const PasswordEdit = ({ userId, onPasswordChangeSuccess, onSuccess }: PasswordEditProps) => {
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error: showError } = useToast();

  const ChangePasswordSchema = z
    .object({
      currentPassword: z
        .string()
        .min(1, { message: "Por favor, ingresa tu contraseña actual." }),
      newPassword: z
        .string()
        .min(8, { message: "La contraseña debe tener al menos 8 caracteres." })
        .refine((value) => /[0-9]/.test(value), {
          message: "La contraseña debe contener al menos un número",
        })
        .refine((value) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value), {
          message: "La contraseña debe contener al menos un carácter especial",
        }),
      confirmPassword: z
        .string()
        .min(1, { message: "Por favor, confirma tu contraseña." }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Las contraseñas no coinciden.",
      path: ["confirmPassword"],
    })
    .refine((data) => data.newPassword !== data.currentPassword, {
      message: "La nueva contraseña debe ser diferente a la actual.",
      path: ["newPassword"],
    });

  const changePasswordForm = useForm<z.infer<typeof ChangePasswordSchema>>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onSubmit",
  });

  const onSubmit = async (values: z.infer<typeof ChangePasswordSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await cambiarContraseñaCliente(
        userId,
        values.currentPassword,
        values.newPassword
      );

      if (response.success) {
        success('Contraseña actualizada correctamente.');
        if (onPasswordChangeSuccess) {
          onPasswordChangeSuccess();
        }
        if (onSuccess) {
          onSuccess();
        }
        changePasswordForm.reset();
        setIsVerified(false);
      } else {
        // Si falla, probablemente la contraseña actual es incorrecta
        showError(response.message || 'Error al cambiar la contraseña. Verifica tu contraseña actual.');
      }
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      showError('Error al cambiar la contraseña. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPassword = async () => {
    const currentPassword = changePasswordForm.getValues('currentPassword');

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
      } else {
        showError('Contraseña incorrecta. Por favor, inténtalo de nuevo.');
        changePasswordForm.setError('currentPassword', {
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

  const { control, handleSubmit } = changePasswordForm;

  return (
    <div>
      <Form {...changePasswordForm}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2 mb-6">
            <Separator />
            <h3 className="font-semibold pt-2">Verifica tu identidad</h3>
            <p className="text-sm text-muted-foreground">
              Ingresa tu contraseña actual para poder cambiarla.
            </p>
            <FormField
              control={control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="current-password">Contraseña Actual</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input
                        id="current-password"
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
            <Separator className="mt-4" />
          </div>

          <FormField
            control={control}
            name="newPassword"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Nueva Contraseña:</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    id="newPassword"
                    {...field}
                    disabled={!isVerified}
                    className={`${
                      !isVerified ? "bg-zinc-200 text-zinc-700 opacity-50 cursor-not-allowed" : ""
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

          <FormField
            control={control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Confirmar Contraseña:</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    disabled={!isVerified}
                    className={`${
                      !isVerified ? "bg-zinc-200 text-zinc-700 opacity-50 cursor-not-allowed" : ""
                    }`}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="w-full justify-end flex pt-2">
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
};

export default PasswordEdit;
