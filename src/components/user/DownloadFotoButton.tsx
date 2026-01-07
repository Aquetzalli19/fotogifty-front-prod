"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, CheckCircle2, AlertCircle, Lock } from "lucide-react";
import { descargarFoto, FotoMetadata } from "@/services/fotos";
import { useToast } from "@/hooks/useToast";
import { useAuthStore } from "@/stores/auth-store";

interface DownloadFotoButtonProps {
  fotoId: number;
  nombreArchivo?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showMetadata?: boolean; // Mostrar metadata después de descargar
  onDownloadComplete?: (metadata: FotoMetadata) => void;
}

export default function DownloadFotoButton({
  fotoId,
  nombreArchivo,
  variant = "outline",
  size = "sm",
  className = "",
  showMetadata = false,
  onDownloadComplete
}: DownloadFotoButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [metadata, setMetadata] = useState<FotoMetadata | null>(null);
  const { success, error } = useToast();
  const { user } = useAuthStore();

  // VERIFICACIÓN DE PERMISOS: Solo admin y store pueden descargar fotos
  const canDownload = user?.tipo === 'admin' ||
                      user?.tipo === 'super_admin' ||
                      user?.tipo === 'store';

  // Si el usuario no tiene permisos, no mostrar el botón
  if (!canDownload) {
    return null;
  }

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      const result = await descargarFoto(fotoId, nombreArchivo);

      setDownloadSuccess(true);
      setMetadata(result.metadata);

      success(`Foto descargada: ${result.filename}`, 3000);

      if (onDownloadComplete) {
        onDownloadComplete(result.metadata);
      }

      // Resetear estado de éxito después de 2 segundos
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Error al descargar foto:", err);
      error("Error al descargar la foto. Inténtalo de nuevo.", 4000);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleDownload}
        disabled={isDownloading}
        variant={variant}
        size={size}
        className={className}
      >
        {isDownloading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Descargando...
          </>
        ) : downloadSuccess ? (
          <>
            <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
            Descargado
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </>
        )}
      </Button>

      {showMetadata && metadata && (
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
          <p className="font-semibold mb-1">Información de impresión:</p>
          <ul className="space-y-0.5">
            <li>📐 Tamaño: {metadata.anchoFisico.toFixed(2)} × {metadata.altoFisico.toFixed(2)} cm</li>
            <li>🖨️ Resolución: {metadata.resolucionDPI} DPI</li>
            <li>💾 Tamaño: {(metadata.tamanioArchivo / 1024 / 1024).toFixed(2)} MB</li>
          </ul>
        </div>
      )}
    </div>
  );
}
