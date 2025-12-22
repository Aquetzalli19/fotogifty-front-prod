"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { itemPackages } from "@/interfaces/admi-items";
import {
  ItemPackageSchema,
  ItemPackageSchemaType,
} from "@/validations/item-package-schema";
import { Button } from "@/components/ui/button";
import { actualizarPaquete } from "@/services/packages";
import { obtenerTodasCategorias } from "@/services/categories";
import { useToast } from "@/hooks/useToast";
import { Toast, ToastContainer } from "@/components/ui/toast";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditItemDialogProps {
  item: itemPackages;
  open: boolean;
  setClose: () => void;
}

const EditItemDialog = ({ item, open, setClose }: EditItemDialogProps) => {
  const [categories, setCategories] = useState<Array<{ id: number; nombre: string }>>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Toast notifications
  const { toasts, removeToast, success, error: showError } = useToast();

  const form = useForm<ItemPackageSchemaType>({
    resolver: zodResolver(ItemPackageSchema),
    defaultValues: {
      packageName: item.packageName || "",
      productClasification: item.productClasification || "",
      description: item.description || "",
      photoQuantity: item.photoQuantity || 1,
      packagePrice: item.packagePrice || 0,
      itemStatus: item.itemStatus || true,
      photoResolution: item.photoResolution || 300,
      photoWidth: item.photoWidth || 10,
      photoHeight: item.photoHeight || 15,
    },
  });

  // Cargar categorías
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const response = await obtenerTodasCategorias();
        if (response.success && response.data) {
          setCategories(response.data.filter((cat) => cat.activo));
        }
      } catch (err) {
        console.error("Error loading categories:", err);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    if (open) {
      loadCategories();
    }
  }, [open]);

  // Resetear formulario cuando cambia el item
  useEffect(() => {
    if (item) {
      form.reset({
        packageName: item.packageName || "",
        productClasification: item.productClasification || "",
        description: item.description || "",
        photoQuantity: item.photoQuantity || 1,
        packagePrice: item.packagePrice || 1,
        itemStatus: item.itemStatus,
        photoResolution: item.photoResolution || 300,
        photoWidth: item.photoWidth || 10,
        photoHeight: item.photoHeight || 15,
      });
    }
  }, [item, form]);

  const onSubmit = async (data: ItemPackageSchemaType) => {
    setIsUpdating(true);

    try {
      // Encontrar el ID de la categoría seleccionada
      const selectedCategory = categories.find(
        (cat) => cat.nombre === data.productClasification
      );

      if (!selectedCategory) {
        showError("Por favor selecciona una categoría válida");
        setIsUpdating(false);
        return;
      }

      // Mapear los campos del formulario a la estructura de la API (snake_case)
      const paqueteData = {
        nombre: data.packageName,
        categoria_id: selectedCategory.id,
        descripcion: data.description || "",
        cantidad_fotos: Number(data.photoQuantity),
        precio: Number(data.packagePrice),
        estado: data.itemStatus,
        resolucion_foto: Number(data.photoResolution),
        ancho_foto: Number(data.photoWidth),
        alto_foto: Number(data.photoHeight),
      };

      console.log("Datos a actualizar:", JSON.stringify(paqueteData, null, 2));

      const response = await actualizarPaquete(item.id, paqueteData);

      if (response.success) {
        success(`Paquete "${data.packageName}" actualizado exitosamente`);
        setClose();
      } else {
        showError("Error al actualizar el paquete. Inténtalo de nuevo.");
      }
    } catch (err) {
      console.error("Error updating package:", err);
      showError("Error al actualizar el paquete. Verifica que todos los campos estén correctos.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      {/* Notificaciones */}
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

      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && setClose()}>
        <DialogContent className=" max-h-[90vh] min-w-1/2 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Paquete</DialogTitle>
            <DialogDescription>
              Modifica la información del paquete aquí.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="packageName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del paquete</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Paquete Básico" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productClasification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isLoadingCategories}
                      >
                        <SelectTrigger className="w-full py-6">
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.nombre}>
                              {category.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="photoQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad de fotos</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Ej. 10"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="packagePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio del paquete</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ej. 299.99"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="photoResolution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resolución de fotos (px)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Ej. 300"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="photoWidth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ancho de foto (px)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        step="0.1"
                        placeholder="Ej. 10.5"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="photoHeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alto de foto (px)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        step="0.1"
                        placeholder="Ej. 15.2"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="itemStatus"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-start justify-around ">
                    <FormLabel>Estado del producto</FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe el paquete de producto..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="sm:justify-between pt-4">
              <Button type="button" variant="outline" onClick={setClose} disabled={isUpdating}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default EditItemDialog;
