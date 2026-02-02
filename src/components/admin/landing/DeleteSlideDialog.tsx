"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LandingSlide } from "@/interfaces/landing-content";
import { Loader2 } from "lucide-react";

interface DeleteSlideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slide: LandingSlide | null;
  onDelete: (id: number) => Promise<void>;
}

export function DeleteSlideDialog({
  open,
  onOpenChange,
  slide,
  onDelete,
}: DeleteSlideDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!slide) return;

    setIsDeleting(true);
    try {
      await onDelete(slide.id);
      onOpenChange(false);
    } catch (err) {
      console.error("Error deleting slide:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getSlideTypeName = () => {
    switch (slide?.tipo) {
      case "hero_slide":
        return "slide del hero";
      case "product_slide":
        return "slide de producto";
      case "collage_image":
        return "imagen del collage";
      default:
        return "slide";
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Slide</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que quieres eliminar este {getSlideTypeName()}
            {slide?.titulo && ` "${slide.titulo}"`}? Esta acción no se puede
            deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
