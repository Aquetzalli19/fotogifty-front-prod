"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import { Loader2, MapPin, Clock, Info } from "lucide-react";
import {
  obtenerConfiguracionTienda,
  actualizarConfiguracionTienda,
} from "@/services/store-configuration";
import { StoreConfigurationDTO } from "@/interfaces/store-config";

const storeConfigSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  direccion: z.string().min(1, "La dirección es requerida"),
  ciudad: z.string().min(1, "La ciudad es requerida"),
  estado: z.string().min(1, "El estado es requerido"),
  codigo_postal: z.string().min(1, "El código postal es requerido"),
  pais: z.string().min(1, "El país es requerido"),
  telefono: z.string().min(1, "El teléfono es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
  horario_lunes_viernes: z.string().optional(),
  horario_sabado: z.string().optional(),
  horario_domingo: z.string().optional(),
  descripcion: z.string().optional(),
  instrucciones_llegada: z.string().optional(),
});

type StoreConfigFormData = z.infer<typeof storeConfigSchema>;

export default function StoreSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { success, error } = useToast();

  const form = useForm<StoreConfigFormData>({
    resolver: zodResolver(storeConfigSchema),
    defaultValues: {
      nombre: "",
      direccion: "",
      ciudad: "",
      estado: "",
      codigo_postal: "",
      pais: "México",
      telefono: "",
      email: "",
      latitud: 19.432608, // Mexico City default
      longitud: -99.133209,
      horario_lunes_viernes: "",
      horario_sabado: "",
      horario_domingo: "",
      descripcion: "",
      instrucciones_llegada: "",
    },
  });

  // Cargar configuración existente
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        setIsFetching(true);
        const response = await obtenerConfiguracionTienda();

        if (response.success && response.data) {
          const config = response.data;
          form.reset({
            nombre: config.nombre,
            direccion: config.direccion,
            ciudad: config.ciudad,
            estado: config.estado,
            codigo_postal: config.codigo_postal,
            pais: config.pais,
            telefono: config.telefono,
            email: config.email || "",
            latitud: config.latitud,
            longitud: config.longitud,
            horario_lunes_viernes: config.horario_lunes_viernes || "",
            horario_sabado: config.horario_sabado || "",
            horario_domingo: config.horario_domingo || "",
            descripcion: config.descripcion || "",
            instrucciones_llegada: config.instrucciones_llegada || "",
          });
        }
      } catch (err) {
        console.error("Error cargando configuración:", err);
        error("Error al cargar la configuración de la tienda");
      } finally {
        setIsFetching(false);
      }
    };

    loadConfiguration();
  }, [form, error]);

  const onSubmit = async (data: StoreConfigFormData) => {
    setIsLoading(true);
    try {
      const dto: StoreConfigurationDTO = {
        ...data,
        email: data.email || undefined,
        horario_lunes_viernes: data.horario_lunes_viernes || undefined,
        horario_sabado: data.horario_sabado || undefined,
        horario_domingo: data.horario_domingo || undefined,
        descripcion: data.descripcion || undefined,
        instrucciones_llegada: data.instrucciones_llegada || undefined,
      };

      const response = await actualizarConfiguracionTienda(dto);

      if (response.success) {
        success("Configuración de tienda actualizada exitosamente");
      } else {
        error(response.message || "Error al actualizar la configuración");
      }
    } catch (err) {
      console.error("Error actualizando configuración:", err);
      error("Error al actualizar la configuración de la tienda");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Configuración de Tienda
        </h1>
        <p className="text-muted-foreground">
          Administra la información de tu tienda física para recolección de pedidos
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Información Básica
              </CardTitle>
              <CardDescription>
                Nombre y datos generales de la tienda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Tienda</FormLabel>
                    <FormControl>
                      <Input placeholder="FotoGifty - Tienda Principal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="+52 55 1234 5678" {...field} />
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
                      <FormLabel>Email (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="tienda@fotogifty.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Breve descripción de la tienda..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Ubicación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Ubicación
              </CardTitle>
              <CardDescription>
                Dirección física y coordenadas GPS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input placeholder="Av. Insurgentes Sur 1602" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ciudad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <FormControl>
                        <Input placeholder="Ciudad de México" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="CDMX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="codigo_postal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código Postal</FormLabel>
                      <FormControl>
                        <Input placeholder="03900" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pais"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>País</FormLabel>
                      <FormControl>
                        <Input placeholder="México" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitud"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitud</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.000001"
                          placeholder="19.432608"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Coordenada GPS (ej: 19.432608)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="longitud"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitud</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.000001"
                          placeholder="-99.133209"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Coordenada GPS (ej: -99.133209)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="instrucciones_llegada"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instrucciones de Llegada (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Indicaciones para llegar a la tienda..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Referencias útiles para los clientes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Horarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horarios de Atención
              </CardTitle>
              <CardDescription>
                Horarios en los que los clientes pueden recoger sus pedidos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="horario_lunes_viernes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lunes a Viernes (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="9:00 AM - 7:00 PM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="horario_sabado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sábado (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="10:00 AM - 3:00 PM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="horario_domingo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domingo (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Cerrado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Botón Submit */}
          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="min-w-[200px]"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Guardando..." : "Guardar Configuración"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
