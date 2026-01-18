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
import { cambiarContraseñaCliente } from "@/services/usuarios";
import { useToast } from "@/hooks/useToast";

interface PasswordEditProps {
  userId: number;
  onPasswordChangeSuccess?: () => void;
  onSuccess?: () => void;
}

const PasswordEdit = ({ userId, onPasswordChangeSuccess, onSuccess }: PasswordEditProps) => {
  const [isVerified, setIsVerified] = useState(false);
  const { success, error: showError } = useToast();

  const ChangePasswordSchema = z
    .object({
      currentPassword: z
        .string()
        .min(1, { message: "Por favor, ingresa tu contraseña actual." }),
      newPassword: z
        .string()
        .min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
      confirmPassword: z
        .string()
        .min(1, { message: "Por favor, confirma tu contraseña." }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Las contraseñas no coinciden.",
      path: ["confirmPassword"],
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
        // Cerrar el modal si se proporcionó el callback
        if (onSuccess) {
          onSuccess();
        }
        // Reiniciar el formulario
        changePasswordForm.reset();
        setIsVerified(false);
      } else {
        showError(response.message || 'Error al cambiar la contraseña.');
      }
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      showError('Error al cambiar la contraseña. Por favor, inténtalo de nuevo.');
    }
  };

  const handleVerifyPassword = () => {
    const currentPassword = changePasswordForm.getValues('currentPassword');
    if (currentPassword) {
      setIsVerified(true);
    } else {
      showError('Por favor, ingresa tu contraseña actual.');
    }
  };

  const { control, handleSubmit } = changePasswordForm;
  return (
    <div>
      <Form {...changePasswordForm}>
        <form onSubmit={handleSubmit(onSubmit)} className=" space-y-4">
          <div className="space-y-2 mb-6">
            <Separator />
            <h3>Verifica tu identidad</h3>
            <p className="text-sm text-muted-foreground">
              Ingresa tu contraseña actual para poder editar tus datos.
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
                        {...field}
                      />
                    </FormControl>
                    <Button onClick={handleVerifyPassword} type="button">
                      Verificar
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
              <FormItem className=" w-full">
                <FormLabel>Contraseña:</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    id="newPassword"
                    {...field}
                    disabled={!isVerified}
                    className={`${
                      !isVerified ? "bg-zinc-200 text-zinc-700 opacity-50" : ""
                    }`}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className=" w-full">
                <FormLabel>Confirmar contraseña:</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    disabled={!isVerified}
                    className={`${
                      !isVerified ? "bg-zinc-200 text-zinc-700 opacity-50" : ""
                    }`}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="w-full justify-end flex">
            <Button type="submit" disabled={!isVerified}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PasswordEdit;
