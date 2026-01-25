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
import { useToast } from "@/hooks/useToast";
import { useAuthStore } from "@/stores/auth-store";
import { actualizarCliente } from "@/services/usuarios";

interface PhoneEditProps {
  prevPhone: string;
  userId?: number; // Agregamos el ID de usuario para la actualización
  onSuccess?: () => void;
}

const ChangePhoneSchema = z.object({
  newPhoneNumber: z
    .string()
    .min(10, { message: "El número debe tener al menos 10 dígitos." })
    .refine((value) => /^[0-9]+$/.test(value), {
      message: "El número de teléfono solo debe contener dígitos.",
    }),
  currentPassword: z
    .string()
    .min(1, { message: "Por favor, ingresa tu contraseña actual." }),
});

export default function PhoneEdit({ prevPhone, userId, onSuccess }: PhoneEditProps) {
  const [isVerified, setIsVerified] = useState(false);
  const { success, error: showError } = useToast();
  const { updateUserData } = useAuthStore();

  const phoneForm = useForm<z.infer<typeof ChangePhoneSchema>>({
    resolver: zodResolver(ChangePhoneSchema),
    defaultValues: {
      newPhoneNumber: prevPhone,
      currentPassword: "",
    },
    mode: "onSubmit",
  });

  const onSubmit = async (values: z.infer<typeof ChangePhoneSchema>) => {
    if (!userId) {
      showError('ID de usuario no disponible.');
      return;
    }

    try {
      const response = await actualizarCliente(userId, {
        telefono: values.newPhoneNumber
      });

      if (response.success && response.data) {
        // Actualizar el store con los nuevos datos
        updateUserData(response.data);

        success('Teléfono actualizado correctamente.');
        phoneForm.reset();
        setIsVerified(false);
        // Cerrar el modal si se proporcionó el callback
        if (onSuccess) {
          onSuccess();
        }
      } else {
        showError(response.message || 'Error al actualizar el teléfono.');
      }
    } catch (error) {
      console.error('Error al actualizar el teléfono:', error);
      showError('Error al actualizar el teléfono. Por favor, inténtalo de nuevo.');
    }
  };

  const handleVerifyPassword = async () => {
    const currentPassword = phoneForm.getValues('currentPassword');
    if (!currentPassword) {
      showError('Por favor, ingresa tu contraseña actual.');
      return;
    }

    // En una implementación real, aquí verificaríamos con el backend
    // que la contraseña actual es correcta antes de permitir la edición
    setIsVerified(true);
  };

  const { control, handleSubmit } = phoneForm;
  return (
    <div className="py-4">
      <Form {...phoneForm}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2 mb-6">
            <Separator />
            <h3 className="font-semibold pt-4">Verifica tu identidad</h3>
            <p className="text-sm text-muted-foreground">
              Ingresa tu contraseña actual para poder editar tu teléfono.
            </p>
            <FormField
              control={control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="current-password-phone">Contraseña Actual</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input
                        id="current-password-phone"
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
            <Separator className="!mt-6" />
          </div>
          <FormField
            control={control}
            name="newPhoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nuevo Número de Teléfono:</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="4421234567"
                    {...field}
                    disabled={!isVerified}
                    onInput={(e) => {
                      // Solo permitir números
                      const target = e.target as HTMLInputElement;
                      target.value = target.value.replace(/[^0-9]/g, '');
                      field.onChange(target.value);
                    }}
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
