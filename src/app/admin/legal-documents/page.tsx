"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LegalDocumentCard } from "@/components/admin/LegalDocumentCard";
import { AddLegalDocumentDialog } from "@/components/admin/AddLegalDocumentDialog";
import { EditLegalDocumentDialog } from "@/components/admin/EditLegalDocumentDialog";
import { DeleteLegalDocumentDialog } from "@/components/admin/DeleteLegalDocumentDialog";
import { obtenerTodosDocumentosLegales } from "@/services/legal-documents";
import { LegalDocument } from "@/interfaces/legal-documents";
import { useToast } from "@/hooks/useToast";
import { Toast, ToastContainer } from "@/components/ui/toast";

export default function LegalDocumentsPage() {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<LegalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "terms" | "privacy">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Estados de diálogos
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);

  // Toast notifications
  const { toasts, removeToast, success, error } = useToast();

  // Cargar documentos
  const loadDocuments = async () => {
    setIsLoading(true);

    try {
      const response = await obtenerTodosDocumentosLegales();

      if (response.success && response.data) {
        setDocuments(response.data);
        setFilteredDocuments(response.data);
      } else {
        error("Error al cargar los documentos legales");
        setDocuments([]);
        setFilteredDocuments([]);
      }
    } catch (err) {
      console.error("Error loading legal documents:", err);
      error("Error al cargar los documentos legales");
      setDocuments([]);
      setFilteredDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar documentos
  useEffect(() => {
    let result = [...documents];

    // Filtro por búsqueda
    if (searchTerm) {
      result = result.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.version.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    if (typeFilter !== "all") {
      result = result.filter((doc) => doc.type === typeFilter);
    }

    // Filtro por estado
    if (statusFilter === "active") {
      result = result.filter((doc) => doc.isActive);
    } else if (statusFilter === "inactive") {
      result = result.filter((doc) => !doc.isActive);
    }

    setFilteredDocuments(result);
  }, [searchTerm, typeFilter, statusFilter, documents]);

  // Cargar al montar
  useEffect(() => {
    loadDocuments();
  }, []);

  // Handlers
  const handleEdit = (document: LegalDocument) => {
    setSelectedDocument(document);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (document: LegalDocument) => {
    setSelectedDocument(document);
    setIsDeleteDialogOpen(true);
  };

  const handleDocumentCreated = () => {
    loadDocuments();
    success("Documento creado exitosamente");
  };

  const handleDocumentUpdated = () => {
    loadDocuments();
    success("Documento actualizado exitosamente");
  };

  const handleDocumentDeleted = () => {
    loadDocuments();
    success("Documento eliminado exitosamente");
  };

  return (
    <>
      {/* Notificaciones */}
      <ToastContainer>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>

      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">
              Documentos Legales
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Gestiona términos y condiciones y aviso de privacidad
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Nuevo Documento
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(value: "all" | "terms" | "privacy") =>
              setTypeFilter(value)
            }
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <FileText className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="terms">Términos y Condiciones</SelectItem>
              <SelectItem value="privacy">Aviso de Privacidad</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value: "all" | "active" | "inactive") =>
              setStatusFilter(value)
            }
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Contador */}
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredDocuments.length} de {documents.length}{" "}
          documentos
        </div>

        {/* Lista de documentos */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-8 sm:py-12 border-2 border-dashed rounded-lg">
            <p className="text-base sm:text-lg text-muted-foreground">
              No se encontraron documentos
            </p>
            {searchTerm || typeFilter !== "all" || statusFilter !== "all" ? (
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Intenta ajustar los filtros
              </p>
            ) : (
              <Button
                variant="outline"
                className="mt-4 text-sm sm:text-base"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear primer documento
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {filteredDocuments.map((document) => (
              <LegalDocumentCard
                key={document.id}
                document={document}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onActivate={loadDocuments}
              />
            ))}
          </div>
        )}
      </div>

      {/* Diálogos */}
      <AddLegalDocumentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onDocumentCreated={handleDocumentCreated}
      />

      <EditLegalDocumentDialog
        document={selectedDocument}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onDocumentUpdated={handleDocumentUpdated}
      />

      <DeleteLegalDocumentDialog
        document={selectedDocument}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDocumentDeleted={handleDocumentDeleted}
      />
    </>
  );
}
