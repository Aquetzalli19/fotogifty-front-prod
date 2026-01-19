"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { actualizarDocumentoLegal } from "@/services/legal-documents";
import { LegalDocument } from "@/interfaces/legal-documents";
import { useToast } from "@/hooks/useToast";
import { Loader2 } from "lucide-react";

const documentSchema = z.object({
  type: z.enum(["terms", "privacy"], {
    message: "Selecciona un tipo de documento",
  }),
  title: z.string().min(1, "El título es requerido"),
  content: z.string().min(1, "El contenido es requerido"),
  version: z.string().min(1, "La versión es requerida"),
  isActive: z.boolean(),
});

type DocumentFormData = z.infer<typeof documentSchema>;

interface EditLegalDocumentDialogProps {
  document: LegalDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentUpdated: () => void;
}

export function EditLegalDocumentDialog({
  document,
  open,
  onOpenChange,
  onDocumentUpdated,
}: EditLegalDocumentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      type: "terms",
      title: "",
      content: "",
      version: "1.0",
      isActive: false,
    },
  });

  // Actualizar el formulario cuando cambia el documento
  useEffect(() => {
    if (document) {
      form.reset({
        type: document.type,
        title: document.title,
        content: document.content,
        version: document.version,
        isActive: document.isActive,
      });
    }
  }, [document, form]);

  const onSubmit = async (data: DocumentFormData) => {
    if (!document) return;

    setIsLoading(true);
    try {
      const response = await actualizarDocumentoLegal(document.id, data);

      if (response.success) {
        success("Documento actualizado exitosamente");
        onOpenChange(false);
        onDocumentUpdated();
      } else {
        error("Error al actualizar el documento");
      }
    } catch (err) {
      console.error("Error updating document:", err);
      error("Error al actualizar el documento");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Documento Legal</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Documento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="terms">Términos y Condiciones</SelectItem>
                      <SelectItem value="privacy">Aviso de Privacidad</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Términos y Condiciones de Uso" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="version"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Versión</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 1.0, 2.1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenido (HTML)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Escribe el contenido del documento en HTML..."
                      className="min-h-[300px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Puedes usar HTML para dar formato al contenido. Ejemplo: &lt;p&gt;, &lt;h1&gt;, &lt;ul&gt;, etc.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Activar este documento</FormLabel>
                    <FormDescription>
                      Si activas este documento, se desactivarán automáticamente otros documentos del mismo tipo.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
