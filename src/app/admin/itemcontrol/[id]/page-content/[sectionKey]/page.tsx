"use client";

import { useCallback, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Copy, Undo2, Loader2 } from "lucide-react";
import {
  ProductPageSectionEditor,
} from "@/components/admin/product-page/ProductPageSectionEditor";
import {
  obtenerSeccionPaquetePagePorKey,
  actualizarSeccionPaquetePage,
  toggleSeccionPaquetePageActiva,
  crearSlidePaquetePage,
  actualizarSlidePaquetePage,
  eliminarSlidePaquetePage,
  reordenarSlidesPaquetePage,
  crearOpcionPaquetePage,
  actualizarOpcionPaquetePage,
  eliminarOpcionPaquetePage,
  reordenarOpcionesPaquetePage,
  subirImagenPaquetePage,
  clonarDesdeGlobal,
  eliminarSeccionPaquetePage,
} from "@/services/paquete-page-content";
import {
  ProductPageSectionKey,
  PRODUCT_PAGE_SECTION_METADATA,
} from "@/interfaces/product-page-content";

export default function PaqueteSectionEditorPage() {
  const params = useParams<{ id: string; sectionKey: string }>();
  const paqueteId = Number(params.id);
  const sectionKey = params.sectionKey as ProductPageSectionKey;
  const router = useRouter();

  const metadata = PRODUCT_PAGE_SECTION_METADATA[sectionKey];

  if (!metadata) {
    router.push(`/admin/itemcontrol/${paqueteId}/page-content`);
    return null;
  }

  return (
    <PaqueteSectionEditorWrapper paqueteId={paqueteId} sectionKey={sectionKey} />
  );
}

function PaqueteSectionEditorWrapper({
  paqueteId,
  sectionKey,
}: {
  paqueteId: number;
  sectionKey: ProductPageSectionKey;
}) {
  const router = useRouter();
  const [extraLoading, setExtraLoading] = useState(false);
  const [isInherited, setIsInherited] = useState(false);

  const loadSection = useCallback(async () => {
    const response = await obtenerSeccionPaquetePagePorKey(paqueteId, sectionKey);
    if (response.success && response.data) {
      setIsInherited(response.isInherited ?? false);
      return response.data;
    }
    return null;
  }, [paqueteId, sectionKey]);

  const updateSection = useCallback(async (data: Parameters<typeof actualizarSeccionPaquetePage>[2]) => {
    const response = await actualizarSeccionPaquetePage(paqueteId, sectionKey, data);
    return response.success;
  }, [paqueteId, sectionKey]);

  const toggleActive = useCallback(async () => {
    const response = await toggleSeccionPaquetePageActiva(paqueteId, sectionKey);
    return response.success && response.data ? response.data : null;
  }, [paqueteId, sectionKey]);

  const createSlide = useCallback(async (data: Parameters<typeof crearSlidePaquetePage>[1]) => {
    const response = await crearSlidePaquetePage(paqueteId, data);
    return response.success && response.data ? response.data : null;
  }, [paqueteId]);

  const updateSlide = useCallback(async (id: number, data: Parameters<typeof actualizarSlidePaquetePage>[2]) => {
    const response = await actualizarSlidePaquetePage(paqueteId, id, data);
    return response.success && response.data ? response.data : null;
  }, [paqueteId]);

  const deleteSlide = useCallback(async (id: number) => {
    const response = await eliminarSlidePaquetePage(paqueteId, id);
    return response.success;
  }, [paqueteId]);

  const reorderSlides = useCallback(async (sk: ProductPageSectionKey, ids: number[]) => {
    const response = await reordenarSlidesPaquetePage(paqueteId, { sectionKey: sk, ids });
    return response.success;
  }, [paqueteId]);

  const createOption = useCallback(async (data: Parameters<typeof crearOpcionPaquetePage>[1]) => {
    const response = await crearOpcionPaquetePage(paqueteId, data);
    return response.success && response.data ? response.data : null;
  }, [paqueteId]);

  const updateOption = useCallback(async (id: number, data: Parameters<typeof actualizarOpcionPaquetePage>[2]) => {
    const response = await actualizarOpcionPaquetePage(paqueteId, id, data);
    return response.success && response.data ? response.data : null;
  }, [paqueteId]);

  const deleteOption = useCallback(async (id: number) => {
    const response = await eliminarOpcionPaquetePage(paqueteId, id);
    return response.success;
  }, [paqueteId]);

  const reorderOptions = useCallback(async (sk: ProductPageSectionKey, ids: number[]) => {
    const response = await reordenarOpcionesPaquetePage(paqueteId, { sectionKey: sk, ids });
    return response.success;
  }, [paqueteId]);

  const uploadImage = useCallback(async (sk: ProductPageSectionKey, imageType: 'main' | 'slide', file: File) => {
    const response = await subirImagenPaquetePage(paqueteId, sk, imageType, file);
    return response.success && response.data ? response.data.url : null;
  }, [paqueteId]);

  const handleCloneFromGlobal = async () => {
    setExtraLoading(true);
    try {
      const response = await clonarDesdeGlobal(paqueteId, [sectionKey]);
      if (response.success) {
        // Reload the page to pick up the cloned data
        router.refresh();
        window.location.reload();
      }
    } finally {
      setExtraLoading(false);
    }
  };

  const handleRevertToGlobal = async () => {
    setExtraLoading(true);
    try {
      const response = await eliminarSeccionPaquetePage(paqueteId, sectionKey);
      if (response.success) {
        router.push(`/admin/itemcontrol/${paqueteId}/page-content`);
      }
    } finally {
      setExtraLoading(false);
    }
  };

  return (
    <ProductPageSectionEditor
      sectionKey={sectionKey}
      backHref={`/admin/itemcontrol/${paqueteId}/page-content`}
      loadSection={loadSection}
      updateSection={updateSection}
      toggleActive={toggleActive}
      createSlide={createSlide}
      updateSlide={updateSlide}
      deleteSlide={deleteSlide}
      reorderSlides={reorderSlides}
      createOption={createOption}
      updateOption={updateOption}
      deleteOption={deleteOption}
      reorderOptions={reorderOptions}
      uploadImage={uploadImage}
      isInherited={isInherited}
      extraActions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleCloneFromGlobal}
            disabled={extraLoading}
          >
            {extraLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
            Clonar desde Global
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-destructive hover:text-destructive"
            onClick={handleRevertToGlobal}
            disabled={extraLoading}
          >
            <Undo2 className="h-3.5 w-3.5" />
            Revertir a Global
          </Button>
        </div>
      }
    />
  );
}
