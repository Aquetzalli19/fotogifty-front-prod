"use client";

import React, { useState, useRef } from "react";
import { ColorResult } from "react-color";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Undo,
  Redo,
  Trash2,
  Upload,
  UndoDot,
  ZoomIn,
  ZoomOut,
  Expand,
  Settings2,
  Paintbrush,
  AlertCircle,
  X,
  Save,
  Edit,
  Check,
  ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { useHistory } from "@/hooks/useHistory";
import TransformTab from "@/components/editor-components/TransformTab";
import AdjustTab from "@/components/editor-components/AdjustTab";
import BackgroundTab from "@/components/editor-components/BackgroundTab";
import DownloadPreview from "@/components/editor-components/DownloadPreview";
import { useSearchParams, useRouter } from "next/navigation";
import { useCanvasState } from "@/hooks/useCanvasState";
import { useCanvasOperations } from "@/hooks/useCanvasState";
import { useCanvasZoom } from "@/hooks/useCanvasState";
import { useImageOperations } from "@/hooks/useCanvasState";
import { useCanvasDragging } from "@/hooks/useCanvasState";
import { useCanvasRendering, renderCanvas } from "@/lib/canvas-operations";
import { useCustomizationStore, StandardCustomization, SavedStandardImage } from "@/stores/customization-store";
import { compressCanvas } from "@/lib/canvas-utils";
import { getEditorType } from "@/lib/category-utils";
import { compressAndResizeImage } from "@/lib/image-compression";

export default function StandardEditor() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { saveCustomization, getCustomization } = useCustomizationStore();

  const category = searchParams.get("category");
  // Las dimensiones vienen del backend en pulgadas
  const widthInches = parseFloat(searchParams.get("width") || "8");
  const heightInches = parseFloat(searchParams.get("height") || "6");
  const exportResolution = parseInt(searchParams.get("resolution") || "300"); // DPI para exportar
  const cartItemId = searchParams.get("cartItemId");
  const instanceIndex = searchParams.get("instanceIndex");
  const maxImages = parseInt(searchParams.get("quantity") || "1"); // Cantidad de imágenes requeridas

  // Detectar si estamos en modo "carrito" (con cartItemId)
  const isCartMode = cartItemId !== null && instanceIndex !== null;

  const [activeTab, setActiveTab] = useState<string | null>("transform");

  // Estados para galería de imágenes (similar a PolaroidEditor)
  const [savedImages, setSavedImages] = useState<SavedStandardImage[]>([]);
  const [editingImageId, setEditingImageId] = useState<number | null>(null);
  const [nextId, setNextId] = useState(1);

  // IMPORTANTE: El canvas SIEMPRE usa las dimensiones REALES de impresión (300 DPI)
  // Esto asegura que lo que ves es EXACTAMENTE lo que se imprimirá (WYSIWYG)
  const canvasDimensions = React.useMemo(
    () => ({
      width: Math.round(widthInches * exportResolution),
      height: Math.round(heightInches * exportResolution),
    }),
    [widthInches, heightInches, exportResolution]
  );

  // Las dimensiones de exportación son las mismas que las del canvas
  const exportDimensions = canvasDimensions;


  const {
    imageSrc,
    setImageSrc,
    selectedFilter,
    setSelectedFilter,
    resolutionWarning,
    setResolutionWarning,
    transformations,
    setTransformations,
    effects,
    setEffects,
    canvasStyle,
    setCanvasStyle,
  } = useCanvasState();

  const canvasRef = useRef<HTMLCanvasElement>(
    null
  ) as React.MutableRefObject<HTMLCanvasElement>;
  const { execute, undo, redo, canUndo, canRedo, reset } = useHistory();

  const {
    handleTransformChange,
    handleEffectChange,
    handleStyleChange,
    handleEffectValueChange,
    handleSaturationChange,
    handleSepiaChange,
    handleFilterSelect,
  } = useCanvasOperations(
    transformations,
    setTransformations,
    effects,
    setEffects,
    canvasStyle,
    setCanvasStyle,
    selectedFilter,
    setSelectedFilter,
    execute
  );

  // Calcular zoom inicial para que el canvas quepa en pantalla
  // Asumimos un contenedor de ~1200px de ancho máximo
  const initialZoom = React.useMemo(() => {
    const maxContainerWidth = 1200;
    const maxContainerHeight = 800;

    // Calcular qué zoom necesitamos para que quepa
    const zoomByWidth = maxContainerWidth / canvasDimensions.width;
    const zoomByHeight = maxContainerHeight / canvasDimensions.height;

    // Usar el menor (para que quepa completo)
    const calculatedZoom = Math.min(zoomByWidth, zoomByHeight, 1); // Máximo 1 (100%)

    // Redondear a 2 decimales
    const zoom = Math.round(calculatedZoom * 100) / 100;

    console.log(`📐 Canvas real: ${canvasDimensions.width}×${canvasDimensions.height} px`);
    console.log(`🔍 Zoom inicial calculado: ${(zoom * 100).toFixed(0)}%`);

    return zoom;
  }, [canvasDimensions.width, canvasDimensions.height]);

  const {
    canvasZoom,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
  } = useCanvasZoom(initialZoom);

  const { handleClearImage } = useImageOperations(
    canvasRef,
    setImageSrc,
    setSelectedFilter,
    setResolutionWarning,
    handleTransformChange,
    handleEffectChange,
    handleStyleChange,
    reset
  );

  const {
    isDragging,
    handleCanvasMouseDown,
  } = useCanvasDragging(
    canvasRef,
    imageSrc,
    transformations,
    canvasZoom,
    handleTransformChange,
    setTransformations
  );

  useCanvasRendering(
    canvasRef,
    imageSrc,
    transformations,
    effects,
    canvasStyle,
    canvasDimensions,
    setResolutionWarning,
    selectedFilter,
    exportDimensions // Validar contra dimensiones de export
  );

  // Cargar personalización existente si estamos en modo carrito
  React.useEffect(() => {
    if (isCartMode && cartItemId && instanceIndex) {
      const existing = getCustomization(
        parseInt(cartItemId),
        parseInt(instanceIndex)
      );

      if (existing && existing.editorType === "standard") {
        const data = existing.data as StandardCustomization;
        // Nuevo formato: array de imágenes
        if (data.images && data.images.length > 0) {
          setSavedImages(data.images);
          // Calcular el siguiente ID disponible
          const maxId = Math.max(...data.images.map(img => img.id));
          setNextId(maxId + 1);
        }
      }
    }
  }, []);

  const [isDownloadPreviewOpen, setIsDownloadPreviewOpen] = useState(false);

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;
    setIsDownloadPreviewOpen(true);
  };

  // Genera un canvas de alta resolución para exportar
  const generateHighResCanvas = (): Promise<HTMLCanvasElement | null> => {
    return new Promise((resolve) => {
      if (!imageSrc) {
        resolve(null);
        return;
      }

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        console.log("=== GENERANDO CANVAS A TAMAÑO REAL (WYSIWYG) ===");
        console.log("Dimensiones del paquete:", { widthInches, heightInches, exportResolution });
        console.log("Canvas (tamaño real de impresión):", canvasDimensions);
        console.log("Zoom inicial para visualización:", `${(initialZoom * 100).toFixed(0)}%`);
        console.log("Imagen cargada:", { width: img.width, height: img.height });
        console.log("Transformaciones originales:", transformations);

        // Crear canvas de alta resolución
        const highResCanvas = document.createElement("canvas");
        highResCanvas.width = exportDimensions.width;
        highResCanvas.height = exportDimensions.height;

        // Calcular factor de escala entre preview y export
        // Este factor se aplica SOLO a las posiciones, NO a la escala de la imagen
        const scaleFactor = exportDimensions.width / canvasDimensions.width;
        console.log("Scale Factor (preview → export):", scaleFactor);

        // Escalar SOLO las transformaciones de posición
        // La escala de la imagen se mantiene igual (proporción respecto al canvas)
        const scaledTransformations = {
          ...transformations,
          posX: transformations.posX * scaleFactor,
          posY: transformations.posY * scaleFactor,
        };

        console.log("Transformaciones escaladas:", scaledTransformations);

        // Escalar el estilo del borde
        const scaledStyle = {
          ...canvasStyle,
          borderWidth: canvasStyle.borderWidth * scaleFactor,
        };

        console.log("Estilo escalado:", scaledStyle);

        // Renderizar en alta resolución
        const imageRef = { current: img };
        renderCanvas(highResCanvas, imageRef, scaledTransformations, effects, scaledStyle);

        console.log("Canvas final generado:", {
          width: highResCanvas.width,
          height: highResCanvas.height
        });
        console.log("==========================================");

        resolve(highResCanvas);
      };
      img.onerror = () => resolve(null);
      img.src = imageSrc;
    });
  };

  const handleConfirmDownload = async () => {
    if (!imageSrc) return;

    const highResCanvas = await generateHighResCanvas();
    if (!highResCanvas) return;

    const dataUrl = highResCanvas.toDataURL("image/jpeg", 0.95);
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "imagen.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsDownloadPreviewOpen(false);
  };

  const handleCancelEdit = () => {
    if (!isCartMode) return;
    // Volver al carrito sin guardar
    router.push("/user/cart");
  };

  // Guardar la imagen actual en la galería
  const handleSaveCurrentImage = async () => {
    if (!imageSrc) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Generar thumbnail comprimido para la galería (del canvas de preview)
    const thumbnailDataUrl = compressCanvas(canvas, 150, 150, 0.5);

    // IMPORTANTE: NO generamos renderedImageSrc aquí para evitar QuotaExceededError
    // La imagen renderizada se generará SOLO al subir al backend
    console.log("💾 Guardando imagen (solo original + transformaciones, sin renderizar)");

    if (editingImageId !== null) {
      // Actualizar imagen existente
      setSavedImages((prev) =>
        prev.map((img) =>
          img.id === editingImageId
            ? {
                ...img,
                imageSrc, // Imagen original para edición posterior
                // NO guardamos renderedImageSrc para evitar QuotaExceededError
                transformations: { ...transformations },
                effects: [...effects],
                canvasStyle: { ...canvasStyle },
                selectedFilter,
                thumbnailDataUrl, // Pequeño, solo para preview en galería
                printDimensions: {
                  widthInches,
                  heightInches,
                  resolution: exportResolution,
                },
              }
            : img
        )
      );
      setEditingImageId(null);
    } else {
      // Agregar nueva imagen
      const newImage: SavedStandardImage = {
        id: nextId,
        imageSrc, // Imagen original para edición posterior
        // NO guardamos renderedImageSrc para evitar QuotaExceededError
        transformations: { ...transformations },
        effects: [...effects],
        canvasStyle: { ...canvasStyle },
        selectedFilter,
        thumbnailDataUrl,
        printDimensions: {
          widthInches,
          heightInches,
          resolution: exportResolution,
        },
      };
      setSavedImages((prev) => [...prev, newImage]);
      setNextId((prev) => prev + 1);
    }

    // Limpiar el editor para la siguiente imagen
    handleClearImage();
  };

  // Editar una imagen guardada
  const handleEditSavedImage = (image: SavedStandardImage) => {
    setImageSrc(image.imageSrc);
    setTransformations(image.transformations);
    setEffects(image.effects);
    setCanvasStyle(image.canvasStyle);
    setSelectedFilter(image.selectedFilter);
    setEditingImageId(image.id);
  };

  // Eliminar una imagen guardada
  const handleDeleteSavedImage = (id: number) => {
    setSavedImages((prev) => prev.filter((img) => img.id !== id));
    if (editingImageId === id) {
      handleClearImage();
      setEditingImageId(null);
    }
  };

  // Descartar edición actual
  const handleDiscardCurrent = () => {
    handleClearImage();
    setEditingImageId(null);
  };

  // Guardar todas las imágenes al carrito (nuevo formato)
  const handleSaveAllToCart = () => {
    if (!isCartMode || !cartItemId || !instanceIndex) return;

    const customizationData: StandardCustomization = {
      images: savedImages,
      maxImages,
    };

    const editorType = category ? getEditorType(category) : "standard";

    saveCustomization({
      cartItemId: parseInt(cartItemId),
      instanceIndex: parseInt(instanceIndex),
      editorType,
      data: customizationData,
      completed: savedImages.length >= maxImages,
    });

    // Volver al carrito
    router.push("/user/cart");
  };

  return (
    <div className="flex flex-col md:flex-row h-screen gap-2 p-4">
      <div className="w-full h-fit md:w-72 md:h-full bg-dark rounded-md px-4 text-primary-foreground py-4 md:order-first order-last overflow-y-auto flex flex-col">
        {/* Controles */}
        <div className="flex-1">
          <Accordion
            type="single"
            collapsible
            value={activeTab || undefined}
            onValueChange={setActiveTab}
          >
            <div className="flex flex-col">
            <AccordionItem value="transform">
              <AccordionTrigger className="py-2 flex flex-row justify-between items-center gap-6 text-md">
                <Expand /> Transformar
              </AccordionTrigger>
              <AccordionContent>
                <TransformTab
                  scale={transformations.scale}
                  rotation={transformations.rotation}
                  posX={transformations.posX}
                  posY={transformations.posY}
                  onScaleChange={(v) =>
                    handleTransformChange({ ...transformations, scale: v })
                  }
                  onRotationChange={(v) =>
                    handleTransformChange({ ...transformations, rotation: v })
                  }
                  onPosXChange={(v) =>
                    handleTransformChange({ ...transformations, posX: v })
                  }
                  onPosYChange={(v) =>
                    handleTransformChange({ ...transformations, posY: v })
                  }
                  // Actualización en tiempo real (sin historial)
                  onScaleLive={(v) =>
                    setTransformations((prev) => ({ ...prev, scale: v }))
                  }
                  onRotationLive={(v) =>
                    setTransformations((prev) => ({ ...prev, rotation: v }))
                  }
                  onPosXLive={(v) =>
                    setTransformations((prev) => ({ ...prev, posX: v }))
                  }
                  onPosYLive={(v) =>
                    setTransformations((prev) => ({ ...prev, posY: v }))
                  }
                  canvasWidth={canvasDimensions.width}
                  canvasHeight={canvasDimensions.height}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="adjust">
              <AccordionTrigger className="py-2 flex flex-row justify-between items-center gap-6 text-md">
                <Settings2 /> Ajustar
              </AccordionTrigger>
              <AccordionContent>
                <AdjustTab
                  imageSrc={imageSrc}
                  brightness={effects[0]?.value ?? 100}
                  contrast={effects[1]?.value ?? 100}
                  saturation={effects[2]?.value ?? 100}
                  sepia={effects[3]?.value ?? 0}
                  selectedFilter={selectedFilter}
                  onBrightnessChange={(v) =>
                    handleEffectValueChange("brightness", v)
                  }
                  onContrastChange={(v) =>
                    handleEffectValueChange("contrast", v)
                  }
                  onSaturationChange={(v) => handleSaturationChange(v)}
                  onSepiaChange={(v) => handleSepiaChange(v)}
                  onFilterSelect={handleFilterSelect}
                  // Actualización en tiempo real (sin historial)
                  onBrightnessLive={(v) =>
                    setEffects((prev) => prev.map((e, i) => i === 0 ? { ...e, value: v } : e))
                  }
                  onContrastLive={(v) =>
                    setEffects((prev) => prev.map((e, i) => i === 1 ? { ...e, value: v } : e))
                  }
                  onSaturationLive={(v) =>
                    setEffects((prev) => prev.map((e, i) => i === 2 ? { ...e, value: v } : e))
                  }
                  onSepiaLive={(v) =>
                    setEffects((prev) => prev.map((e, i) => i === 3 ? { ...e, value: v } : e))
                  }
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="colorize">
              <AccordionTrigger className="py-2 flex flex-row justify-between items-center gap-6 text-md">
                <Paintbrush /> Lienzo
              </AccordionTrigger>
              <AccordionContent>
                <BackgroundTab
                  borderColor={canvasStyle.borderColor}
                  borderWidth={canvasStyle.borderWidth}
                  borderUpdate={(newWidth: number) => {
                    handleStyleChange({
                      ...canvasStyle,
                      borderWidth: newWidth,
                    });
                  }}
                  borderWidthLive={(newWidth: number) => {
                    setCanvasStyle((prev) => ({ ...prev, borderWidth: newWidth }));
                  }}
                  backgroundColor={canvasStyle.backgroundColor}
                  borderColorUpdate={(color: ColorResult) => {
                    const { r, g, b, a } = color.rgb;
                    handleStyleChange({
                      ...canvasStyle,
                      borderColor: `rgba(${r}, ${g}, ${b}, ${a ?? 1})`,
                    });
                  }}
                  backgroundColorUpdate={(color: ColorResult) => {
                    const { r, g, b, a } = color.rgb;
                    handleStyleChange({
                      ...canvasStyle,
                      backgroundColor: `rgba(${r}, ${g}, ${b}, ${a ?? 1})`,
                    });
                  }}
                />
              </AccordionContent>
            </AccordionItem>
            </div>
          </Accordion>
        </div>

        {/* Sección de galería y botones - Desktop */}
        <div className="hidden md:flex flex-col gap-3 pt-4 mt-auto border-t border-gray-700">
          {isCartMode ? (
            <>
              {/* Indicador de progreso */}
              <div className="text-sm text-center text-muted-foreground">
                {savedImages.length} / {maxImages} imágenes
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (savedImages.length / maxImages) * 100)}%` }}
                />
              </div>

              {/* Galería de imágenes guardadas */}
              {savedImages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium">Imágenes guardadas:</p>
                  <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                    {savedImages.map((img, index) => (
                      <div
                        key={img.id}
                        className={`relative group rounded overflow-hidden border-2 ${
                          editingImageId === img.id ? "border-primary" : "border-transparent"
                        }`}
                      >
                        <img
                          src={img.thumbnailDataUrl || img.imageSrc}
                          alt={`Imagen ${index + 1}`}
                          className="w-full aspect-square object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-white hover:bg-white/20"
                            onClick={() => handleEditSavedImage(img)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-red-400 hover:bg-red-900/30"
                            onClick={() => handleDeleteSavedImage(img.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        {editingImageId === img.id && (
                          <div className="absolute top-0.5 right-0.5 bg-primary text-primary-foreground text-[8px] px-1 rounded">
                            Editando
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mensaje cuando se alcanza el límite */}
              {savedImages.length >= maxImages && editingImageId === null && (
                <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3 text-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
                  <p className="text-sm text-green-400">¡Todas las imágenes agregadas!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Puedes editar o eliminar imágenes existentes
                  </p>
                </div>
              )}

              {/* Botón para guardar imagen actual en galería */}
              {imageSrc && (
                <Button
                  onClick={handleSaveCurrentImage}
                  className="w-full h-10"
                  disabled={savedImages.length >= maxImages && editingImageId === null}
                >
                  {editingImageId !== null ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Actualizar imagen
                    </>
                  ) : savedImages.length >= maxImages ? (
                    <>
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Límite alcanzado
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar imagen ({savedImages.length + 1}/{maxImages})
                    </>
                  )}
                </Button>
              )}

              {imageSrc && (
                <Button
                  onClick={handleDiscardCurrent}
                  variant="ghost"
                  className="w-full h-8 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Descartar
                </Button>
              )}

              <Separator className="bg-gray-700" />

              {/* Botones del carrito */}
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveAllToCart}
                  className="flex-1 h-11"
                  disabled={savedImages.length === 0}
                >
                  Guardar al carrito
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  variant="destructive"
                  className="h-11 px-4"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Modo normal (sin carrito) */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1 h-10 bg-white text-black hover:bg-white/90"
                  onClick={() => {
                    handleTransformChange({
                      scale: 1,
                      rotation: 0,
                      mirrorX: false,
                      mirrorY: false,
                      posX: 0,
                      posY: 0,
                    });
                    setTimeout(
                      () =>
                        handleEffectChange([
                          { type: "brightness", value: 100 },
                          { type: "contrast", value: 100 },
                          { type: "saturate", value: 100 },
                          { type: "sepia", value: 0 },
                        ]),
                      5
                    );
                    handleStyleChange({
                      backgroundColor: "#FFFFFF",
                      borderColor: "#000000",
                      borderWidth: 0,
                    });
                  }}
                >
                  Restablecer
                </Button>
                <Button onClick={handleDownloadImage} className="flex-1 h-10">
                  Descargar
                </Button>
              </div>
              {imageSrc && (
                <Button
                  onClick={handleClearImage}
                  variant="ghost"
                  className="h-9 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Eliminar imagen
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div
        id="canvas-container"
        className="flex-1 md:flex-2  sm:min-h-1/2 sm:max-h-1/2 md:min-h-full flex flex-col items-center justify-center rounded-md bg-dark p-4 relative overflow-hidden"
      >
        {resolutionWarning && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-md flex items-center gap-2 w-full md:max-w-md">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{resolutionWarning}</span>
          </div>
        )}

        {imageSrc ? (
          ""
        ) : (
          <div className="absolute w-60 h-40 border-2 border-dashed border-gray-500 rounded-2xl flex items-center justify-center hover:bg-gray-400/20 z-10 transition-colors duration-200">
            {" "}
            <Input
              id="upload-button"
              type="file"
              accept="image/*"
              className="absolute opacity-0 w-60 h-40"
              onChange={async (e) => {
                if (e.target.files?.[0]) {
                  const file = e.target.files[0];
                  try {
                    // Comprimir la imagen para localStorage
                    // Usar dimensiones óptimas para impresión de calidad
                    const maxWidth = Math.round(exportDimensions.width * 1.5);
                    const maxHeight = Math.round(exportDimensions.height * 1.5);

                    console.log("Comprimiendo imagen a:", {
                      max: { maxWidth, maxHeight }
                    });

                    const compressedSrc = await compressAndResizeImage(file, {
                      maxWidth,
                      maxHeight,
                      quality: 0.85,
                      mimeType: 'image/jpeg'
                    });
                    setImageSrc(compressedSrc);
                    reset();
                  } catch (error) {
                    console.error("Error comprimiendo imagen:", error);
                    // Fallback: intentar cargar la imagen original
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      setImageSrc(event.target?.result as string);
                      reset();
                    };
                    reader.readAsDataURL(file);
                  }
                }
              }}
            />{" "}
            <div className="w-full flex flex-col gap-4 items-center">
              {" "}
              <Upload /> <p>Sube una foto</p>{" "}
            </div>{" "}
          </div>
        )}
        <div className="flex gap-2 absolute z-10 top-4 left-4 transition-opacity duration-200">
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full text-secondary bg-background shadow-2xs hover:text-secondary transition-colors duration-200"
            onClick={undo}
            disabled={!canUndo}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full text-secondary bg-background shadow-2xs hover:text-secondary transition-colors duration-200"
            onClick={redo}
            disabled={!canRedo}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-row gap-4 absolute z-10 bottom-4 right-4 w-44 transition-opacity duration-200">
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full text-secondary bg-background shadow-2xs hover:text-secondary transition-colors duration-200"
            onClick={handleResetZoom}
          >
            {" "}
            <UndoDot className="w-4 h-4" />{" "}
          </Button>
          <div className="bg-background flex flex-row w-full rounded-l-full rounded-r-full transition-all duration-200">
            <Button
              size="icon"
              variant="ghost"
              className="text-secondary bg-background shadow-2xs hover:text-secondary w-1/2 transition-colors duration-200"
              onClick={handleZoomIn}
            >
              {" "}
              <ZoomIn className="w-4 h-4" />{" "}
            </Button>
            <Separator orientation="vertical" />
            <Button
              size="icon"
              variant="ghost"
              className="text-secondary bg-background shadow-2xs hover:text-secondary w-1/2 transition-colors duration-200"
              onClick={handleZoomOut}
            >
              {" "}
              <ZoomOut className="w-4 h-4" />{" "}
            </Button>
          </div>
        </div>

        {/* Indicador de dimensiones reales del canvas */}
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500 rounded-md">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-200">
            📐 Canvas a tamaño real: {widthInches}&quot; × {heightInches}&quot; a {exportResolution} DPI
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
            Dimensiones: {canvasDimensions.width} × {canvasDimensions.height} px • Vista al {(canvasZoom * 100).toFixed(0)}%
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
            ✓ WYSIWYG: Lo que ves es exactamente lo que se imprimirá
          </p>
        </div>

        <div className="w-full h-full flex items-center justify-center rounded-md max-w-full overflow-hidden">
          <canvas
            ref={canvasRef}
            className="bg-white shadow-lg max-h-full max-w-full touch-none"
            style={{
              transform: `scale(${canvasZoom})`,
              transformOrigin: "center center",
              cursor: isDragging ? "grabbing" : imageSrc ? "grab" : "default",
            }}
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            onMouseDown={handleCanvasMouseDown}
          />
        </div>
      </div>

      <DownloadPreview
        isOpen={isDownloadPreviewOpen}
        onClose={() => setIsDownloadPreviewOpen(false)}
        imageSrc={
          imageSrc ? canvasRef.current?.toDataURL("image/png") || "" : ""
        }
        onDownload={handleConfirmDownload}
        imageDimensions={{
          width: exportDimensions.width,
          height: exportDimensions.height,
        }}
        category={category || "default"}
      />

      {/* Botones móviles - Sección fija en la parte inferior */}
      <div className="flex flex-col gap-3 md:hidden px-4 py-3 bg-dark rounded-lg">
        {isCartMode ? (
          <>
            {/* Indicador de progreso - móvil */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {savedImages.length}/{maxImages}
              </span>
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (savedImages.length / maxImages) * 100)}%` }}
                />
              </div>
            </div>

            {/* Galería móvil compacta con botón de eliminar */}
            {savedImages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto py-1">
                {savedImages.map((img, index) => (
                  <div
                    key={img.id}
                    className={`relative shrink-0 w-14 h-14 rounded overflow-hidden border-2 ${
                      editingImageId === img.id ? "border-primary" : "border-gray-600"
                    }`}
                  >
                    <img
                      src={img.thumbnailDataUrl || img.imageSrc}
                      alt={`${index + 1}`}
                      className="w-full h-full object-cover"
                      onClick={() => handleEditSavedImage(img)}
                    />
                    {/* Botón eliminar visible en móvil */}
                    <button
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSavedImage(img.id);
                      }}
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                    {/* Indicador de edición */}
                    {editingImageId === img.id && (
                      <div className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-[8px] text-center py-0.5">
                        Editando
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Mensaje límite alcanzado - móvil */}
            {savedImages.length >= maxImages && editingImageId === null && (
              <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-2 text-center">
                <p className="text-xs text-green-400 flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  ¡Completo! Toca una imagen para editar
                </p>
              </div>
            )}

            {/* Botón guardar imagen actual */}
            {imageSrc && (
              <Button
                onClick={handleSaveCurrentImage}
                className="w-full h-11"
                disabled={savedImages.length >= maxImages && editingImageId === null}
              >
                {editingImageId !== null ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Actualizar
                  </>
                ) : savedImages.length >= maxImages ? (
                  <>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Límite alcanzado
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar ({savedImages.length + 1}/{maxImages})
                  </>
                )}
              </Button>
            )}

            {/* Botones del carrito - móvil */}
            <div className="flex gap-2">
              <Button
                onClick={handleSaveAllToCart}
                className="flex-1 h-12 text-base font-medium"
                disabled={savedImages.length === 0}
              >
                Guardar al carrito
              </Button>
              <Button
                onClick={handleCancelEdit}
                variant="destructive"
                className="h-12 px-5"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Modo normal (sin carrito) - móvil */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1 h-11 bg-white text-black hover:bg-white/90"
                onClick={() => {
                  handleTransformChange({
                    scale: 1,
                    rotation: 0,
                    mirrorX: false,
                    mirrorY: false,
                    posX: 0,
                    posY: 0,
                  });
                  setTimeout(
                    () =>
                      handleEffectChange([
                        { type: "brightness", value: 100 },
                        { type: "contrast", value: 100 },
                        { type: "saturate", value: 100 },
                        { type: "sepia", value: 0 },
                      ]),
                    5
                  );
                  handleStyleChange({
                    backgroundColor: "#FFFFFF",
                    borderColor: "#000000",
                    borderWidth: 0,
                  });
                }}
              >
                Restablecer
              </Button>
              <Button onClick={handleDownloadImage} className="flex-1 h-11">
                Descargar
              </Button>
            </div>
            {imageSrc && (
              <Button
                onClick={handleClearImage}
                variant="ghost"
                className="h-10 text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4 mr-1" /> Eliminar imagen
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
