"use client";

import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { actualizarCategoria, type Categoria } from "@/services/categories";

const categorySchema = z.object({
  nombre: z.string().min(1, { message: "El nombre es requerido" }),
  descripcion: z.string().optional(),
  activo: z.boolean(),
});

type CategoryFormType = z.infer<typeof categorySchema>;

interface EditCategoryDialogProps {
  category: Categoria | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryUpdated: () => void;
  onShowToast: (message: string, type: "success" | "error") => void;
}

export function EditCategoryDialog({
  category,
  open,
  onOpenChange,
  onCategoryUpdated,
  onShowToast,
}: EditCategoryDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CategoryFormType>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      activo: true,
    },
  });

  // Actualizar el formulario cuando cambia la categoría
  useEffect(() => {
    if (category) {
      form.reset({
        nombre: category.nombre,
        descripcion: category.descripcion || "",
        activo: category.activo,
      });
    }
  }, [category, form]);

  const onSubmit = async (data: CategoryFormType) => {
    if (!category) return;

    setIsLoading(true);

    try {
      console.log('Actualizando categoría:', category.id, data);
      
      const response = await actualizarCategoria(category.id, {
        nombre: data.nombre,
        descripcion: data.descripcion || "",
        activo: data.activo,
      });

      console.log('Respuesta de actualización:', response);

      if (response.success) {
        onShowToast(`Categoría "${data.nombre}" actualizada exitosamente`, "success");
        onCategoryUpdated();
        onOpenChange(false);
      } else {
        console.error('Error en respuesta:', response);
        onShowToast("Error al actualizar la categoría", "error");
      }
    } catch (err) {
      console.error("Error updating category:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Error al actualizar la categoría";
      onShowToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar categoría</DialogTitle>
          <DialogDescription>
            Modifica la información de la categoría
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

            {/* Campo Estado */}
            <FormField
              control={form.control}
              name="activo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Estado</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      {field.value ? "La categoría está activa" : "La categoría está inactiva"}
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

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
                {isLoading ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
