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
import { eliminarDocumentoLegal } from "@/services/legal-documents";
import { LegalDocument } from "@/interfaces/legal-documents";
import { useToast } from "@/hooks/useToast";
import { Loader2, AlertTriangle } from "lucide-react";

interface DeleteLegalDocumentDialogProps {
  document: LegalDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentDeleted: () => void;
}

export function DeleteLegalDocumentDialog({
  document,
  open,
  onOpenChange,
  onDocumentDeleted,
}: DeleteLegalDocumentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();

  const handleDelete = async () => {
    if (!document) return;

    setIsLoading(true);
    try {
      const response = await eliminarDocumentoLegal(document.id);

      if (response.success) {
        success("Documento eliminado exitosamente");
        onOpenChange(false);
        onDocumentDeleted();
      } else {
        error("Error al eliminar el documento");
      }
    } catch (err) {
      console.error("Error deleting document:", err);
      error("Error al eliminar el documento");
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    return type === "terms" ? "Términos y Condiciones" : "Aviso de Privacidad";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle>Eliminar Documento</DialogTitle>
              <DialogDescription className="mt-1">
                Esta acción no se puede deshacer
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {document && (
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de que deseas eliminar el siguiente documento?
            </p>
            <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
              <p className="font-semibold">{document.title}</p>
              <p className="text-sm text-muted-foreground">
                Tipo: {getTypeLabel(document.type)}
              </p>
              <p className="text-sm text-muted-foreground">
                Versión: {document.version}
              </p>
              {document.isActive && (
                <p className="text-sm text-destructive font-medium">
                  ⚠ Este documento está actualmente activo
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
