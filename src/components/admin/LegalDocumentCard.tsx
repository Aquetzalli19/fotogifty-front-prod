"use client";

import { FileText, Edit, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LegalDocument } from "@/interfaces/legal-documents";
import { activarDocumentoLegal } from "@/services/legal-documents";
import { useToast } from "@/hooks/useToast";
import { useState } from "react";

interface LegalDocumentCardProps {
  document: LegalDocument;
  onEdit: (document: LegalDocument) => void;
  onDelete: (document: LegalDocument) => void;
  onActivate: () => void;
}

export function LegalDocumentCard({
  document,
  onEdit,
  onDelete,
  onActivate,
}: LegalDocumentCardProps) {
  const { success, error } = useToast();
  const [isActivating, setIsActivating] = useState(false);

  const handleActivate = async () => {
    if (document.isActive) return;

    setIsActivating(true);
    try {
      const response = await activarDocumentoLegal(document.id);
      if (response.success) {
        success("Documento activado exitosamente");
        onActivate();
      } else {
        error("Error al activar el documento");
      }
    } catch (err) {
      console.error("Error activating document:", err);
      error("Error al activar el documento");
    } finally {
      setIsActivating(false);
    }
  };

  const getTypeLabel = (type: string) => {
    return type === "terms" ? "Términos y Condiciones" : "Aviso de Privacidad";
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg break-words">{document.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {getTypeLabel(document.type)}
              </p>
            </div>
          </div>
          <Badge variant={document.isActive ? "default" : "secondary"} className="ml-2 shrink-0">
            {document.isActive ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Activo
              </>
            ) : (
              <>
                <X className="h-3 w-3 mr-1" />
                Inactivo
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Versión</p>
            <p className="font-medium">{document.version}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Última actualización</p>
            <p className="font-medium">
              {new Date(document.updatedAt).toLocaleDateString("es-MX")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(document)}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
          {!document.isActive && (
            <Button
              variant="default"
              size="sm"
              onClick={handleActivate}
              disabled={isActivating}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-1" />
              {isActivating ? "Activando..." : "Activar"}
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(document)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
