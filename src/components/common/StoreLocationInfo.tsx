"use client";

import { useEffect, useState } from "react";
import { MapPin, Clock, Phone, Mail, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { obtenerConfiguracionTienda } from "@/services/store-configuration";
import { StoreConfiguration } from "@/interfaces/store-config";

interface StoreLocationInfoProps {
  showMap?: boolean;
  className?: string;
}

export default function StoreLocationInfo({
  showMap = false,
  className = "",
}: StoreLocationInfoProps) {
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
          setError("No se pudo cargar la información de la tienda");
        }
      } catch (err) {
        console.error("Error cargando configuración de tienda:", err);
        setError("Error al cargar la información de la tienda");
      } finally {
        setIsLoading(false);
      }
    };

    loadStoreConfig();
  }, []);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (error || !storeConfig) {
    return (
      <Card className={`${className} border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <Info className="h-5 w-5" />
            <p className="text-sm">
              {error || "Información de tienda no disponible"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Dirección para mostrar
  const displayAddress = `${storeConfig.direccion}, ${storeConfig.ciudad}, ${storeConfig.estado} ${storeConfig.codigo_postal}, ${storeConfig.pais}`;

  // Dirección para Google Maps (usa direccion_maps si existe, sino usa coordenadas)
  const mapsQuery = storeConfig.direccion_maps
    ? encodeURIComponent(storeConfig.direccion_maps)
    : `${storeConfig.latitud},${storeConfig.longitud}`;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          {storeConfig.nombre}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dirección */}
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-sm text-foreground">Dirección</p>
            <p className="text-sm text-muted-foreground">{displayAddress}</p>
          </div>
        </div>

        {/* Teléfono */}
        <div className="flex items-start gap-3">
          <Phone className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-sm text-foreground">Teléfono</p>
            <a
              href={`tel:${storeConfig.telefono}`}
              className="text-sm text-primary hover:underline"
            >
              {storeConfig.telefono}
            </a>
          </div>
        </div>

        {/* Email */}
        {storeConfig.email && (
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm text-foreground">Email</p>
              <a
                href={`mailto:${storeConfig.email}`}
                className="text-sm text-primary hover:underline"
              >
                {storeConfig.email}
              </a>
            </div>
          </div>
        )}

        {/* Horarios */}
        {(storeConfig.horario_lunes_viernes ||
          storeConfig.horario_sabado ||
          storeConfig.horario_domingo) && (
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-medium text-sm text-foreground">Horarios</p>
              {storeConfig.horario_lunes_viernes && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Lun - Vie:</span>{" "}
                  {storeConfig.horario_lunes_viernes}
                </p>
              )}
              {storeConfig.horario_sabado && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Sábado:</span>{" "}
                  {storeConfig.horario_sabado}
                </p>
              )}
              {storeConfig.horario_domingo && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Domingo:</span>{" "}
                  {storeConfig.horario_domingo}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Descripción */}
        {storeConfig.descripcion && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              {storeConfig.descripcion}
            </p>
          </div>
        )}

        {/* Instrucciones de llegada */}
        {storeConfig.instrucciones_llegada && (
          <div className="flex items-start gap-3 bg-muted/50 p-3 rounded-lg">
            <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm text-foreground mb-1">
                Cómo llegar
              </p>
              <p className="text-sm text-muted-foreground">
                {storeConfig.instrucciones_llegada}
              </p>
            </div>
          </div>
        )}

        {/* Mapa (si showMap es true) */}
        {showMap && (
          <div className="pt-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <MapPin className="h-4 w-4" />
              Ver en Google Maps
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
