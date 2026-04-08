"use client";

import { useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ProductPageSectionEditor,
} from "@/components/admin/product-page/ProductPageSectionEditor";
import {
  obtenerSeccionProductPagePorKey,
  actualizarSeccionProductPage,
  toggleSeccionProductPageActiva,
  crearSlideProductPage,
  actualizarSlideProductPage,
  eliminarSlideProductPage,
  reordenarSlidesProductPage,
  crearOpcionProductPage,
  actualizarOpcionProductPage,
  eliminarOpcionProductPage,
  reordenarOpcionesProductPage,
  subirImagenProductPage,
} from "@/services/product-page-content";
import {
  ProductPageSectionKey,
  PRODUCT_PAGE_SECTION_METADATA,
} from "@/interfaces/product-page-content";

export default function ProductPageSectionEditorPage() {
  const params = useParams<{ sectionKey: string }>();
  const sectionKey = params.sectionKey as ProductPageSectionKey;
  const router = useRouter();

  const metadata = PRODUCT_PAGE_SECTION_METADATA[sectionKey];

  // Redirect if invalid section key
  if (!metadata) {
    router.push("/admin/product-page-content");
    return null;
  }

  return (
    <GlobalSectionEditorWrapper sectionKey={sectionKey} />
  );
}

function GlobalSectionEditorWrapper({ sectionKey }: { sectionKey: ProductPageSectionKey }) {
  const loadSection = useCallback(async () => {
    const response = await obtenerSeccionProductPagePorKey(sectionKey);
    return response.success && response.data ? response.data : null;
  }, [sectionKey]);

  const updateSection = useCallback(async (data: Parameters<typeof actualizarSeccionProductPage>[1]) => {
    const response = await actualizarSeccionProductPage(sectionKey, data);
    return response.success;
  }, [sectionKey]);

  const toggleActive = useCallback(async () => {
    const response = await toggleSeccionProductPageActiva(sectionKey);
    return response.success && response.data ? response.data : null;
  }, [sectionKey]);

  const createSlide = useCallback(async (data: Parameters<typeof crearSlideProductPage>[0]) => {
    const response = await crearSlideProductPage(data);
    return response.success && response.data ? response.data : null;
  }, []);

  const updateSlide = useCallback(async (id: number, data: Parameters<typeof actualizarSlideProductPage>[1]) => {
    const response = await actualizarSlideProductPage(id, data);
    return response.success && response.data ? response.data : null;
  }, []);

  const deleteSlide = useCallback(async (id: number) => {
    const response = await eliminarSlideProductPage(id);
    return response.success;
  }, []);

  const reorderSlides = useCallback(async (sk: ProductPageSectionKey, ids: number[]) => {
    const response = await reordenarSlidesProductPage({ sectionKey: sk, ids });
    return response.success;
  }, []);

  const createOption = useCallback(async (data: Parameters<typeof crearOpcionProductPage>[0]) => {
    const response = await crearOpcionProductPage(data);
    return response.success && response.data ? response.data : null;
  }, []);

  const updateOption = useCallback(async (id: number, data: Parameters<typeof actualizarOpcionProductPage>[1]) => {
    const response = await actualizarOpcionProductPage(id, data);
    return response.success && response.data ? response.data : null;
  }, []);

  const deleteOption = useCallback(async (id: number) => {
    const response = await eliminarOpcionProductPage(id);
    return response.success;
  }, []);

  const reorderOptions = useCallback(async (sk: ProductPageSectionKey, ids: number[]) => {
    const response = await reordenarOpcionesProductPage({ sectionKey: sk, ids });
    return response.success;
  }, []);

  const uploadImage = useCallback(async (sk: ProductPageSectionKey, imageType: 'main' | 'slide', file: File) => {
    const response = await subirImagenProductPage(sk, imageType, file);
    return response.success && response.data ? response.data.url : null;
  }, []);

  return (
    <ProductPageSectionEditor
      sectionKey={sectionKey}
      backHref="/admin/product-page-content"
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
    />
  );
}
