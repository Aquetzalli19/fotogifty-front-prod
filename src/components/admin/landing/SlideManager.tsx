"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  GripVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
} from "lucide-react";
import { LandingSlide, SectionKey, SlideType } from "@/interfaces/landing-content";
import { AddSlideDialog } from "./AddSlideDialog";
import { EditSlideDialog } from "./EditSlideDialog";
import { DeleteSlideDialog } from "./DeleteSlideDialog";
import Image from "next/image";

interface SlideManagerProps {
  slides: LandingSlide[];
  sectionKey: SectionKey;
  slideType: SlideType;
  maxSlides?: number;
  onAdd: (data: { titulo?: string; descripcion?: string; imagenUrl: string }) => Promise<void>;
  onUpdate: (id: number, data: Partial<LandingSlide>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onReorder: (ids: number[]) => Promise<void>;
  onUploadImage?: (file: File) => Promise<string>;
  disabled?: boolean;
}

export function SlideManager({
  slides,
  sectionKey,
  slideType,
  maxSlides,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
  onUploadImage,
  disabled = false,
}: SlideManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState<LandingSlide | null>(null);

  const sortedSlides = [...slides].sort((a, b) => a.orden - b.orden);
  const canAddMore = !maxSlides || slides.length < maxSlides;

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    const newOrder = sortedSlides.map((s) => s.id);
    [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    await onReorder(newOrder);
  };

  const handleMoveDown = async (index: number) => {
    if (index >= sortedSlides.length - 1) return;
    const newOrder = sortedSlides.map((s) => s.id);
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    await onReorder(newOrder);
  };

  const handleEdit = (slide: LandingSlide) => {
    setSelectedSlide(slide);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (slide: LandingSlide) => {
    setSelectedSlide(slide);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleActive = async (slide: LandingSlide) => {
    await onUpdate(slide.id, { activo: !slide.activo });
  };

  const getSlideTypeLabel = () => {
    switch (slideType) {
      case "hero_slide":
        return "Slide del Hero";
      case "product_slide":
        return "Slide de Producto";
      case "collage_image":
        return "Imagen del Collage";
      default:
        return "Slide";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">Slides</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {slides.length} de {maxSlides || "∞"} {getSlideTypeLabel()}s
          </p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          size="sm"
          disabled={disabled || !canAddMore}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </CardHeader>
      <CardContent>
        {sortedSlides.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No hay slides</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setIsAddDialogOpen(true)}
              disabled={disabled}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar primer slide
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedSlides.map((slide, index) => (
              <div
                key={slide.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  slide.activo ? "bg-background" : "bg-muted/50 opacity-60"
                }`}
              >
                {/* Grip handle */}
                <div className="text-muted-foreground cursor-move">
                  <GripVertical className="h-5 w-5" />
                </div>

                {/* Thumbnail */}
                <div className="relative w-16 h-16 rounded overflow-hidden bg-muted shrink-0">
                  <Image
                    src={slide.imagenUrl}
                    alt={slide.titulo || `Slide ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {slide.titulo || `Slide ${index + 1}`}
                    </span>
                    {!slide.activo && (
                      <Badge variant="secondary" className="text-xs">
                        Oculto
                      </Badge>
                    )}
                  </div>
                  {slide.descripcion && (
                    <p className="text-xs text-muted-foreground truncate">
                      {slide.descripcion}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Orden: {slide.orden}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMoveUp(index)}
                    disabled={disabled || index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMoveDown(index)}
                    disabled={disabled || index === sortedSlides.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleToggleActive(slide)}
                    disabled={disabled}
                  >
                    {slide.activo ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(slide)}
                    disabled={disabled}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(slide)}
                    disabled={disabled}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Dialogs */}
      <AddSlideDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        slideType={slideType}
        onAdd={onAdd}
        onUploadImage={onUploadImage}
      />

      <EditSlideDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        slide={selectedSlide}
        onUpdate={onUpdate}
        onUploadImage={onUploadImage}
      />

      <DeleteSlideDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        slide={selectedSlide}
        onDelete={onDelete}
      />
    </Card>
  );
}
