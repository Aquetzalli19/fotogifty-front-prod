"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, RefreshCw, Copy, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PerProductSectionCard } from "@/components/admin/product-page/PerProductSectionCard";
import {
  obtenerEstadoOverrides,
  clonarDesdeGlobal,
  eliminarSeccionPaquetePage,
  SectionOverrideStatus,
} from "@/services/paquete-page-content";
import { obtenerPaquetePorId, Paquete } from "@/services/packages";
import {
  ProductPageSectionKey,
  PRODUCT_PAGE_SECTION_METADATA,
} from "@/interfaces/product-page-content";
import { PRODUCT_PAGE_SECTION_ORDER } from "@/lib/product-page-defaults";
import { useToast } from "@/hooks/useToast";
import { Toast, ToastContainer } from "@/components/ui/toast";
import Link from "next/link";

export default function PaquetePageContentPage() {
  const params = useParams<{ id: string }>();
  const paqueteId = Number(params.id);

  const [paquete, setPaquete] = useState<Paquete | null>(null);
  const [overrides, setOverrides] = useState<SectionOverrideStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const { toasts, removeToast, success, error } = useToast();

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [paqueteRes, statusRes] = await Promise.all([
        obtenerPaquetePorId(paqueteId),
        obtenerEstadoOverrides(paqueteId),
      ]);

      if (paqueteRes.success && paqueteRes.data) {
        setPaquete(paqueteRes.data as unknown as Paquete);
      }

      if (statusRes.success && statusRes.data) {
        setOverrides(statusRes.data);
      } else {
        // If backend doesn't have the endpoint yet, assume all sections are global
        setOverrides(
          PRODUCT_PAGE_SECTION_ORDER.map(key => ({
            sectionKey: key,
            hasOverride: false,
          }))
        );
      }
    } catch (err) {
      console.error("Error loading paquete page content:", err);
      // Fallback: show all as global
      setOverrides(
        PRODUCT_PAGE_SECTION_ORDER.map(key => ({
          sectionKey: key,
          hasOverride: false,
        }))
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [paqueteId]);

  useEffect(() => {
    if (paqueteId) {
      loadData();
    }
  }, [paqueteId, loadData]);

  const handleClone = async (sectionKey: ProductPageSectionKey) => {
    setActionLoading(true);
    try {
      const response = await clonarDesdeGlobal(paqueteId, [sectionKey]);
      if (response.success) {
        success(`Sección "${PRODUCT_PAGE_SECTION_METADATA[sectionKey].name}" clonada desde global`);
        await loadData(true);
      } else {
        error(response.error || "Error al clonar sección");
      }
    } catch {
      error("Error al clonar sección");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevert = async (sectionKey: ProductPageSectionKey) => {
    setActionLoading(true);
    try {
      const response = await eliminarSeccionPaquetePage(paqueteId, sectionKey);
      if (response.success) {
        success(`Sección "${PRODUCT_PAGE_SECTION_METADATA[sectionKey].name}" revertida a global`);
        await loadData(true);
      } else {
        error(response.error || "Error al revertir sección");
      }
    } catch {
      error("Error al revertir sección");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloneAll = async () => {
    setActionLoading(true);
    try {
      const response = await clonarDesdeGlobal(paqueteId);
      if (response.success) {
        success("Todas las secciones clonadas desde global");
        await loadData(true);
      } else {
        error(response.error || "Error al clonar secciones");
      }
    } catch {
      error("Error al clonar secciones");
    } finally {
      setActionLoading(false);
    }
  };

  const overrideMap = new Map(overrides.map(o => [o.sectionKey, o.hasOverride]));
  const customCount = overrides.filter(o => o.hasOverride).length;

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
          <div className="flex items-center gap-4">
            <Link href="/admin/itemcontrol">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-3">
                <ShoppingBag className="h-7 w-7" />
                Contenido de Página
              </h1>
              {paquete && (
                <p className="text-sm text-muted-foreground mt-1">
                  Paquete: <strong>{paquete.nombre}</strong>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleCloneAll}
              disabled={actionLoading || isRefreshing}
              className="gap-2 text-sm"
            >
              <Copy className="h-4 w-4" />
              Clonar Todo desde Global
            </Button>
            <Button
              onClick={() => loadData(true)}
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
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4">
          <div className="bg-muted/50 rounded-lg px-4 py-2">
            <span className="text-sm text-muted-foreground">Total secciones:</span>
            <span className="ml-2 font-semibold">{PRODUCT_PAGE_SECTION_ORDER.length}</span>
          </div>
          <div className="bg-green-500/10 rounded-lg px-4 py-2">
            <span className="text-sm text-green-700 dark:text-green-400">
              Personalizadas:
            </span>
            <span className="ml-2 font-semibold text-green-700 dark:text-green-400">
              {customCount}
            </span>
          </div>
          <div className="bg-gray-500/10 dark:bg-gray-400/10 rounded-lg px-4 py-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Heredadas (global):
            </span>
            <span className="ml-2 font-semibold text-gray-600 dark:text-gray-400">
              {PRODUCT_PAGE_SECTION_ORDER.length - customCount}
            </span>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRODUCT_PAGE_SECTION_ORDER.map((key) => (
              <PerProductSectionCard
                key={key}
                sectionKey={key}
                hasOverride={overrideMap.get(key) ?? false}
                paqueteId={paqueteId}
                onClone={handleClone}
                onRevert={handleRevert}
                isLoading={actionLoading}
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
              Cada sección puede ser <strong>personalizada</strong> para este paquete o <strong>heredar</strong> el contenido global
            </li>
            <li>
              <strong>Clonar desde Global</strong> copia el contenido global como punto de partida para personalizar
            </li>
            <li>
              <strong>Revertir a Global</strong> elimina la personalización y vuelve a usar el contenido global
            </li>
            <li>
              El contenido global se gestiona en{" "}
              <Link href="/admin/product-page-content" className="underline font-medium">
                Contenido &gt; Página de Producto
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
