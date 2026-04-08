"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Save,
  Loader2,
  Eye,
  EyeOff,
  RotateCcw,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Monitor,
} from "lucide-react";
import { SectionPreview } from "@/components/admin/product-page/SectionPreview";
import { IconPicker } from "@/components/admin/product-page/IconPicker";
import { PackageSelector } from "@/components/admin/product-page/PackageSelector";
import { ActiveToggle } from "@/components/admin/landing/ActiveToggle";
import {
  ProductPageSectionComplete,
  ProductPageSectionDTO,
  ProductPageSlide,
  ProductPageOption,
  ProductPageSectionKey,
  ProductPageSlideCreateDTO,
  ProductPageOptionCreateDTO,
  PRODUCT_PAGE_SECTION_METADATA,
} from "@/interfaces/product-page-content";
import { getDefaultProductPageSection } from "@/lib/product-page-defaults";
import { useToast } from "@/hooks/useToast";
import { Toast, ToastContainer } from "@/components/ui/toast";
import Link from "next/link";

// ============================================
// Types for service callbacks
// ============================================

export interface ProductPageSectionEditorProps {
  sectionKey: ProductPageSectionKey;
  backHref: string;
  loadSection: () => Promise<ProductPageSectionComplete | null>;
  updateSection: (data: ProductPageSectionDTO) => Promise<boolean>;
  toggleActive: () => Promise<{ activo: boolean } | null>;
  createSlide: (data: ProductPageSlideCreateDTO) => Promise<ProductPageSlide | null>;
  updateSlide: (id: number, data: Partial<ProductPageSlide>) => Promise<ProductPageSlide | null>;
  deleteSlide: (id: number) => Promise<boolean>;
  reorderSlides: (sectionKey: ProductPageSectionKey, ids: number[]) => Promise<boolean>;
  createOption: (data: ProductPageOptionCreateDTO) => Promise<ProductPageOption | null>;
  updateOption: (id: number, data: Partial<ProductPageOption>) => Promise<ProductPageOption | null>;
  deleteOption: (id: number) => Promise<boolean>;
  reorderOptions: (sectionKey: ProductPageSectionKey, ids: number[]) => Promise<boolean>;
  uploadImage: (sectionKey: ProductPageSectionKey, imageType: 'main' | 'slide', file: File) => Promise<string | null>;
  extraActions?: React.ReactNode;
  /**
   * When true, the section content is inherited (e.g. from the global CMS fallback)
   * and has no per-product override yet. Slide/option CRUD is disabled and a
   * warning banner is shown instructing the user to clone from global first.
   */
  isInherited?: boolean;
}

export function ProductPageSectionEditor({
  sectionKey,
  backHref,
  loadSection: loadSectionFn,
  updateSection: updateSectionFn,
  toggleActive: toggleActiveFn,
  createSlide: createSlideFn,
  updateSlide: updateSlideFn,
  deleteSlide: deleteSlideFn,
  reorderSlides: reorderSlidesFn,
  createOption: createOptionFn,
  updateOption: updateOptionFn,
  deleteOption: deleteOptionFn,
  reorderOptions: reorderOptionsFn,
  uploadImage: uploadImageFn,
  extraActions,
  isInherited = false,
}: ProductPageSectionEditorProps) {
  const [sectionData, setSectionData] = useState<ProductPageSectionComplete | null>(null);
  const [formValues, setFormValues] = useState<ProductPageSectionDTO>({});
  const [originalValues, setOriginalValues] = useState<ProductPageSectionDTO>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Buffered changes — slides/options edits are kept in local state and only
  // persisted to the backend when the user clicks "Guardar".
  const [dirtySlides, setDirtySlides] = useState<Record<number, Partial<ProductPageSlide>>>({});
  const [dirtyOptions, setDirtyOptions] = useState<Record<number, Partial<ProductPageOption>>>({});

  // Live preview panel (on by default)
  const [showPreview, setShowPreview] = useState(true);

  const { toasts, removeToast, success, error } = useToast();

  const metadata = PRODUCT_PAGE_SECTION_METADATA[sectionKey];

  function sectionToDTO(section: ProductPageSectionComplete["section"]): ProductPageSectionDTO {
    return {
      titulo: section.titulo,
      subtitulo: section.subtitulo,
      descripcion: section.descripcion,
      imagenPrincipalUrl: section.imagenPrincipalUrl,
      activo: section.activo,
    };
  }

  const loadSection = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await loadSectionFn();
      if (data) {
        setSectionData(data);
        const initialValues = sectionToDTO(data.section);
        setFormValues(initialValues);
        setOriginalValues(initialValues);
      } else {
        const defaultData = getDefaultProductPageSection(sectionKey);
        if (defaultData) {
          setSectionData(defaultData);
          const initialValues = sectionToDTO(defaultData.section);
          setFormValues(initialValues);
          setOriginalValues(initialValues);
        } else {
          error("Sección no encontrada");
        }
      }
      // Clear any buffered slide/option edits on reload
      setDirtySlides({});
      setDirtyOptions({});
    } catch (err) {
      console.error("Error loading section:", err);
      error("Error al cargar la sección");
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionKey]);

  useEffect(() => {
    if (metadata) {
      loadSection();
    }
  }, [metadata, loadSection]);

  useEffect(() => {
    const sectionChanged = JSON.stringify(formValues) !== JSON.stringify(originalValues);
    const slidesDirty = Object.keys(dirtySlides).length > 0;
    const optionsDirty = Object.keys(dirtyOptions).length > 0;
    setHasChanges(sectionChanged || slidesDirty || optionsDirty);
  }, [formValues, originalValues, dirtySlides, dirtyOptions]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1) Save section fields (titulo/subtitulo) if they changed
      const sectionChanged = JSON.stringify(formValues) !== JSON.stringify(originalValues);
      let sectionOk = true;
      if (sectionChanged) {
        sectionOk = await updateSectionFn(formValues);
        if (!sectionOk) {
          error("Error al guardar datos de la sección");
          return;
        }
      }

      // 2) Flush buffered slide edits
      const slideEntries = Object.entries(dirtySlides);
      let slideErrors = 0;
      for (const [idStr, data] of slideEntries) {
        const id = Number(idStr);
        const result = await updateSlideFn(id, data);
        if (!result) slideErrors++;
      }

      // 3) Flush buffered option edits
      const optionEntries = Object.entries(dirtyOptions);
      let optionErrors = 0;
      for (const [idStr, data] of optionEntries) {
        const id = Number(idStr);
        const result = await updateOptionFn(id, data);
        if (!result) optionErrors++;
      }

      if (slideErrors === 0 && optionErrors === 0) {
        setOriginalValues(formValues);
        setDirtySlides({});
        setDirtyOptions({});
        setHasChanges(false);
        success("Cambios guardados exitosamente");
        await loadSection();
      } else {
        error(`Algunos cambios no se pudieron guardar (${slideErrors + optionErrors} errores)`);
        await loadSection();
      }
    } catch (err) {
      console.error("Error saving section:", err);
      error("Error al guardar cambios");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      const result = await toggleActiveFn();
      if (result && sectionData) {
        setSectionData({
          ...sectionData,
          section: {
            ...sectionData.section,
            activo: result.activo,
          },
        });
        success(result.activo ? "Sección activada" : "Sección desactivada");
      } else if (!result) {
        error("Error al cambiar estado");
      }
    } catch (err) {
      console.error("Error toggling active:", err);
      error("Error al cambiar estado");
    }
  };

  const handleReset = async () => {
    setFormValues(originalValues);
    setDirtySlides({});
    setDirtyOptions({});
    // Reload to discard any unsaved slide/option edits from the UI
    await loadSection();
  };

  // ============================================
  // Slide handlers
  // ============================================

  const handleAddSlide = async () => {
    if (!metadata.slideType || !sectionData) return;

    const slide = await createSlideFn({
      sectionKey,
      tipo: metadata.slideType,
      titulo: 'Nuevo elemento',
    });

    if (slide) {
      setSectionData({
        ...sectionData,
        slides: [...sectionData.slides, slide],
      });
      success("Elemento agregado");
    } else {
      error("Error al agregar elemento");
    }
  };

  /**
   * Buffers slide field edits locally. Changes are not sent to the backend
   * until the user clicks "Guardar". The UI updates optimistically so typing
   * feels instant.
   */
  const handleUpdateSlide = (id: number, data: Partial<ProductPageSlide>) => {
    if (!sectionData) return;
    setSectionData({
      ...sectionData,
      slides: sectionData.slides.map((s) =>
        s.id === id ? { ...s, ...data } : s
      ),
    });
    setDirtySlides((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...data },
    }));
  };

  const handleDeleteSlide = async (id: number) => {
    const ok = await deleteSlideFn(id);

    if (ok && sectionData) {
      setSectionData({
        ...sectionData,
        slides: sectionData.slides.filter((s) => s.id !== id),
      });
      success("Elemento eliminado");
    } else {
      error("Error al eliminar elemento");
    }
  };

  const handleReorderSlide = async (index: number, direction: 'up' | 'down') => {
    if (!sectionData) return;
    const sorted = [...sectionData.slides].sort((a, b) => a.orden - b.orden);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const newOrder = sorted.map(s => s.id);
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];

    const ok = await reorderSlidesFn(sectionKey, newOrder);
    if (ok) {
      const reordered = newOrder.map((id, i) => {
        const slide = sectionData.slides.find(s => s.id === id);
        return slide ? { ...slide, orden: i + 1 } : null;
      }).filter((s): s is ProductPageSlide => s !== null);

      setSectionData({ ...sectionData, slides: reordered });
    } else {
      error("Error al reordenar");
    }
  };

  const handleUploadSlideImage = async (slideId: number, file: File) => {
    try {
      const url = await uploadImageFn(sectionKey, 'slide', file);
      if (url) {
        await handleUpdateSlide(slideId, { imagenUrl: url });
      } else {
        error("Error al subir imagen");
      }
    } catch {
      error("Error al subir imagen");
    }
  };

  // ============================================
  // Option handlers
  // ============================================

  const handleAddOption = async (slideId?: number) => {
    if (!sectionData) return;

    const isTable = sectionKey === 'sizes_table';
    const option = await createOptionFn({
      sectionKey,
      slideId: slideId ?? null,
      texto: isTable ? 'Nuevo tamaño' : slideId ? 'Nueva característica' : 'Nueva opción',
      textoSecundario: isTable ? '' : null,
      textoTerciario: isTable ? '' : null,
      textoCuarto: isTable ? '' : null,
      textoQuinto: isTable ? '' : null,
    });

    if (option) {
      setSectionData({
        ...sectionData,
        options: [...sectionData.options, option],
      });
      success("Opción agregada");
    } else {
      error("Error al agregar opción");
    }
  };

  /**
   * Buffers option field edits locally. Changes are only persisted when the
   * user clicks "Guardar".
   */
  const handleUpdateOption = (id: number, data: Partial<ProductPageOption>) => {
    if (!sectionData) return;
    setSectionData({
      ...sectionData,
      options: sectionData.options.map((o) =>
        o.id === id ? { ...o, ...data } : o
      ),
    });
    setDirtyOptions((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...data },
    }));
  };

  const handleDeleteOption = async (id: number) => {
    const ok = await deleteOptionFn(id);

    if (ok && sectionData) {
      setSectionData({
        ...sectionData,
        options: sectionData.options.filter((o) => o.id !== id),
      });
      success("Opción eliminada");
    } else {
      error("Error al eliminar opción");
    }
  };

  const handleReorderOption = async (index: number, direction: 'up' | 'down') => {
    if (!sectionData) return;
    const sorted = [...sectionData.options].sort((a, b) => a.orden - b.orden);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const newOrder = sorted.map(o => o.id);
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];

    const ok = await reorderOptionsFn(sectionKey, newOrder);
    if (ok) {
      const reordered = newOrder.map((id, i) => {
        const option = sectionData.options.find(o => o.id === id);
        return option ? { ...option, orden: i + 1 } : null;
      }).filter((o): o is ProductPageOption => o !== null);

      setSectionData({ ...sectionData, options: reordered });
    } else {
      error("Error al reordenar");
    }
  };

  // ============================================
  // Render
  // ============================================

  if (!metadata) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!sectionData) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-muted-foreground">Sección no encontrada</p>
        <Link href={backHref}>
          <Button variant="outline" className="mt-4">Volver</Button>
        </Link>
      </div>
    );
  }

  const sortedSlides = [...sectionData.slides].sort((a, b) => a.orden - b.orden);
  const sortedOptions = [...sectionData.options].sort((a, b) => a.orden - b.orden);
  const isTable = sectionKey === 'sizes_table';
  const isPaperTypes = sectionKey === 'paper_types';

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
            <Link href={backHref}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-primary flex items-center gap-3">
                {metadata.name}
                <Badge
                  variant={sectionData.section.activo ? "default" : "secondary"}
                  className={sectionData.section.activo ? "bg-green-600" : ""}
                >
                  {sectionData.section.activo ? (
                    <><Eye className="h-3 w-3 mr-1" /> Visible</>
                  ) : (
                    <><EyeOff className="h-3 w-3 mr-1" /> Oculto</>
                  )}
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">{metadata.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ActiveToggle
              isActive={sectionData.section.activo}
              onToggle={handleToggleActive}
            />
            {extraActions}
            <Button
              variant={showPreview ? "default" : "outline"}
              onClick={() => setShowPreview((v) => !v)}
              disabled={isSaving}
              className="gap-2"
            >
              <Monitor className="h-4 w-4" />
              {showPreview ? "Ocultar preview" : "Ver preview"}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || isSaving}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Restablecer
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar
            </Button>
          </div>
        </div>

        {hasChanges && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
            Tienes cambios sin guardar
          </div>
        )}

        {isInherited && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">Contenido heredado del global</p>
            <p className="text-xs">
              Los elementos y opciones que ves abajo provienen del CMS global y
              no pertenecen a este producto. Para poder editarlos, eliminarlos o
              agregar nuevos, primero haz clic en <strong>&quot;Clonar desde Global&quot;</strong>{' '}
              (arriba a la derecha). También puedes guardar los datos de la
              sección (título/subtítulo) para crear un override solo a ese nivel.
            </p>
          </div>
        )}

        {/* Live Preview Panel */}
        {showPreview && (
          <Card className="overflow-hidden border-2 border-primary/40">
            <CardHeader className="bg-muted/40 border-b py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Monitor className="h-4 w-4 text-primary" />
                Previsualización en vivo
                {hasChanges && (
                  <Badge variant="secondary" className="text-[10px]">
                    Cambios sin guardar
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Así se verá esta sección en la página de producto. Los cambios
                se reflejan al instante mientras editas.
              </p>
            </CardHeader>
            <CardContent className="p-0 bg-background">
              <div className="max-h-[70vh] overflow-y-auto">
                <SectionPreview
                  sectionKey={sectionKey}
                  data={
                    sectionData
                      ? {
                          ...sectionData,
                          section: {
                            ...sectionData.section,
                            titulo: formValues.titulo ?? sectionData.section.titulo,
                            subtitulo: formValues.subtitulo ?? sectionData.section.subtitulo,
                            descripcion: formValues.descripcion ?? sectionData.section.descripcion,
                            imagenPrincipalUrl:
                              formValues.imagenPrincipalUrl ?? sectionData.section.imagenPrincipalUrl,
                          },
                        }
                      : null
                  }
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos de la Sección</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={formValues.titulo || ''}
                onChange={(e) => setFormValues({ ...formValues, titulo: e.target.value || null })}
                disabled={isSaving}
                maxLength={255}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {(formValues.titulo || '').length}/255
              </p>
            </div>
            <div>
              <Label htmlFor="subtitulo">Subtítulo</Label>
              <Textarea
                id="subtitulo"
                value={formValues.subtitulo || ''}
                onChange={(e) => setFormValues({ ...formValues, subtitulo: e.target.value || null })}
                disabled={isSaving}
                maxLength={1000}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {(formValues.subtitulo || '').length}/1000
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Slides Manager */}
        {metadata.hasSlides && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                Elementos ({sortedSlides.length}{metadata.maxSlides ? `/${metadata.maxSlides}` : ''})
              </CardTitle>
              <Button
                size="sm"
                onClick={handleAddSlide}
                disabled={isSaving || isInherited || (metadata.maxSlides ? sortedSlides.length >= metadata.maxSlides : false)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {sortedSlides.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay elementos. Agrega uno para comenzar.
                </p>
              ) : (
                sortedSlides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">#{index + 1}</span>
                        {slide.titulo && (
                          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                            — {slide.titulo}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleReorderSlide(index, 'up')}
                          disabled={index === 0 || isSaving || isInherited}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleReorderSlide(index, 'down')}
                          disabled={index === sortedSlides.length - 1 || isSaving || isInherited}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteSlide(slide.id)}
                          disabled={isSaving || isInherited}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Título</Label>
                        <Input
                          value={slide.titulo || ''}
                          onChange={(e) => handleUpdateSlide(slide.id, { titulo: e.target.value || null })}
                          disabled={isSaving || isInherited}
                          className="h-9 text-sm"
                        />
                      </div>
                      {slide.tipo === 'value_card' && (
                        <div>
                          <Label className="text-xs">Ícono</Label>
                          <IconPicker
                            value={slide.icono}
                            onChange={(iconName) => handleUpdateSlide(slide.id, { icono: iconName })}
                            disabled={isSaving || isInherited}
                          />
                        </div>
                      )}
                      {(slide.tipo === 'gallery_image' || slide.tipo === 'paper_type' || slide.tipo === 'service_card' || slide.tipo === 'product_type') && (
                        <div>
                          <Label className="text-xs">Imagen URL</Label>
                          <div className="flex gap-2">
                            <Input
                              value={slide.imagenUrl || ''}
                              onChange={(e) => handleUpdateSlide(slide.id, { imagenUrl: e.target.value || null })}
                              disabled={isSaving || isInherited}
                              className="h-9 text-sm"
                              placeholder="/slide1.jpg"
                            />
                            <label className={isInherited ? "cursor-not-allowed opacity-50" : "cursor-pointer"}>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                disabled={isInherited}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadSlideImage(slide.id, file);
                                }}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-9"
                                disabled={isInherited}
                                asChild
                              >
                                <span>Subir</span>
                              </Button>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {(slide.tipo !== 'gallery_image') && (
                      <div>
                        <Label className="text-xs">Descripción</Label>
                        <Textarea
                          value={slide.descripcion || ''}
                          onChange={(e) => handleUpdateSlide(slide.id, { descripcion: e.target.value || null })}
                          disabled={isSaving || isInherited}
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    )}

                    {slide.tipo === 'product_type' && (
                      <div>
                        <Label className="text-xs">Enlace a paquete (opcional)</Label>
                        <PackageSelector
                          value={slide.paqueteLinkId ?? null}
                          onChange={(paqueteId) => handleUpdateSlide(slide.id, { paqueteLinkId: paqueteId })}
                          disabled={isSaving || isInherited}
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Al hacer clic en esta tarjeta en la página de producto,
                          el usuario será redirigido al paquete seleccionado.
                        </p>
                      </div>
                    )}

                    {/* Features for paper types */}
                    {isPaperTypes && (
                      <div className="ml-4 border-l-2 pl-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium">Características</Label>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs gap-1"
                            onClick={() => handleAddOption(slide.id)}
                            disabled={isSaving || isInherited}
                          >
                            <Plus className="h-3 w-3" />
                            Agregar
                          </Button>
                        </div>
                        {sortedOptions
                          .filter(o => o.slideId === slide.id)
                          .map((opt) => (
                            <div key={opt.id} className="flex items-center gap-2">
                              <Input
                                value={opt.texto}
                                onChange={(e) => handleUpdateOption(opt.id, { texto: e.target.value })}
                                disabled={isSaving || isInherited}
                                className="h-8 text-xs"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteOption(opt.id)}
                                disabled={isSaving || isInherited}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Options Manager (for sizes_table) */}
        {metadata.hasOptions && !isPaperTypes && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                {isTable ? 'Filas de la Tabla' : 'Opciones'} ({sortedOptions.length})
              </CardTitle>
              <Button
                size="sm"
                onClick={() => handleAddOption()}
                disabled={isSaving || isInherited}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {sortedOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay opciones. Agrega una para comenzar.
                </p>
              ) : (
                sortedOptions.map((option, index) => (
                  <div
                    key={option.id}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">#{index + 1}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleReorderOption(index, 'up')}
                          disabled={index === 0 || isSaving || isInherited}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleReorderOption(index, 'down')}
                          disabled={index === sortedOptions.length - 1 || isSaving || isInherited}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteOption(option.id)}
                          disabled={isSaving || isInherited}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {isTable ? (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        <div>
                          <Label className="text-xs">Tamaño</Label>
                          <Input
                            value={option.texto}
                            onChange={(e) => handleUpdateOption(option.id, { texto: e.target.value })}
                            disabled={isSaving || isInherited}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Dimensiones</Label>
                          <Input
                            value={option.textoSecundario || ''}
                            onChange={(e) => handleUpdateOption(option.id, { textoSecundario: e.target.value || null })}
                            disabled={isSaving || isInherited}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Resolución</Label>
                          <Input
                            value={option.textoTerciario || ''}
                            onChange={(e) => handleUpdateOption(option.id, { textoTerciario: e.target.value || null })}
                            disabled={isSaving || isInherited}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Editor</Label>
                          <Input
                            value={option.textoCuarto || ''}
                            onChange={(e) => handleUpdateOption(option.id, { textoCuarto: e.target.value || null })}
                            disabled={isSaving || isInherited}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Precio</Label>
                          <Input
                            value={option.textoQuinto || ''}
                            onChange={(e) => handleUpdateOption(option.id, { textoQuinto: e.target.value || null })}
                            disabled={isSaving || isInherited}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Label className="text-xs">Texto</Label>
                        <Input
                          value={option.texto}
                          onChange={(e) => handleUpdateOption(option.id, { texto: e.target.value })}
                          disabled={isSaving || isInherited}
                          className="h-8 text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
