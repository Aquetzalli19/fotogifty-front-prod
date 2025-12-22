"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getEditorType } from "@/lib/category-utils";
import StandardEditor from "./StandardEditor";
import CalendarEditor from "@/components/editor-components/CalendarEditor";
import PolaroidEditor from "@/components/editor-components/PolaroidEditor";

/**
 * Componente interno que usa useSearchParams
 */
function EditorContent() {
  const searchParams = useSearchParams();

  // Obtener la categoría del producto desde los parámetros
  const category = searchParams.get("category") || "";

  // Detectar automáticamente el tipo de editor basado en la categoría
  const editorType = getEditorType(category);

  console.log(`Categoría: "${category}" → Editor Type: ${editorType}`);

  // Renderizar el editor apropiado
  switch (editorType) {
    case 'calendar':
      return <CalendarEditor />;

    case 'polaroid':
      return <PolaroidEditor />;

    case 'standard':
    default:
      return <StandardEditor />;
  }
}

/**
 * Página principal del editor que detecta automáticamente
 * qué tipo de editor mostrar según la categoría del producto
 */
export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Cargando editor...</p>
        </div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
