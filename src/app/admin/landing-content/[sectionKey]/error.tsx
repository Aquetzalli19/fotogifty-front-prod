"use client";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("[DEBUG] Error en SectionEditorPage:", error);

  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Error al cargar el editor</h2>
      <p className="text-gray-700 mb-2">{error.message}</p>
      <pre className="text-left bg-gray-100 p-4 rounded text-sm overflow-auto max-w-2xl mx-auto mb-4">
        {error.stack}
      </pre>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
