"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, CheckCircle2, AlertCircle, FileArchive, Lock } from "lucide-react";
import { descargarMultiplesFotos } from "@/services/fotos";
import { useToast } from "@/hooks/useToast";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/stores/auth-store";

interface DownloadPedidoFotosProps {
  fotoIds: number[];
  pedidoId?: number;
  nombrePedido?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export default function DownloadPedidoFotos({
  fotoIds,
  pedidoId,
  nombrePedido,
  variant = "default",
  size = "default",
  className = ""
}: DownloadPedidoFotosProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadedCount, setDownloadedCount] = useState(0);
  const { success, error, warning } = useToast();
  const { user } = useAuthStore();

  // VERIFICACIÓN DE PERMISOS: Solo admin y store pueden descargar fotos
  const canDownload = user?.tipo === 'admin' ||
                      user?.tipo === 'super_admin' ||
                      user?.tipo === 'store';

  // Si el usuario no tiene permisos, no mostrar el botón
  if (!canDownload) {
    return null;
  }

  const handleDownloadAll = async () => {
    if (fotoIds.length === 0) {
      warning("No hay fotos para descargar", 3000);
      return;
    }

    setIsDownloading(true);
    setProgress(0);
    setDownloadedCount(0);

    try {
      console.log(`📥 Descargando ${fotoIds.length} fotos del pedido ${pedidoId || 'sin ID'}...`);

      // Descargar con progreso
      const results = {
        success: 0,
        failed: 0,
        errors: [] as Error[]
      };

      for (let i = 0; i < fotoIds.length; i++) {
        try {
          const { descargarFoto } = await import('@/services/fotos');
          await descargarFoto(fotoIds[i]);
          results.success++;
          setDownloadedCount(results.success);
          setProgress(((i + 1) / fotoIds.length) * 100);

          // Delay entre descargas
          if (i < fotoIds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        } catch (error) {
          results.failed++;
          results.errors.push(error as Error);
        }
      }

      // Mostrar resultado
      if (results.failed === 0) {
        success(`✅ ${results.success} fotos descargadas correctamente con 300 DPI`, 4000);
      } else if (results.success > 0) {
        warning(`⚠️ ${results.success} fotos descargadas, ${results.failed} fallaron`, 5000);
      } else {
        error(`❌ Error al descargar las fotos`, 4000);
      }

      console.log('📊 Resultado de descarga:', results);
    } catch (err) {
      console.error("Error al descargar fotos:", err);
      error("Error al descargar las fotos. Inténtalo de nuevo.", 4000);
    } finally {
      setIsDownloading(false);
      setProgress(0);
      setDownloadedCount(0);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleDownloadAll}
        disabled={isDownloading || fotoIds.length === 0}
        variant={variant}
        size={size}
        className={className}
      >
        {isDownloading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Descargando {downloadedCount}/{fotoIds.length}...
          </>
        ) : (
          <>
            <FileArchive className="h-4 w-4 mr-2" />
            Descargar {fotoIds.length} {fotoIds.length === 1 ? 'foto' : 'fotos'}
          </>
        )}
      </Button>

      {isDownloading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {downloadedCount}/{fotoIds.length} fotos descargadas
          </p>
        </div>
      )}
    </div>
  );
}
