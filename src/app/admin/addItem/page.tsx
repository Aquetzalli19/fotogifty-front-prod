"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  ItemPackageSchema,
  ItemPackageSchemaType,
} from "@/validations/item-package-schema";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Undo2, Loader2, Upload, X } from "lucide-react";
import { AddCategoryDialog } from "@/components/admin/AddCategoryDialog";
import { obtenerTodasCategorias, type Categoria } from "@/services/categories";
import { crearPaqueteConImagen } from "@/services/packages";
import { mockCategories } from "@/test-data/categories-mockdata";
import { config } from "@/lib/config";
import { useToast } from "@/hooks/useToast";
import { Toast, ToastContainer } from "@/components/ui/toast";
import Image from "next/image";

const AddItemPage = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomOption, setIsCustomOption] = useState(false);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Estados para imagen
  const [imagen, setImagen] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Toast notifications
  const { toasts, removeToast, success, error: showError } = useToast();

  const form = useForm<ItemPackageSchemaType>({
    resolver: zodResolver(ItemPackageSchema),
    defaultValues: {
      packageName: "",
      productClasification: "",
      description: "",
      photoQuantity: 1,
      packagePrice: 1,
      itemStatus: true,
      photoResolution: 300,
      photoWidth: 10,
      photoHeight: 15,
    },
  });

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

      setImagen(file);

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagen(null);
    setPreview(null);
  };

  const onSubmit = async (data: ItemPackageSchemaType) => {
    setIsCreating(true);

    try {
      // Encontrar el ID de la categoría seleccionada
      const selectedCategory = categories.find(
        (cat) => cat.nombre === data.productClasification
      );

      if (!selectedCategory) {
        showError("Por favor selecciona una categoría válida");
        setIsCreating(false);
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

      // Log para debugging
      console.log("Datos a enviar:", JSON.stringify(paqueteData, null, 2));
      console.log("Imagen:", imagen ? imagen.name : "Sin imagen");

      // Usar crearPaqueteConImagen en lugar de crearPaquete
      const response = await crearPaqueteConImagen(paqueteData, imagen || undefined);

      if (response.success) {
        success(`Paquete "${data.packageName}" creado exitosamente`);
        form.reset();
        handleRemoveImage(); // Limpiar imagen y preview
        // Redirigir a la página de gestión de paquetes después de 1 segundo
        setTimeout(() => {
          router.push("/admin/itemcontrol");
        }, 1000);
      } else {
        showError("Error al crear el paquete. Inténtalo de nuevo.");
      }
    } catch (err) {
      console.error("Error creating package:", err);
      showError("Error al crear el paquete. Verifica que todos los campos estén correctos.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCategoryCreated = (categoryName: string) => {
    // Actualizar el campo del formulario con la nueva categoría
    form.setValue("productClasification", categoryName);
    setIsCustomOption(false);

    // Recargar las categorías para incluir la nueva
    loadCategories();
  };

  const loadCategories = async () => {
    setIsLoadingCategories(true);

    // Si no hay API configurada, usar datos mock
    if (!config.apiUrl) {
      console.log("No API URL configured, using mock data");
      setCategories(mockCategories);
      setIsLoadingCategories(false);
      return;
    }

    try {
      const response = await obtenerTodasCategorias();

      if (response.success && response.data) {
        // Filtrar solo categorías activas
        const activeCategories = response.data.filter((cat) => cat.activo);
        setCategories(activeCategories);
      } else {
        // Si falla la API, usar mock data
        console.warn("API call failed, using mock data");
        setCategories(mockCategories);
      }
    } catch (error) {
      console.error("Error loading categories, using mock data:", error);
      // En caso de error, usar datos mock
      setCategories(mockCategories);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Cargar categorías al montar el componente
  useEffect(() => {
    loadCategories();
  }, []);

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

      <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-4 sm:mb-6">
          Crear nuevo paquete
        </h1>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Sección de imagen del paquete */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Imagen del paquete (opcional)
              </label>
              <p className="text-xs text-muted-foreground">
                Sube una imagen representativa del paquete. Máximo 5MB.
              </p>

              {/* Preview de imagen */}
              {preview && (
                <div className="relative w-full max-w-md h-48 border rounded-lg overflow-hidden bg-background">
                  <Image
                    src={preview}
                    alt="Preview del paquete"
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
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
                    id="imagen-input"
                  />
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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
                    {!isCustomOption ? (
                      <Select
                        value={field.value}
                        onValueChange={(value: string) => {
                          if (value === "other") {
                            setIsAddCategoryDialogOpen(true);
                          } else {
                            setIsCustomOption(false);
                            setCustomCategory("");
                            field.onChange(value);
                          }
                        }}
                        disabled={isLoadingCategories}
                      >
                        <SelectTrigger className="w-full py-6">
                          {isLoadingCategories ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Cargando categorías...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Selecciona una categoría" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem
                              key={category.id}
                              value={category.nombre}
                            >
                              {category.nombre}
                            </SelectItem>
                          ))}
                          <SelectItem value="other">
                            <Button>
                              {" "}
                              <Plus className="text-primary-foreground" /> Nueva
                              categoría
                            </Button>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex flex-row gap-2 items-start">
                        <Input
                          value={customCategory}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setCustomCategory(newValue);
                            form.setValue("productClasification", newValue);
                          }}
                          placeholder="Ingresa la categoría personalizada"
                        />

                        <Button
                          type="button"
                          variant="outline"
                          className="w-6 h-6 bg-muted"
                          onClick={() => {
                            setIsCustomOption(false);
                            setCustomCategory("");
                          }}
                        >
                          <Undo2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
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
                      value={field.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? "" : parseInt(value));
                      }}
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
                      min="0.01"
                      step="0.01"
                      placeholder="Ej. 299.99"
                      value={field.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? "" : parseFloat(value));
                      }}
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
                  <FormLabel>Resolución de fotos (DPI)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Ej. 300"
                      value={field.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? "" : parseInt(value));
                      }}
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
                  <FormLabel>Ancho de foto (pulgadas)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0.01"
                      step="any"
                      placeholder="Ej. 10.5"
                      value={field.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? "" : parseFloat(value));
                      }}
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
                  <FormLabel>Alto de foto (pulgadas)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0.01"
                      step="any"
                      placeholder="Ej. 15.2"
                      value={field.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? "" : parseFloat(value));
                      }}
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
                  <FormLabel>Estado del paquete</FormLabel>
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
          <div className="w-full flex items-center justify-end pt-2">
            <Button
              type="submit"
              className="w-full sm:w-auto text-base sm:text-lg"
              disabled={isCreating}
            >
              {isCreating ? "Creando..." : "Crear paquete"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Modal para agregar nueva categoría */}
      <AddCategoryDialog
        open={isAddCategoryDialogOpen}
        onOpenChange={setIsAddCategoryDialogOpen}
        onCategoryCreated={handleCategoryCreated}
      />
      </div>
    </>
  );
};

export default AddItemPage;
