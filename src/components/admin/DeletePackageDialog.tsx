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
import { eliminarPaquete } from "@/services/packages";
import { itemPackages } from "@/interfaces/admi-items";

interface DeletePackageDialogProps {
  package: itemPackages | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPackageDeleted: () => void;
  onShowToast: (message: string, type: "success" | "error") => void;
}

export function DeletePackageDialog({
  package: pkg,
  open,
  onOpenChange,
  onPackageDeleted,
  onShowToast,
}: DeletePackageDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!pkg) return;

    setIsLoading(true);

    try {
      const response = await eliminarPaquete(pkg.id);

      if (response.success) {
        onShowToast(`Paquete "${pkg.packageName}" eliminado exitosamente`, "success");
        onPackageDeleted();
        onOpenChange(false);
      } else {
        onShowToast("Error al eliminar el paquete", "error");
      }
    } catch (err) {
      console.error("Error deleting package:", err);
      onShowToast("Error al eliminar el paquete", "error");
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
            <DialogTitle>Eliminar paquete</DialogTitle>
          </div>
          <DialogDescription className="pt-4">
            ¿Estás seguro de que deseas eliminar el paquete{" "}
            <span className="font-semibold text-foreground">
              "{pkg?.packageName}"
            </span>
            ?
            <br />
            <br />
            Esta acción cambiará el estado del paquete a inactivo.
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
