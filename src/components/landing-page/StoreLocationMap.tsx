"use client";

import { useEffect, useState } from "react";
import { MapPin, Phone, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { obtenerConfiguracionTienda } from "@/services/store-configuration";
import { StoreConfiguration } from "@/interfaces/store-config";

export default function StoreLocationMap() {
  const [storeConfig, setStoreConfig] = useState<StoreConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStoreConfig = async () => {
      try {
        setIsLoading(true);
        const response = await obtenerConfiguracionTienda();

        if (response.success && response.data) {
          setStoreConfig(response.data);
        } else {
          setError("No se pudo cargar la ubicación de la tienda");
        }
      } catch (err) {
        console.error("Error cargando configuración de tienda:", err);
        setError("Error al cargar la ubicación de la tienda");
      } finally {
        setIsLoading(false);
      }
    };

    loadStoreConfig();
  }, []);

  if (isLoading) {
    return (
      <section className="w-full py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !storeConfig) {
    return (
      <section className="w-full py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-yellow-800 dark:text-yellow-200">
                <AlertCircle className="h-6 w-6 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Ubicación no disponible</p>
                  <p className="text-sm mt-1">
                    {error || "No se pudo cargar la ubicación de la tienda"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  // Dirección para mostrar (la bonita)
  const displayAddress = `${storeConfig.direccion}, ${storeConfig.ciudad}, ${storeConfig.estado} ${storeConfig.codigo_postal}, ${storeConfig.pais}`;

  // Dirección para Google Maps (usa direccion_maps si existe, sino usa coordenadas)
  const mapsQuery = storeConfig.direccion_maps
    ? encodeURIComponent(storeConfig.direccion_maps)
    : `${storeConfig.latitud},${storeConfig.longitud}`;
  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <section id="ubicacion" className="w-full py-12 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Visítanos
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Encuentra nuestra tienda física y recoge tus pedidos personalmente
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Mapa */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Google Maps Embed usando iframe con query de búsqueda */}
              <iframe
                src={`https://maps.google.com/maps?q=${storeConfig.latitud},${storeConfig.longitud}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación de FotoGifty"
                className="w-full h-[450px]"
              />
            </CardContent>
          </Card>

          {/* Información de la Tienda */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-primary" />
                  {storeConfig.nombre}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Dirección */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                    Dirección
                  </h3>
                  <p className="text-base leading-relaxed">{displayAddress}</p>
                </div>

                {/* Teléfono */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Teléfono
                  </h3>
                  <a
                    href={`tel:${storeConfig.telefono}`}
                    className="text-base text-primary hover:underline"
                  >
                    {storeConfig.telefono}
                  </a>
                </div>

                {/* Horarios */}
                {(storeConfig.horario_lunes_viernes ||
                  storeConfig.horario_sabado ||
                  storeConfig.horario_domingo) && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Horarios de Atención
                    </h3>
                    <div className="space-y-1.5">
                      {storeConfig.horario_lunes_viernes && (
                        <p className="text-base">
                          <span className="font-medium">Lun - Vie:</span>{" "}
                          {storeConfig.horario_lunes_viernes}
                        </p>
                      )}
                      {storeConfig.horario_sabado && (
                        <p className="text-base">
                          <span className="font-medium">Sábado:</span>{" "}
                          {storeConfig.horario_sabado}
                        </p>
                      )}
                      {storeConfig.horario_domingo && (
                        <p className="text-base">
                          <span className="font-medium">Domingo:</span>{" "}
                          {storeConfig.horario_domingo}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Descripción */}
                {storeConfig.descripcion && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {storeConfig.descripcion}
                    </p>
                  </div>
                )}

                {/* Instrucciones de llegada */}
                {storeConfig.instrucciones_llegada && (
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Referencias
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {storeConfig.instrucciones_llegada}
                    </p>
                  </div>
                )}

                {/* Botón Ver en Maps */}
                <div className="pt-2">
                  <Button
                    asChild
                    variant="default"
                    className="w-full sm:w-auto"
                  >
                    <a
                      href={googleMapsSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <MapPin className="h-4 w-4" />
                      Ver en Maps
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
