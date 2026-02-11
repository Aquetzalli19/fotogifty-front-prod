"use client";

import { useState } from 'react';
import { Upload, X, AlertCircle, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

interface TemplateUploaderProps {
  value: string | null; // URL del template actual
  onChange: (url: string, dimensions: { width: number; height: number }) => void;
  resolution?: number; // DPI default 300
  disabled?: boolean;
}

export function TemplateUploader({
  value,
  onChange,
  resolution = 300,
  disabled = false
}: TemplateUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
    widthPx: number;
    heightPx: number;
  } | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsProcessing(true);

    try {
      // Validar extensión
      if (!file.name.toLowerCase().endsWith('.png')) {
        throw new Error('Solo se permiten archivos PNG');
      }

      // Validar MIME type
      if (file.type !== 'image/png') {
        throw new Error('El archivo debe ser PNG válido');
      }

      // Validar tamaño de archivo (máximo 10MB)
      const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSizeInBytes) {
        throw new Error('El archivo no debe superar 10MB');
      }

      // Leer y calcular dimensiones
      const imgElement = document.createElement('img');
      const reader = new FileReader();

      reader.onload = (event) => {
        imgElement.onload = () => {
          const widthInches = Number((imgElement.width / resolution).toFixed(2));
          const heightInches = Number((imgElement.height / resolution).toFixed(2));

          const dims = {
            width: widthInches,
            height: heightInches,
            widthPx: imgElement.width,
            heightPx: imgElement.height
          };
          setDimensions(dims);

          // En producción, aquí subirías a S3 vía backend
          const templateUrl = event.target?.result as string;
          onChange(templateUrl, { width: widthInches, height: heightInches });
          setIsProcessing(false);
        };

        imgElement.onerror = () => {
          setError('Error al cargar la imagen. Asegúrate de que sea un PNG válido.');
          setIsProcessing(false);
        };

        imgElement.src = event.target?.result as string;
      };

      reader.onerror = () => {
        setError('Error al leer el archivo');
        setIsProcessing(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setIsProcessing(false);
    }
  };

  const handleRemove = () => {
    onChange('', { width: 0, height: 0 });
    setDimensions(null);
    setError(null);
    // Reset file input
    const input = document.getElementById('template-upload') as HTMLInputElement;
    if (input) input.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Template PNG (Plantilla Personalizada)
        </CardTitle>
        <CardDescription>
          Sube un archivo PNG que servirá como base del diseño. Las dimensiones se calcularán automáticamente a {resolution} DPI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!value ? (
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <Input
              id="template-upload"
              type="file"
              accept=".png,image/png"
              onChange={handleFileSelect}
              disabled={disabled || isProcessing}
              className="hidden"
            />
            <Label
              htmlFor="template-upload"
              className={`cursor-pointer flex flex-col items-center gap-3 ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="rounded-full bg-primary/10 p-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium block">
                  {isProcessing ? 'Procesando imagen...' : 'Haz clic para subir un PNG'}
                </span>
                <span className="text-xs text-muted-foreground block">
                  Solo archivos .png (con soporte de transparencia)
                </span>
                <span className="text-xs text-muted-foreground block">
                  Tamaño máximo: 10MB
                </span>
              </div>
            </Label>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative border rounded-lg p-4 bg-muted/20">
              <div className="flex items-start gap-4">
                <div className="relative w-32 h-32 border rounded bg-white shrink-0">
                  <Image
                    src={value}
                    alt="Template preview"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-semibold">Template cargado exitosamente</span>
                  </div>
                  {dimensions && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Dimensiones en pulgadas:</p>
                        <p className="font-medium">{dimensions.width}" × {dimensions.height}"</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Dimensiones en píxeles:</p>
                        <p className="font-medium">{dimensions.widthPx}px × {dimensions.heightPx}px</p>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <p className="text-muted-foreground">Resolución:</p>
                        <p className="font-medium">{resolution} DPI</p>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground italic">
                    Este template se usará como base para el editor. Los usuarios podrán colocar sus fotos sobre él.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemove}
                  disabled={disabled}
                  className="shrink-0"
                  title="Eliminar template"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {value && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Nota:</strong> Las dimensiones calculadas se guardarán automáticamente. No necesitas ingresar manualmente el ancho y alto.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
