"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface EditorDisclaimerProps {
  /**
   * Callback que se ejecuta cuando el usuario acepta el disclaimer
   */
  onAccept: () => void;
}

/**
 * Componente de disclaimer para los editores de fotos
 *
 * Muestra un aviso legal al usuario CADA VEZ que abre el editor,
 * informándole que:
 * - FotoGifty no se hace responsable de la edición
 * - La impresión será exactamente como el preview final
 * - El cliente debe revisar su trabajo antes de enviar
 */
export default function EditorDisclaimer({ onAccept }: EditorDisclaimerProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Mostrar el disclaimer después de un pequeño delay para mejor UX
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    setIsOpen(false);
    onAccept();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
            </div>
            <DialogTitle className="text-xl">Aviso Importante</DialogTitle>
          </div>
          {/* Usar div en lugar de DialogDescription para evitar errores de HTML anidado */}
          <div className="text-muted-foreground text-sm text-left space-y-4 pt-4">
            <p className="text-base leading-relaxed">
              Antes de comenzar a editar tus fotos, por favor lee la siguiente información:
            </p>

            <div className="bg-muted/50 dark:bg-muted/20 p-4 rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  <strong>Responsabilidad del cliente:</strong> FotoGifty <strong>no se hace responsable</strong> de cómo estén editadas las fotos. Es responsabilidad del cliente asegurarse de que la edición sea de su agrado.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  <strong>Vista previa exacta:</strong> La impresión final saldrá <strong>exactamente igual</strong> a como se muestre en la vista previa del editor. Lo que ves es lo que obtendrás.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  <strong>Revisa antes de enviar:</strong> Asegúrate de revisar cuidadosamente tu trabajo antes de guardar y enviar el pedido. Una vez impreso, no se aceptan devoluciones por errores de edición.
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground italic">
              Al continuar, aceptas que has leído y comprendido esta información.
            </p>
          </div>
        </DialogHeader>

        <DialogFooter className="sm:justify-center">
          <Button
            onClick={handleAccept}
            size="lg"
            className="w-full sm:w-auto px-8"
          >
            Entendido, continuar al editor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
