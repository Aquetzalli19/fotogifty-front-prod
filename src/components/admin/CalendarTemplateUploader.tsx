"use client";

import { useState } from 'react';
import { Upload, X, AlertCircle, CheckCircle2, Calendar as CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface CalendarTemplateUploaderProps {
  value: Record<number, File | null>; // 1-12 para cada mes
  onChange: (templates: Record<number, File | null>, dimensions: { width: number; height: number }) => void;
  resolution?: number; // DPI default 300
  disabled?: boolean;
  currentTemplates?: Record<number, string>; // URLs de los templates existentes en el backend (modo edición)
}

export function CalendarTemplateUploader({
  value,
  onChange,
  resolution = 300,
  disabled = false,
  currentTemplates = {}
}: CalendarTemplateUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
    widthPx: number;
    heightPx: number;
  } | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [uploadedCount, setUploadedCount] = useState(() => {
    // Contar templates existentes al inicio
    return Object.keys(currentTemplates).length + Object.values(value).filter(f => f !== null).length;
  });

  // Cargar dimensiones de los templates existentes (ahora con URLs frescas del backend)
  useState(() => {
    const existingKeys = Object.keys(currentTemplates);
    if (existingKeys.length > 0 && !dimensions) {
      // Tomar el primer template existente para obtener dimensiones
      const firstUrl = currentTemplates[Number(existingKeys[0])];
      if (firstUrl) {
        const img = document.createElement('img');
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const widthInches = Number((img.width / resolution).toFixed(2));
          const heightInches = Number((img.height / resolution).toFixed(2));
          setDimensions({
            width: widthInches,
            height: heightInches,
            widthPx: img.width,
            heightPx: img.height
          });
        };
        img.onerror = (e) => {
          console.error('Error cargando template existente:', e);
          // Si falla, no es crítico - el backend tiene las dimensiones
        };
        img.src = firstUrl;
      }
    }
  });

  const handleFileSelect = async (monthNumber: number, file: File | null) => {
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
      const maxSizeInBytes = 10 * 1024 * 1024;
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

          // Si es el primer template, guardar dimensiones
          if (!dimensions) {
            setDimensions(dims);
          } else {
            // Verificar que las dimensiones coincidan con los demás
            if (dims.widthPx !== dimensions.widthPx || dims.heightPx !== dimensions.heightPx) {
              setError(`Las dimensiones de ${MONTH_NAMES[monthNumber - 1]} (${dims.widthPx}x${dims.heightPx}px) no coinciden con los otros templates (${dimensions.widthPx}x${dimensions.heightPx}px)`);
              setIsProcessing(false);
              return;
            }
          }

          // Guardar preview
          const dataUrl = event.target?.result as string;
          setPreviews(prev => ({ ...prev, [monthNumber]: dataUrl }));

          // Actualizar templates
          const newTemplates = { ...value, [monthNumber]: file };
          const count = Object.values(newTemplates).filter(f => f !== null).length;
          setUploadedCount(count);

          // Pasar el File object (no el data URL)
          onChange(newTemplates, { width: widthInches, height: heightInches });
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

  const handleRemove = (monthNumber: number) => {
    const newTemplates = { ...value, [monthNumber]: null };
    const count = Object.values(newTemplates).filter(f => f !== null).length;
    setUploadedCount(count);

    onChange(newTemplates, dimensions || { width: 0, height: 0 });

    setPreviews(prev => {
      const newPreviews = { ...prev };
      delete newPreviews[monthNumber];
      return newPreviews;
    });

    // Si no quedan templates, resetear dimensiones
    if (count === 0) {
      setDimensions(null);
    }

    // Reset file input
    const input = document.getElementById(`template-upload-${monthNumber}`) as HTMLInputElement;
    if (input) input.value = '';
  };

  const handleRemoveAll = () => {
    const emptyTemplates: Record<number, File | null> = {};
    for (let i = 1; i <= 12; i++) {
      emptyTemplates[i] = null;
    }
    onChange(emptyTemplates, { width: 0, height: 0 });
    setPreviews({});
    setDimensions(null);
    setUploadedCount(0);
    setError(null);

    // Reset all file inputs
    for (let i = 1; i <= 12; i++) {
      const input = document.getElementById(`template-upload-${i}`) as HTMLInputElement;
      if (input) input.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            <CardTitle>Templates de Calendario (12 Meses)</CardTitle>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        <CardDescription>
          Sube 12 templates PNG (uno por mes). Todas deben tener las mismas dimensiones a {resolution} DPI.
        </CardDescription>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Status Summary */}
          <div className={`p-3 rounded-lg border ${
            uploadedCount === 12
              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
              : uploadedCount > 0
              ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
              : 'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800'
          }`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {uploadedCount === 12 ? '✅' : uploadedCount > 0 ? '⚠️' : '📅'}
                {' '}Templates disponibles: <strong>{uploadedCount}/12</strong>
              </p>
              {uploadedCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAll}
                  disabled={disabled || isProcessing}
                >
                  <X className="h-4 w-4 mr-1" />
                  Eliminar todos
                </Button>
              )}
            </div>
            {dimensions && (
              <p className="text-xs text-muted-foreground mt-1">
                Dimensiones: {dimensions.widthPx}px × {dimensions.heightPx}px ({dimensions.width}&quot; × {dimensions.height}&quot; a {resolution} DPI)
              </p>
            )}
          </div>

          {/* Month Uploaders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 12 }, (_, i) => {
              const monthNumber = i + 1;
              const monthName = MONTH_NAMES[i];
              const hasFile = value[monthNumber] !== null;
              const preview = previews[monthNumber];
              const existingUrl = currentTemplates[monthNumber];
              const hasExisting = existingUrl && !hasFile;

              return (
                <div key={monthNumber} className="border rounded-lg p-3 space-y-2">
                  <Label className="text-sm font-medium">{monthName}</Label>

                  {!hasFile && !hasExisting ? (
                    <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                      <Input
                        id={`template-upload-${monthNumber}`}
                        type="file"
                        accept=".png,image/png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(monthNumber, file);
                        }}
                        disabled={disabled || isProcessing}
                        className="hidden"
                      />
                      <Label
                        htmlFor={`template-upload-${monthNumber}`}
                        className={`cursor-pointer flex flex-col items-center gap-2 ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Subir PNG
                        </span>
                      </Label>
                    </div>
                  ) : hasExisting ? (
                    // Mostrar template existente del backend con botón de reemplazo
                    <div className="relative border rounded-lg overflow-hidden bg-white">
                      <div className="relative w-full h-24">
                        <Image
                          src={existingUrl}
                          alt={`Template ${monthName}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="absolute top-1 right-1">
                        <Input
                          id={`template-upload-replace-${monthNumber}`}
                          type="file"
                          accept=".png,image/png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(monthNumber, file);
                          }}
                          disabled={disabled || isProcessing}
                          className="hidden"
                        />
                        <Label htmlFor={`template-upload-replace-${monthNumber}`} asChild>
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-6 w-6"
                            disabled={disabled || isProcessing}
                            title="Reemplazar template"
                          >
                            <Upload className="h-3 w-3" />
                          </Button>
                        </Label>
                      </div>
                      <div className="absolute bottom-1 left-1">
                        <div className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-medium">
                          Actual
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Mostrar template nuevo cargado
                    <div className="relative border rounded-lg overflow-hidden bg-white">
                      <div className="relative w-full h-24">
                        {preview && (
                          <Image
                            src={preview}
                            alt={`Preview ${monthName}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        )}
                      </div>
                      <div className="absolute top-1 right-1">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleRemove(monthNumber)}
                          disabled={disabled}
                          title="Eliminar template"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="absolute bottom-1 left-1">
                        <div className="bg-green-600 text-white px-2 py-0.5 rounded text-xs font-medium">
                          <CheckCircle2 className="h-3 w-3 inline mr-1" />
                          Nuevo
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {uploadedCount > 0 && uploadedCount < 12 && (
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>⚠️ Advertencia:</strong> Faltan {12 - uploadedCount} templates. Los meses sin template usarán los archivos por defecto del sistema.
              </p>
            </div>
          )}

          {uploadedCount === 12 && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>✅ Completo:</strong> Los 12 templates están listos. Las dimensiones se aplicarán automáticamente.
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
