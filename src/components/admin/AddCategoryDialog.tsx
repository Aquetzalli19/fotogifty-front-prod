"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { crearCategoria } from "@/services/categories";
import { useToast } from "@/hooks/useToast";
import { Toast, ToastContainer } from "@/components/ui/toast";

// Schema de validación para nueva categoría
const categorySchema = z.object({
  nombre: z.string().min(1, { message: "El nombre es requerido" }),
  descripcion: z.string().optional(),
});

type CategoryFormType = z.infer<typeof categorySchema>;

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryCreated?: (categoryName: string) => void;
}

export function AddCategoryDialog({
  open,
  onOpenChange,
  onCategoryCreated,
}: AddCategoryDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toasts, removeToast, success, error: showError } = useToast();

  const form = useForm<CategoryFormType>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
    },
  });

  const onSubmit = async (data: CategoryFormType) => {
    setIsLoading(true);

    try {
      // Agregar el campo activo con valor true por defecto
      const categoryData = {
        nombre: data.nombre,
        descripcion: data.descripcion || "",
        activo: true,
      };

      // Llamar al servicio de API
      const response = await crearCategoria(categoryData);

      if (response.success) {
        // Mostrar notificación de éxito
        success(`Categoría "${data.nombre}" creada exitosamente`);

        // Resetear el formulario
        form.reset();

        // Notificar que se creó la categoría
        if (onCategoryCreated && response.data) {
          onCategoryCreated(response.data.nombre);
        }

        // Cerrar el modal
        onOpenChange(false);
      } else {
        showError("Error al crear la categoría. Inténtalo de nuevo.");
      }
    } catch (err) {
      console.error("Error creating category:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Error al crear la categoría";
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Contenedor de notificaciones */}
      <ToastContainer>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agregar nueva categoría</DialogTitle>
          <DialogDescription>
            Crea una nueva categoría para organizar tus paquetes de productos.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Campo Nombre */}
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la categoría *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej. Calendario"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Descripción */}
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe la categoría..."
                      className="resize-none"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Footer con botones */}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creando..." : "Crear categoría"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
}
