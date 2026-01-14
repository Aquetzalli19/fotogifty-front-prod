"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StoreUser } from "@/interfaces/users";
import { actualizarStoreUser, type ActualizarStoreUserDTO } from "@/services/stores";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

// Validación con Zod
import { z } from "zod";

const editStoreUserSchema = z.object({
  email: z.string().email("Email inválido"),
  nombre: z.string().min(1, "Nombre es requerido"),
  apellido: z.string().min(1, "Apellido es requerido"),
  codigo_empleado: z.string().min(1, "Código de empleado es requerido"),
  telefono: z
    .string()
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .refine((value) => /^[0-9]+$/.test(value), {
      message: "El número de teléfono solo debe contener dígitos",
    }),
  activo: z.boolean(),
  newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional().or(z.literal("")),
});

type EditStoreUserForm = z.infer<typeof editStoreUserSchema>;

interface EditStoreUserDialogProps {
  user: StoreUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
  onShowToast?: (message: string, type: "success" | "error") => void;
}

const EditStoreUserDialog: React.FC<EditStoreUserDialogProps> = ({
  user,
  open,
  onOpenChange,
  onUserUpdated,
  onShowToast,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<EditStoreUserForm>({
    resolver: zodResolver(editStoreUserSchema),
    defaultValues: {
      email: user?.email || "",
      nombre: user?.nombre || "",
      apellido: user?.apellido || "",
      codigo_empleado: user?.codigo_empleado || "",
      telefono: user?.telefono || "",
      activo: user?.activo ?? true,
      newPassword: "",
    },
  });

  React.useEffect(() => {
    if (user) {
      form.reset({
        email: user.email || "",
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        codigo_empleado: user.codigo_empleado || "",
        telefono: user.telefono || "",
        activo: user.activo ?? true,
        newPassword: "",
      });
    }
  }, [user, form, open]);

  const onSubmit = async (data: EditStoreUserForm) => {
    if (!user || !user.id) {
      console.error("No user or user ID available");
      if (onShowToast) {
        onShowToast("Datos de usuario incompletos", "error");
      }
      return;
    }

    setIsUpdating(true);

    try {
      // Preparamos los datos de actualización
      const updateData: ActualizarStoreUserDTO = {
        email: data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        codigo_empleado: data.codigo_empleado,
        telefono: data.telefono,
        activo: data.activo,
      };

      // Solo incluimos la contraseña si se proporcionó una nueva
      if (data.newPassword && data.newPassword.trim() !== "") {
        // Agregamos la contraseña nueva al objeto de actualización
        updateData.password = data.newPassword;
      }

      // Realizamos la actualización (ya sea con o sin contraseña)
      const response = await actualizarStoreUser(Number(user.id), updateData);

      // Actualización exitosa (ya sea con o sin cambio de contraseña)
      onUserUpdated();
      onOpenChange(false);

      if (onShowToast) {
        if (data.newPassword && data.newPassword.trim() !== "") {
          onShowToast("Usuario actualizado exitosamente (contraseña también actualizada)", "success");
        } else {
          onShowToast("Usuario actualizado exitosamente", "success");
        }
      }
    } catch (error) {
      console.error("Error updating store user:", error);
      const errorMsg = "Error al actualizar el usuario";
      if (onShowToast) {
        onShowToast(errorMsg, "error");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuario de Tienda</DialogTitle>
          <DialogDescription>
            Actualiza la información del usuario de tienda
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del usuario" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apellido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input placeholder="Apellido del usuario" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="codigo_empleado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Empleado</FormLabel>
                    <FormControl>
                      <Input placeholder="Código único del empleado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="4421234567"
                        {...field}
                        onInput={(e) => {
                          // Solo permitir números
                          const target = e.target as HTMLInputElement;
                          target.value = target.value.replace(/[^0-9]/g, '');
                          field.onChange(target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="activo"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-start justify-around">
                    <FormLabel>Estado del usuario</FormLabel>
                    <div className="space-y-2 flex flex-row gap-2 items-center">
                      <span className="text-sm text-muted-foreground">
                        {field.value ? "Activo" : "Inactivo"}
                      </span>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva Contraseña (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Dejar vacío para mantener la actual"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={isUpdating}
                className="w-full md:w-auto"
              >
                {isUpdating ? "Actualizando..." : "Actualizar Usuario"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export { EditStoreUserDialog };