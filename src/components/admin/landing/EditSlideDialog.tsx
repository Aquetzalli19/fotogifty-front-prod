"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "./ImageUploader";
import { LandingSlide } from "@/interfaces/landing-content";
import { Loader2 } from "lucide-react";

interface EditSlideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slide: LandingSlide | null;
  onUpdate: (id: number, data: Partial<LandingSlide>) => Promise<void>;
  onUploadImage?: (file: File) => Promise<string>;
}

export function EditSlideDialog({
  open,
  onOpenChange,
  slide,
  onUpdate,
  onUploadImage,
}: EditSlideDialogProps) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagenUrl, setImagenUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load slide data when dialog opens
  useEffect(() => {
    if (slide && open) {
      setTitulo(slide.titulo || "");
      setDescripcion(slide.descripcion || "");
      setImagenUrl(slide.imagenUrl);
    }
  }, [slide, open]);

  const showTitleField = slide?.tipo === "product_slide";
  const showDescriptionField = slide?.tipo === "product_slide";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slide) return;

    setError(null);

    if (!imagenUrl) {
      setError("La imagen es requerida");
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdate(slide.id, {
        titulo: titulo || null,
        descripcion: descripcion || null,
        imagenUrl,
      });
      handleClose();
    } catch (err) {
      console.error("Error updating slide:", err);
      setError("Error al actualizar el slide");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitulo("");
    setDescripcion("");
    setImagenUrl(null);
    setError(null);
    onOpenChange(false);
  };

  const getDialogTitle = () => {
    switch (slide?.tipo) {
      case "hero_slide":
        return "Editar Slide del Hero";
      case "product_slide":
        return "Editar Slide de Producto";
      case "collage_image":
        return "Editar Imagen del Collage";
      default:
        return "Editar Slide";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ImageUploader
            value={imagenUrl}
            onChange={setImagenUrl}
            label="Imagen *"
            onUpload={onUploadImage}
          />

          {showTitleField && (
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Título del producto"
                maxLength={255}
              />
            </div>
          )}

          {showDescriptionField && (
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción del producto"
                maxLength={500}
                rows={3}
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !imagenUrl}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
