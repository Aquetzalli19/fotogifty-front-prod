"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";

interface ImageUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  placeholder?: string;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  onUpload?: (file: File) => Promise<string>;
}

export function ImageUploader({
  value,
  onChange,
  label = "Imagen",
  placeholder = "URL de la imagen o arrastra un archivo",
  accept = "image/jpeg,image/png,image/webp",
  maxSizeMB = 5,
  disabled = false,
  onUpload,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState(value || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = (file: File): string | null => {
    const allowedTypes = accept.split(",").map((t) => t.trim());
    if (!allowedTypes.includes(file.type)) {
      return `Tipo de archivo no permitido. Use: ${allowedTypes.join(", ")}`;
    }
    if (file.size > maxSizeBytes) {
      return `El archivo es muy grande. Máximo: ${maxSizeMB}MB`;
    }
    return null;
  };

  const handleFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      if (onUpload) {
        const url = await onUpload(file);
        onChange(url);
        setUrlInput(url);
      } else {
        // If no upload handler, create a local blob URL (for preview only)
        const url = URL.createObjectURL(file);
        onChange(url);
        setUrlInput(url);
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Error al subir la imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [disabled]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrlInput(newUrl);
    setError(null);
  };

  const handleUrlBlur = () => {
    onChange(urlInput || null);
  };

  const handleClear = () => {
    onChange(null);
    setUrlInput("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>

      {/* Preview */}
      {value && (
        <div className="relative w-full h-40 rounded-lg overflow-hidden bg-muted border">
          <Image
            src={value}
            alt="Preview"
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 400px"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Subiendo imagen...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 rounded-full bg-muted">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Arrastra una imagen aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG o WebP (máx. {maxSizeMB}MB)
            </p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* URL Input */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="url"
            value={urlInput}
            onChange={handleUrlChange}
            onBlur={handleUrlBlur}
            placeholder={placeholder}
            disabled={disabled || isUploading}
          />
        </div>
        {urlInput && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Error */}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
