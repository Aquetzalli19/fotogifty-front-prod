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
import { PhoneInput } from "@/components/ui/phone-input";
import { PasswordInput } from "@/components/ui/password-input";
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
  countryCode: z.string().min(1, { message: "Selecciona un código de país" }),
  newPhoneNumber: z
    .string()
    .min(9, { message: "El número debe tener al menos 9 dígitos." })
    .max(11, { message: "El número no puede tener más de 11 dígitos" })
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

  // Separar el código de país del número si viene en formato +52XXXXXXXXXX
  const parsePhoneNumber = (fullPhone: string) => {
    const match = fullPhone.match(/^(\+\d{1,3})(\d+)$/);
    if (match) {
      return { countryCode: match[1], phoneNumber: match[2] };
    }
    // Si no tiene código de país, asumir México
    return { countryCode: "+52", phoneNumber: fullPhone };
  };

  const { countryCode: initialCountryCode, phoneNumber: initialPhoneNumber } = parsePhoneNumber(prevPhone);

  const phoneForm = useForm<z.infer<typeof ChangePhoneSchema>>({
    resolver: zodResolver(ChangePhoneSchema),
    defaultValues: {
      countryCode: initialCountryCode,
      newPhoneNumber: initialPhoneNumber,
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
        telefono: `${values.countryCode}${values.newPhoneNumber}`
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
                      <PasswordInput
                        id="current-password-phone"
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
                  <PhoneInput
                    value={field.value}
                    countryCode={phoneForm.watch("countryCode")}
                    onValueChange={field.onChange}
                    onCountryChange={(code) => phoneForm.setValue("countryCode", code)}
                    placeholder="5512345678"
                    disabled={!isVerified}
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
