"use client";

import React, { useState } from "react";
import { StoreUser } from "@/interfaces/users";
import { eliminarStoreUser } from "@/services/stores";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteStoreUserDialogProps {
  user: StoreUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserDeleted: () => void;
  onShowToast?: (message: string, type: "success" | "error") => void;
}

const DeleteStoreUserDialog: React.FC<DeleteStoreUserDialogProps> = ({
  user,
  open,
  onOpenChange,
  onUserDeleted,
  onShowToast,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!user || !user.id) {
      console.error("No user or user ID available for deletion");
      if (onShowToast) {
        onShowToast("Datos de usuario incompletos", "error");
      }
      return;
    }

    setIsDeleting(true);

    try {
      const response = await eliminarStoreUser(Number(user.id));

      if (response.success) {
        onUserDeleted();
        onOpenChange(false);
        
        if (onShowToast) {
          onShowToast("Usuario eliminado exitosamente", "success");
        }
      } else {
        const errorMsg = response.error || "Error al eliminar el usuario";
        if (onShowToast) {
          onShowToast(errorMsg, "error");
        }
      }
    } catch (error) {
      console.error("Error deleting store user:", error);
      const errorMsg = "Error al eliminar el usuario";
      if (onShowToast) {
        onShowToast(errorMsg, "error");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar Usuario de Tienda</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar al usuario <strong>{user?.nombre} {user?.apellido}</strong>? 
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { DeleteStoreUserDialog };