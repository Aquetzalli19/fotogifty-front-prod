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
import { LandingOption } from "@/interfaces/landing-content";
import { Loader2 } from "lucide-react";

interface EditOptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  option: LandingOption | null;
  onUpdate: (id: number, data: Partial<LandingOption>) => Promise<void>;
}

export function EditOptionDialog({
  open,
  onOpenChange,
  option,
  onUpdate,
}: EditOptionDialogProps) {
  const [texto, setTexto] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load option data when dialog opens
  useEffect(() => {
    if (option && open) {
      setTexto(option.texto);
    }
  }, [option, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!option) return;

    setError(null);

    const trimmedTexto = texto.trim();
    if (!trimmedTexto) {
      setError("El texto es requerido");
      return;
    }

    if (trimmedTexto.length > 255) {
      setError("El texto no puede tener más de 255 caracteres");
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdate(option.id, { texto: trimmedTexto });
      handleClose();
    } catch (err) {
      console.error("Error updating option:", err);
      setError("Error al actualizar la opción");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTexto("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Editar Opción</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="texto">Texto de la opción *</Label>
            <Input
              id="texto"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ej: Pack 50 Prints 4x6"
              maxLength={255}
              autoFocus
            />
          </div>

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
            <Button type="submit" disabled={isSubmitting || !texto.trim()}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
