"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { eliminarCuentaCliente } from "@/services/usuarios";
import { useToast } from "@/hooks/useToast";
import { useAuthStore } from "@/stores/auth-store";

const EliminarCuentaSchema = z.object({
  password: z.string().min(1, "Ingresa tu contraseña actual"),
  phoneNumber: z
    .string()
    .min(9, "Al menos 9 dígitos")
    .max(11, "Máximo 11 dígitos")
    .refine((v) => /^[0-9]+$/.test(v), "Solo dígitos numéricos"),
  confirmar: z.boolean().refine((v) => v === true, {
    message: "Debes confirmar para continuar",
  }),
});

type EliminarCuentaValues = z.infer<typeof EliminarCuentaSchema>;

interface DeleteAccountFormProps {
  userId: number;
  userPhone: string;
  onSuccess: () => void;
}

export default function DeleteAccountForm({
  userId,
  userPhone,
  onSuccess,
}: DeleteAccountFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: showError } = useToast();
  const { logout } = useAuthStore();

  const form = useForm<EliminarCuentaValues>({
    resolver: zodResolver(EliminarCuentaSchema),
    defaultValues: {
      password: "",
      phoneNumber: "",
      confirmar: false,
    },
    mode: "onSubmit",
  });

  const { control, handleSubmit } = form;

  const onSubmit = async (values: EliminarCuentaValues) => {
    setIsSubmitting(true);
    try {
      const response = await eliminarCuentaCliente(
        userId,
        values.password,
        values.phoneNumber
      );

      if (response.success) {
        onSuccess();
        logout();
        window.location.href = "/";
      } else {
        showError(
          response.message ||
            "No se pudo eliminar la cuenta. Verifica tus datos e inténtalo de nuevo."
        );
      }
    } catch (error) {
      console.error("Error al eliminar la cuenta:", error);
      showError(
        error instanceof Error
          ? error.message
          : "Error al eliminar la cuenta. Por favor, inténtalo de nuevo."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const phoneHint =
    userPhone.length > 4
      ? `••••${userPhone.slice(-4)}`
      : userPhone || "registrado";

  return (
    <div className="py-2">
      {/* Aviso informativo */}
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 mb-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-destructive">
              Esta acción es permanente e irreversible
            </p>
            <p className="text-muted-foreground">
              Al eliminar tu cuenta se borrarán o anonimizarán los siguientes
              datos:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Nombre, correo, teléfono y contraseña (eliminados)</li>
              <li>Direcciones de envío guardadas (eliminadas)</li>
              <li>
                Historial de pedidos (anonimizado, sin datos personales)
              </li>
              <li>Sesiones activas y tokens de acceso (revocados)</li>
            </ul>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Separator />

          <FormField
            control={control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="delete-password">
                  Contraseña actual
                </FormLabel>
                <FormControl>
                  <Input
                    id="delete-password"
                    type="password"
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="delete-phone">
                  Número de teléfono registrado{" "}
                  <span className="text-muted-foreground font-normal">
                    (termina en {phoneHint})
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    id="delete-phone"
                    type="tel"
                    placeholder="Ej. 5512345678"
                    inputMode="numeric"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="confirmar"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border p-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="cursor-pointer">
                    Entiendo que esta acción es permanente e irreversible y
                    deseo eliminar mi cuenta
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <div className="w-full flex justify-end pt-2">
            <Button
              type="submit"
              variant="destructive"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar permanentemente"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
