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
import { actualizarPaqueteConImagen } from "@/services/packages";
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
import { Upload, X, ImageIcon } from "lucide-react";
import Image from "next/image";

interface EditItemDialogProps {
  item: itemPackages;
  open: boolean;
  setClose: () => void;
}

const EditItemDialog = ({ item, open, setClose }: EditItemDialogProps) => {
  const [categories, setCategories] = useState<Array<{ id: number; nombre: string }>>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Estados para imagen
  const [nuevaImagen, setNuevaImagen] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imagenActual, setImagenActual] = useState<string | null>(null);

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
      // Cargar imagen actual si existe
      setImagenActual(item.imagen_url || null);
      setPreview(null);
      setNuevaImagen(null);
    }
  }, [item, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError("La imagen no puede superar los 5MB");
        return;
      }

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        showError("Solo se permiten archivos de imagen");
        return;
      }

      setNuevaImagen(file);

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveNewImage = () => {
    setNuevaImagen(null);
    setPreview(null);
  };

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
      console.log("Nueva imagen:", nuevaImagen ? nuevaImagen.name : "Sin cambios en imagen");

      // Usar actualizarPaqueteConImagen en lugar de actualizarPaquete
      const response = await actualizarPaqueteConImagen(item.id, paqueteData, nuevaImagen || undefined);

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
            {/* Sección de imagen del paquete */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Imagen del paquete
                </label>
                <p className="text-xs text-muted-foreground">
                  {imagenActual && !nuevaImagen
                    ? "Sube una nueva imagen para reemplazar la actual o deja vacío para mantenerla."
                    : "Sube una imagen representativa del paquete. Máximo 5MB."}
                </p>

                {/* Imagen actual */}
                {imagenActual && !preview && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Imagen actual:</p>
                    <div className="relative w-full max-w-md h-48 border rounded-lg overflow-hidden bg-background">
                      <Image
                        src={imagenActual}
                        alt="Imagen actual del paquete"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Preview de nueva imagen */}
                {preview && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Nueva imagen:</p>
                    <div className="relative w-full max-w-md h-48 border rounded-lg overflow-hidden bg-background">
                      <Image
                        src={preview}
                        alt="Preview nueva imagen"
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={handleRemoveNewImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Input de imagen */}
                {!preview && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="cursor-pointer"
                      id="imagen-edit-input"
                    />
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                {!imagenActual && !preview && (
                  <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg bg-muted/50">
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Sin imagen</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

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
