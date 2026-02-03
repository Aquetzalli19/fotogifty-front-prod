"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  Loader2,
  Eye,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import { SectionEditorForm } from "@/components/admin/landing/SectionEditorForm";
import { SectionPreview } from "@/components/admin/landing/SectionPreview";
import { SlideManager } from "@/components/admin/landing/SlideManager";
import { OptionsManager } from "@/components/admin/landing/OptionsManager";
import { ActiveToggle } from "@/components/admin/landing/ActiveToggle";
import {
  obtenerSeccionPorKey,
  actualizarSeccion,
  toggleSeccionActiva,
  crearSlide,
  actualizarSlide,
  eliminarSlide,
  reordenarSlides,
  crearOpcion,
  actualizarOpcion,
  eliminarOpcion,
  reordenarOpciones,
  subirImagenLanding,
} from "@/services/landing-content";
import {
  LandingSectionComplete,
  LandingSectionDTO,
  LandingSlide,
  LandingOption,
  SectionKey,
  SECTION_METADATA,
} from "@/interfaces/landing-content";
import { getDefaultSection } from "@/lib/landing-defaults";
import { useToast } from "@/hooks/useToast";
import { Toast, ToastContainer } from "@/components/ui/toast";
import Link from "next/link";

interface PageProps {
  params: Promise<{ sectionKey: string }>;
}

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function SectionEditorPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const sectionKey = resolvedParams.sectionKey as SectionKey;
  const router = useRouter();

  const [sectionData, setSectionData] = useState<LandingSectionComplete | null>(null);
  const [formValues, setFormValues] = useState<LandingSectionDTO>({});
  const [originalValues, setOriginalValues] = useState<LandingSectionDTO>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { toasts, removeToast, success, error } = useToast();

  const metadata = SECTION_METADATA[sectionKey];
  const debouncedFormValues = useDebounce(formValues, 300);

  // Load section data
  const loadSection = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await obtenerSeccionPorKey(sectionKey);
      if (response.success && response.data) {
        setSectionData(response.data);
        const initialValues = sectionToDTO(response.data.section);
        setFormValues(initialValues);
        setOriginalValues(initialValues);
      } else {
        // Use default data as fallback
        const defaultData = getDefaultSection(sectionKey);
        if (defaultData) {
          setSectionData(defaultData);
          const initialValues = sectionToDTO(defaultData.section);
          setFormValues(initialValues);
          setOriginalValues(initialValues);
        } else {
          error("Sección no encontrada");
          router.push("/admin/landing-content");
        }
      }
    } catch (err) {
      console.error("Error loading section:", err);
      error("Error al cargar la sección");
    } finally {
      setIsLoading(false);
    }
  }, [sectionKey, router]);

  useEffect(() => {
    if (metadata) {
      loadSection();
    } else {
      router.push("/admin/landing-content");
    }
  }, [metadata, loadSection, router]);

  // Check for changes
  useEffect(() => {
    const changed = JSON.stringify(formValues) !== JSON.stringify(originalValues);
    setHasChanges(changed);
  }, [formValues, originalValues]);

  // Convert section to DTO
  function sectionToDTO(section: LandingSectionComplete["section"]): LandingSectionDTO {
    return {
      titulo: section.titulo,
      subtitulo: section.subtitulo,
      descripcion: section.descripcion,
      textoPrimario: section.textoPrimario,
      textoSecundario: section.textoSecundario,
      colorPrimario: section.colorPrimario,
      colorSecundario: section.colorSecundario,
      colorGradienteInicio: section.colorGradienteInicio,
      colorGradienteMedio: section.colorGradienteMedio,
      colorGradienteFin: section.colorGradienteFin,
      imagenPrincipalUrl: section.imagenPrincipalUrl,
      imagenFondoUrl: section.imagenFondoUrl,
      botonTexto: section.botonTexto,
      botonColor: section.botonColor,
      botonEnlace: section.botonEnlace,
      configuracionExtra: section.configuracionExtra,
      activo: section.activo,
    };
  }

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await actualizarSeccion(sectionKey, formValues);
      if (response.success) {
        setOriginalValues(formValues);
        setHasChanges(false);
        success("Cambios guardados exitosamente");
        // Reload to get updated data
        await loadSection();
      } else {
        error(response.error || "Error al guardar cambios");
      }
    } catch (err) {
      console.error("Error saving section:", err);
      error("Error al guardar cambios");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle active status
  const handleToggleActive = async () => {
    try {
      const response = await toggleSeccionActiva(sectionKey);
      if (response.success && sectionData) {
        setSectionData({
          ...sectionData,
          section: {
            ...sectionData.section,
            activo: response.data?.activo ?? !sectionData.section.activo,
          },
        });
        success(response.message || "Estado actualizado");
      } else {
        error(response.error || "Error al cambiar estado");
      }
    } catch (err) {
      console.error("Error toggling active:", err);
      error("Error al cambiar estado");
    }
  };

  // Reset to original values
  const handleReset = () => {
    setFormValues(originalValues);
  };

  // Slide handlers
  const handleAddSlide = async (data: { titulo?: string; descripcion?: string; imagenUrl: string }) => {
    if (!metadata.slideType) return;

    const response = await crearSlide({
      sectionKey,
      tipo: metadata.slideType,
      ...data,
    });

    if (response.success && response.data && sectionData) {
      setSectionData({
        ...sectionData,
        slides: [...sectionData.slides, response.data],
      });
      success("Slide agregado");
    } else {
      error(response.error || "Error al agregar slide");
    }
  };

  const handleUpdateSlide = async (id: number, data: Partial<LandingSlide>) => {
    const response = await actualizarSlide(id, data);

    if (response.success && response.data && sectionData) {
      setSectionData({
        ...sectionData,
        slides: sectionData.slides.map((s) =>
          s.id === id ? { ...s, ...response.data } : s
        ),
      });
      success("Slide actualizado");
    } else {
      error(response.error || "Error al actualizar slide");
    }
  };

  const handleDeleteSlide = async (id: number) => {
    const response = await eliminarSlide(id);

    if (response.success && sectionData) {
      setSectionData({
        ...sectionData,
        slides: sectionData.slides.filter((s) => s.id !== id),
      });
      success("Slide eliminado");
    } else {
      error(response.error || "Error al eliminar slide");
    }
  };

  const handleReorderSlides = async (ids: number[]) => {
    const response = await reordenarSlides({ sectionKey, ids });

    if (response.success && sectionData) {
      const reorderedSlides = ids.map((id, index) => {
        const slide = sectionData.slides.find((s) => s.id === id);
        return slide ? { ...slide, orden: index + 1 } : null;
      }).filter((s): s is LandingSlide => s !== null);

      setSectionData({
        ...sectionData,
        slides: reorderedSlides,
      });
    } else {
      error(response.error || "Error al reordenar slides");
    }
  };

  // Image upload handler for slides
  const handleUploadSlideImage = async (file: File): Promise<string> => {
    const response = await subirImagenLanding(sectionKey, 'slide', file);
    if (response.success && response.data) {
      return response.data.url;
    }
    throw new Error(response.error || "Error al subir la imagen");
  };

  // Option handlers
  const handleAddOption = async (texto: string) => {
    const response = await crearOpcion({ sectionKey, texto });

    if (response.success && response.data && sectionData) {
      setSectionData({
        ...sectionData,
        options: [...sectionData.options, response.data],
      });
      success("Opción agregada");
    } else {
      error(response.error || "Error al agregar opción");
    }
  };

  const handleUpdateOption = async (id: number, data: Partial<LandingOption>) => {
    const response = await actualizarOpcion(id, data);

    if (response.success && response.data && sectionData) {
      setSectionData({
        ...sectionData,
        options: sectionData.options.map((o) =>
          o.id === id ? { ...o, ...response.data } : o
        ),
      });
      success("Opción actualizada");
    } else {
      error(response.error || "Error al actualizar opción");
    }
  };

  const handleDeleteOption = async (id: number) => {
    const response = await eliminarOpcion(id);

    if (response.success && sectionData) {
      setSectionData({
        ...sectionData,
        options: sectionData.options.filter((o) => o.id !== id),
      });
      success("Opción eliminada");
    } else {
      error(response.error || "Error al eliminar opción");
    }
  };

  const handleReorderOptions = async (ids: number[]) => {
    const response = await reordenarOpciones({ sectionKey, ids });

    if (response.success && sectionData) {
      const reorderedOptions = ids.map((id, index) => {
        const option = sectionData.options.find((o) => o.id === id);
        return option ? { ...option, orden: index + 1 } : null;
      }).filter((o): o is LandingOption => o !== null);

      setSectionData({
        ...sectionData,
        options: reorderedOptions,
      });
    } else {
      error(response.error || "Error al reordenar opciones");
    }
  };

  if (!metadata) {
    return null;
  }

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
        <Link href="/admin/landing-content">
          <Button variant="outline" className="mt-4">
            Volver
          </Button>
        </Link>
      </div>
    );
  }

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
            <Link href="/admin/landing-content">
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
                    <>
                      <Eye className="h-3 w-3 mr-1" /> Visible
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3 mr-1" /> Oculto
                    </>
                  )}
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">{metadata.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ActiveToggle
              isActive={sectionData.section.activo}
              onToggle={handleToggleActive}
            />
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

        {/* Unsaved changes indicator */}
        {hasChanges && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
            Tienes cambios sin guardar
          </div>
        )}

        {/* Main content - Form and Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Column */}
          <div className="space-y-6">
            <SectionEditorForm
              sectionKey={sectionKey}
              values={formValues}
              onChange={setFormValues}
              disabled={isSaving}
            />

            {/* Slides Manager */}
            {metadata.hasSlides && metadata.slideType && (
              <SlideManager
                slides={sectionData.slides}
                sectionKey={sectionKey}
                slideType={metadata.slideType}
                maxSlides={metadata.maxSlides}
                onAdd={handleAddSlide}
                onUpdate={handleUpdateSlide}
                onDelete={handleDeleteSlide}
                onReorder={handleReorderSlides}
                onUploadImage={handleUploadSlideImage}
                disabled={isSaving}
              />
            )}

            {/* Options Manager */}
            {metadata.hasOptions && (
              <OptionsManager
                options={sectionData.options}
                sectionKey={sectionKey}
                onAdd={handleAddOption}
                onUpdate={handleUpdateOption}
                onDelete={handleDeleteOption}
                onReorder={handleReorderOptions}
                disabled={isSaving}
              />
            )}
          </div>

          {/* Preview Column */}
          <div className="lg:sticky lg:top-24 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  Vista Previa
                  <Badge variant="outline" className="font-normal">
                    En tiempo real
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden bg-muted/50">
                  <SectionPreview
                    sectionKey={sectionKey}
                    values={debouncedFormValues}
                    slides={sectionData.slides}
                    options={sectionData.options}
                  />
                </div>
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground text-center">
              Los cambios se muestran en tiempo real mientras editas
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
