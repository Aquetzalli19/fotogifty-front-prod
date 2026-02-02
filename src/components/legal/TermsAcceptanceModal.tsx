"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle2, Loader2, X, FileText } from "lucide-react";
import { LegalDocument } from "@/interfaces/legal-documents";

interface TermsAcceptanceModalProps {
  isOpen: boolean;
  onAccept: () => Promise<void>;
  onCancel?: () => void;
  termsDocument: LegalDocument | null;
  previousVersion: string | null;
  isBlocking?: boolean;
  isLoading?: boolean;
}

export default function TermsAcceptanceModal({
  isOpen,
  onAccept,
  onCancel,
  termsDocument,
  previousVersion,
  isBlocking = false,
  isLoading = false,
}: TermsAcceptanceModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasAcceptedCheckbox, setHasAcceptedCheckbox] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Reset estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false);
      setHasAcceptedCheckbox(false);
      setError(null);
    }
  }, [isOpen]);

  // Verificar si el contenido es lo suficientemente corto para no necesitar scroll
  useEffect(() => {
    if (isOpen && scrollAreaRef.current) {
      const element = scrollAreaRef.current;
      const needsScroll = element.scrollHeight > element.clientHeight + 10;

      if (!needsScroll) {
        setHasScrolledToBottom(true);
      }
    }
  }, [isOpen, termsDocument]);

  // Detectar scroll al final
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const scrollBottom = element.scrollHeight - element.scrollTop - element.clientHeight;

    if (scrollBottom < 10 && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  // Manejar aceptación
  const handleAccept = async () => {
    if (!hasScrolledToBottom || !hasAcceptedCheckbox) {
      setError('Debes leer completamente los términos y marcar la casilla de aceptación');
      return;
    }

    setIsAccepting(true);
    setError(null);

    try {
      await onAccept();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al aceptar términos';
      setError(errorMessage);
      console.error('Error al aceptar términos:', err);
    } finally {
      setIsAccepting(false);
    }
  };

  // Manejar cierre
  const handleClose = () => {
    if (isBlocking) {
      setError('Debes aceptar los términos para continuar');
      return;
    }

    if (onCancel) {
      onCancel();
    }
  };

  if (!isOpen || !termsDocument) {
    return null;
  }

  const isNewVersion = previousVersion && previousVersion !== termsDocument.version;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-border animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-6 sm:p-8 border-b bg-muted/30">
          <div className="flex-1 flex items-start gap-3">
            <div className="mt-1">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                {isNewVersion ? 'Nuevos Términos y Condiciones' : 'Términos y Condiciones'}
              </h2>
              <div className="mt-2">
                {isNewVersion && previousVersion ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span>
                      Actualización: <span className="font-semibold">v{previousVersion}</span> → <span className="font-semibold text-primary">v{termsDocument.version}</span>
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Versión {termsDocument.version}</span>
                )}
              </div>
            </div>
          </div>

          {!isBlocking && onCancel && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="ml-4 hover:bg-muted"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Advertencia de nueva versión */}
        {isNewVersion && (
          <div className="mx-6 sm:mx-8 mt-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900 dark:text-yellow-200 text-sm">
                    Términos actualizados
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                    Hemos actualizado nuestros términos y condiciones. Por favor, revisa los cambios cuidadosamente antes de continuar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contenido scrollable */}
        <div
          ref={scrollAreaRef}
          className="flex-1 px-6 sm:px-8 py-6 overflow-y-auto"
          onScroll={handleScroll}
          style={{ maxHeight: 'calc(92vh - 300px)' }}
        >
          {/* Título del documento */}
          <h3 className="text-xl font-bold text-foreground mb-6 pb-4 border-b">
            {termsDocument.title}
          </h3>

          {/* Contenido de los términos - Renderiza HTML */}
          <div
            className="prose prose-sm sm:prose-base max-w-none dark:prose-invert
                       prose-headings:text-foreground prose-headings:font-bold
                       prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
                       prose-strong:text-foreground prose-strong:font-semibold
                       prose-ul:text-muted-foreground prose-ol:text-muted-foreground
                       prose-li:mb-2 prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: termsDocument.content }}
          />

          {/* Indicador de scroll */}
          {!hasScrolledToBottom && (
            <div className="sticky bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background via-background to-transparent pointer-events-none flex items-end justify-center pb-3">
              <div className="bg-primary/10 px-4 py-2 rounded-full">
                <span className="text-xs font-medium text-primary animate-bounce inline-flex items-center gap-1">
                  ↓ Desplázate para continuar ↓
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-muted/20 p-6 sm:p-8 space-y-4">
          {/* Checkbox de aceptación */}
          <div className="flex items-start gap-3 p-4 rounded-lg border bg-background">
            <Checkbox
              id="accept-terms"
              checked={hasAcceptedCheckbox}
              onCheckedChange={(checked) => setHasAcceptedCheckbox(checked === true)}
              disabled={!hasScrolledToBottom || isAccepting || isLoading}
              className="mt-1"
            />
            <label
              htmlFor="accept-terms"
              className={`text-sm sm:text-base leading-relaxed cursor-pointer select-none flex-1 ${
                !hasScrolledToBottom ? 'text-muted-foreground' : 'text-foreground'
              }`}
            >
              He leído y acepto los términos y condiciones
              {termsDocument.version && (
                <span className="font-semibold"> (versión {termsDocument.version})</span>
              )}
            </label>
          </div>

          {/* Mensajes de estado */}
          {!hasScrolledToBottom && (
            <div className="flex items-center gap-3 text-sm bg-muted p-3 rounded-lg">
              <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">
                Debes leer completamente los términos antes de poder aceptarlos
              </span>
            </div>
          )}

          {hasScrolledToBottom && !hasAcceptedCheckbox && (
            <div className="flex items-center gap-3 text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-blue-700 dark:text-blue-300">
                Ahora puedes marcar la casilla para aceptar los términos
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {!isBlocking && onCancel && (
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isAccepting || isLoading}
                className="flex-1 h-11 sm:h-12"
              >
                Cancelar
              </Button>
            )}

            <Button
              onClick={handleAccept}
              disabled={!hasScrolledToBottom || !hasAcceptedCheckbox || isAccepting || isLoading}
              className={`flex-1 h-11 sm:h-12 font-semibold ${isBlocking ? 'w-full' : ''}`}
            >
              {(isAccepting || isLoading) && (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              )}
              {isAccepting || isLoading ? 'Aceptando términos...' : 'Aceptar y Continuar'}
            </Button>
          </div>

          {/* Advertencia de bloqueo */}
          {isBlocking && (
            <p className="text-xs text-center text-muted-foreground pt-2">
              Debes aceptar los términos para poder realizar pedidos
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
