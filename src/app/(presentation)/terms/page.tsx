"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import { obtenerDocumentoLegalActivo } from "@/services/legal-documents";
import { LegalDocument } from "@/interfaces/legal-documents";
import { Loader2 } from "lucide-react";

export default function TermsPage() {
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await obtenerDocumentoLegalActivo('terms');
        if (response.success && response.data) {
          setDocument(response.data);
        } else {
          setError('No se encontraron términos y condiciones');
        }
      } catch (err) {
        console.error('Error al cargar términos y condiciones:', err);
        setError('Error al cargar el documento');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold mb-4">Términos y Condiciones</h1>
        <p className="text-muted-foreground mb-6">{error || 'Documento no disponible'}</p>
        <Link href="/" className="text-primary underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-primary hover:underline mb-6 inline-block">
          ← Volver al inicio
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold mb-2">{document.title}</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Versión {document.version} - Última actualización: {new Date(document.updatedAt).toLocaleDateString('es-MX')}
        </p>

        <div
          className="prose prose-slate dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(document.content) }}
        />
      </div>
    </div>
  );
}
