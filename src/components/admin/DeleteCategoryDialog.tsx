"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { eliminarCategoria, type Categoria } from "@/services/categories";

interface DeleteCategoryDialogProps {
  category: Categoria | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryDeleted: () => void;
  onShowToast: (message: string, type: "success" | "error") => void;
}

export function DeleteCategoryDialog({
  category,
  open,
  onOpenChange,
  onCategoryDeleted,
  onShowToast,
}: DeleteCategoryDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!category) return;

    console.log('Intentando eliminar categoría:', category);
    setIsLoading(true);

    try {
      console.log('Llamando a eliminarCategoria con ID:', category.id);
      const response = await eliminarCategoria(category.id);
      console.log('Respuesta de eliminación:', response);

      if (response.success) {
        onShowToast(`Categoría "${category.nombre}" eliminada exitosamente`, "success");
        onCategoryDeleted();
        onOpenChange(false);
      } else {
        console.error('Error en respuesta:', response);
        onShowToast("Error al eliminar la categoría", "error");
      }
    } catch (err) {
      console.error("Error deleting category:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Error al eliminar la categoría";
      onShowToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 dark:bg-red-950/20 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle>Eliminar categoría</DialogTitle>
          </div>
          <DialogDescription className="pt-4">
            ¿Estás seguro de que deseas eliminar la categoría{" "}
            <span className="font-semibold text-foreground">
              "{category?.nombre}"
            </span>
            ?
            <br />
            <br />
            Esta acción no se puede deshacer. La categoría será eliminada permanentemente.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
