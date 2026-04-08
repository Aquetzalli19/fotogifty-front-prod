"use client";

import { useState, useEffect } from "react";
import { Loader2, ShoppingBag, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductPageSectionCard } from "@/components/admin/product-page/ProductPageSectionCard";
import {
  obtenerSeccionesProductPage,
  toggleSeccionProductPageActiva,
} from "@/services/product-page-content";
import { ProductPageSectionComplete, ProductPageSectionKey } from "@/interfaces/product-page-content";
import { useToast } from "@/hooks/useToast";
import { Toast, ToastContainer } from "@/components/ui/toast";

export default function ProductPageContentPage() {
  const [sections, setSections] = useState<ProductPageSectionComplete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { toasts, removeToast, success, error } = useToast();

  const loadSections = async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await obtenerSeccionesProductPage();
      if (response.success && response.data) {
        setSections(response.data);
      } else {
        error("Error al cargar las secciones de la página de producto");
        setSections([]);
      }
    } catch (err) {
      console.error("Error loading product page sections:", err);
      error("Error al cargar las secciones de la página de producto");
      setSections([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = async (sectionKey: ProductPageSectionKey) => {
    try {
      const response = await toggleSeccionProductPageActiva(sectionKey);
      if (response.success) {
        setSections((prev) =>
          prev.map((s) =>
            s.section.sectionKey === sectionKey
              ? {
                  ...s,
                  section: {
                    ...s.section,
                    activo: response.data?.activo ?? !s.section.activo,
                  },
                }
              : s
          )
        );
        success(response.message || "Estado actualizado");
      } else {
        error(response.error || "Error al cambiar estado de la sección");
      }
    } catch (err) {
      console.error("Error toggling section:", err);
      error("Error al cambiar estado de la sección");
    }
  };

  return (
    <>
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

      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-3">
              <ShoppingBag className="h-7 w-7" />
              Contenido Página de Producto
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Gestiona las secciones de marketing compartidas en todas las páginas de producto.
              Para personalizar secciones por producto, ve a <strong>Catálogo &gt; Paquetes &gt; [Paquete] &gt; Contenido</strong>.
            </p>
          </div>
          <Button
            onClick={() => loadSections(true)}
            variant="outline"
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4">
          <div className="bg-muted/50 rounded-lg px-4 py-2">
            <span className="text-sm text-muted-foreground">Total secciones:</span>
            <span className="ml-2 font-semibold">{sections.length}</span>
          </div>
          <div className="bg-green-500/10 rounded-lg px-4 py-2">
            <span className="text-sm text-green-700 dark:text-green-400">
              Visibles:
            </span>
            <span className="ml-2 font-semibold text-green-700 dark:text-green-400">
              {sections.filter((s) => s.section.activo).length}
            </span>
          </div>
          <div className="bg-gray-500/10 dark:bg-gray-400/10 rounded-lg px-4 py-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Ocultas:
            </span>
            <span className="ml-2 font-semibold text-gray-600 dark:text-gray-400">
              {sections.filter((s) => !s.section.activo).length}
            </span>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sections.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">
              No se encontraron secciones
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Intenta recargar la página
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map((sectionData) => (
              <ProductPageSectionCard
                key={sectionData.section.sectionKey}
                sectionData={sectionData}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}

        {/* Help Info */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
          <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
            Cómo funciona
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
            <li>
              Estas secciones son <strong>globales</strong> — se muestran en todas las páginas de producto
            </li>
            <li>
              Haz clic en <strong>Editar</strong> para modificar el contenido de cada sección
            </li>
            <li>
              Usa el <strong>toggle</strong> para mostrar u ocultar secciones
            </li>
            <li>
              Los datos específicos de cada paquete (nombre, precio, imagen) se gestionan en <strong>Catálogo &gt; Paquetes</strong>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
