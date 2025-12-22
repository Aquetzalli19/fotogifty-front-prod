"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Undo,
  Redo,
  Trash2,
  Upload,
  ZoomIn,
  ZoomOut,
  Download,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  ImageIcon,
  Calendar,
} from "lucide-react";
import { useHistory } from "@/hooks/useHistory";
import { useSearchParams, useRouter } from "next/navigation";
import { useCustomizationStore, CalendarCustomization } from "@/stores/customization-store";
import { getEditorType } from "@/lib/category-utils";
import { compressImage } from "@/lib/canvas-utils";

// Interfaz para las fotos de cada mes
interface MonthPhoto {
  month: number;
  imageSrc: string | null;
  transformations: {
    scale: number;
    posX: number;
    posY: number;
  };
}

// Nombres de los meses
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// Abreviaciones de meses para móvil
const MONTHS_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

// Dimensiones del calendario
const CALENDAR_WIDTH = 2400;
const CALENDAR_HEIGHT = 3600;

// Área donde se puede colocar la foto
const PHOTO_AREA = {
  top: 0,
  left: 0,
  width: CALENDAR_WIDTH,
  height: CALENDAR_HEIGHT * 0.52,
};

export default function CalendarEditor() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { saveCustomization, getCustomization } = useCustomizationStore();

  const category = searchParams.get("category");
  const cartItemId = searchParams.get("cartItemId");
  const instanceIndex = searchParams.get("instanceIndex");

  const isCartMode = cartItemId !== null && instanceIndex !== null;

  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [monthPhotos, setMonthPhotos] = useState<MonthPhoto[]>(
    Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      imageSrc: null,
      transformations: {
        scale: 1,
        posX: 0,
        posY: 0,
      },
    }))
  );

  const [canvasZoom, setCanvasZoom] = useState(0.2);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showMonthGrid, setShowMonthGrid] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateImageRef = useRef<HTMLImageElement | null>(null);
  const photoImageRefs = useRef<Map<number, HTMLImageElement>>(new Map());
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const { execute, undo, redo, canUndo, canRedo } = useHistory();

  // Cargar imagen del template
  useEffect(() => {
    const img = new Image();
    img.src = "/Calendar.png";
    img.onload = () => {
      templateImageRef.current = img;
      renderCanvas();
    };
  }, []);

  // Ajustar zoom inicial basado en el tamaño de pantalla
  useEffect(() => {
    const updateZoom = () => {
      if (window.innerWidth < 640) {
        setCanvasZoom(0.12);
      } else if (window.innerWidth < 1024) {
        setCanvasZoom(0.18);
      } else {
        setCanvasZoom(0.25);
      }
    };
    updateZoom();
    window.addEventListener('resize', updateZoom);
    return () => window.removeEventListener('resize', updateZoom);
  }, []);

  // Cargar personalización existente
  useEffect(() => {
    if (isCartMode && cartItemId && instanceIndex) {
      const existing = getCustomization(
        parseInt(cartItemId),
        parseInt(instanceIndex)
      );

      if (existing && existing.editorType === "calendar") {
        const data = existing.data as CalendarCustomization;
        setMonthPhotos(data.months);

        data.months.forEach((monthData) => {
          if (monthData.imageSrc) {
            const img = new Image();
            img.src = monthData.imageSrc;
            img.onload = () => {
              photoImageRefs.current.set(monthData.month, img);
            };
          }
        });
      }
    }
  }, []);

  const currentMonthPhoto = monthPhotos[selectedMonth - 1];
  const completedMonths = monthPhotos.filter(m => m.imageSrc).length;

  // Renderizar el canvas
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, CALENDAR_WIDTH, CALENDAR_HEIGHT);

    if (templateImageRef.current) {
      ctx.drawImage(templateImageRef.current, 0, 0, CALENDAR_WIDTH, CALENDAR_HEIGHT);
    }

    if (!currentMonthPhoto.imageSrc) {
      ctx.save();
      ctx.strokeStyle = "rgba(59, 130, 246, 0.5)";
      ctx.lineWidth = 4;
      ctx.setLineDash([20, 10]);
      ctx.strokeRect(PHOTO_AREA.left, PHOTO_AREA.top, PHOTO_AREA.width, PHOTO_AREA.height);
      ctx.restore();

      ctx.save();
      ctx.fillStyle = "rgba(59, 130, 246, 0.7)";
      ctx.font = "bold 60px Arial";
      ctx.textAlign = "center";
      ctx.fillText("ÁREA DE FOTO", CALENDAR_WIDTH / 2, PHOTO_AREA.height / 2);
      ctx.restore();
    }

    if (currentMonthPhoto.imageSrc) {
      const img = photoImageRefs.current.get(selectedMonth);
      if (img) {
        ctx.save();
        const { scale, posX, posY } = currentMonthPhoto.transformations;
        const centerX = CALENDAR_WIDTH / 2;
        const centerY = PHOTO_AREA.height / 2;

        ctx.translate(centerX + posX, centerY + posY);
        ctx.scale(scale, scale);
        ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
        ctx.restore();
      }
    }
  };

  useEffect(() => {
    renderCanvas();
  }, [currentMonthPhoto, selectedMonth]);

  // Manejar carga de imagen
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const originalSrc = event.target?.result as string;

      try {
        const imageSrc = await compressImage(originalSrc, 800, 800, 0.5);
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
          photoImageRefs.current.set(selectedMonth, img);
          renderCanvas();
        };

        const previousImageSrc = currentMonthPhoto.imageSrc;

        execute({
          undo: () => {
            setMonthPhotos((prev) => {
              const newPhotos = [...prev];
              newPhotos[selectedMonth - 1] = {
                ...newPhotos[selectedMonth - 1],
                imageSrc: previousImageSrc,
              };
              return newPhotos;
            });
          },
          redo: () => {
            setMonthPhotos((prev) => {
              const newPhotos = [...prev];
              newPhotos[selectedMonth - 1] = {
                ...newPhotos[selectedMonth - 1],
                imageSrc,
              };
              return newPhotos;
            });
          },
        });

        setMonthPhotos((prev) => {
          const newPhotos = [...prev];
          newPhotos[selectedMonth - 1] = {
            ...newPhotos[selectedMonth - 1],
            imageSrc,
          };
          return newPhotos;
        });
      } catch (error) {
        console.error("Error comprimiendo imagen:", error);
      }
    };

    reader.readAsDataURL(file);
    // Reset input para permitir seleccionar la misma imagen
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Navegación de meses
  const goToPrevMonth = () => {
    setSelectedMonth(prev => prev > 1 ? prev - 1 : 12);
  };

  const goToNextMonth = () => {
    setSelectedMonth(prev => prev < 12 ? prev + 1 : 1);
  };

  // Manejar cambio de escala
  const handleScaleChange = (value: number) => {
    const oldTransformations = { ...currentMonthPhoto.transformations };

    execute({
      undo: () => {
        setMonthPhotos((prev) => {
          const newPhotos = [...prev];
          newPhotos[selectedMonth - 1] = {
            ...newPhotos[selectedMonth - 1],
            transformations: oldTransformations,
          };
          return newPhotos;
        });
      },
      redo: () => {
        setMonthPhotos((prev) => {
          const newPhotos = [...prev];
          newPhotos[selectedMonth - 1] = {
            ...newPhotos[selectedMonth - 1],
            transformations: {
              ...newPhotos[selectedMonth - 1].transformations,
              scale: value,
            },
          };
          return newPhotos;
        });
      },
    });

    setMonthPhotos((prev) => {
      const newPhotos = [...prev];
      newPhotos[selectedMonth - 1] = {
        ...newPhotos[selectedMonth - 1],
        transformations: {
          ...newPhotos[selectedMonth - 1].transformations,
          scale: value,
        },
      };
      return newPhotos;
    });
  };

  // Función auxiliar para iniciar drag
  const startDragging = (clientX: number, clientY: number) => {
    if (!currentMonthPhoto.imageSrc) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / canvasZoom;
    const y = (clientY - rect.top) / canvasZoom;

    setIsDragging(true);
    setDragStart({ x, y });
  };

  // Función auxiliar para mover
  const moveDragging = (clientX: number, clientY: number) => {
    if (!isDragging || !currentMonthPhoto.imageSrc) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / canvasZoom;
    const y = (clientY - rect.top) / canvasZoom;

    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;

    setMonthPhotos((prev) => {
      const newPhotos = [...prev];
      const currentPhoto = newPhotos[selectedMonth - 1];
      let newPosX = currentPhoto.transformations.posX + deltaX;
      let newPosY = currentPhoto.transformations.posY + deltaY;

      const { scale } = currentPhoto.transformations;
      const img = photoImageRefs.current.get(selectedMonth);

      if (img) {
        const scaledImgWidth = img.width * scale;
        const scaledImgHeight = img.height * scale;
        const maxPosX = (PHOTO_AREA.width / 2) - (scaledImgWidth / 2);
        const minPosX = -(PHOTO_AREA.width / 2) + (scaledImgWidth / 2);
        const maxPosY = (PHOTO_AREA.height / 2) - (scaledImgHeight / 2);
        const minPosY = -(PHOTO_AREA.height / 2) + (scaledImgHeight / 2);

        newPosX = Math.max(minPosX, Math.min(maxPosX, newPosX));
        newPosY = Math.max(minPosY, Math.min(maxPosY, newPosY));
      }

      newPhotos[selectedMonth - 1] = {
        ...currentPhoto,
        transformations: {
          ...currentPhoto.transformations,
          posX: newPosX,
          posY: newPosY,
        },
      };
      return newPhotos;
    });

    setDragStart({ x, y });
  };

  // Mouse events
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    startDragging(e.clientX, e.clientY);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    moveDragging(e.clientX, e.clientY);
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  // Touch events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (!currentMonthPhoto.imageSrc) return;
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) startDragging(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) moveDragging(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentMonthPhoto.imageSrc, isDragging, canvasZoom, dragStart]);

  // Zoom
  const handleZoomIn = () => setCanvasZoom((prev) => Math.min(prev + 0.05, 1));
  const handleZoomOut = () => setCanvasZoom((prev) => Math.max(prev - 0.05, 0.08));

  // Eliminar imagen
  const handleClearImage = () => {
    execute({
      undo: () => {
        setMonthPhotos((prev) => {
          const newPhotos = [...prev];
          newPhotos[selectedMonth - 1] = currentMonthPhoto;
          return newPhotos;
        });
      },
      redo: () => {
        setMonthPhotos((prev) => {
          const newPhotos = [...prev];
          newPhotos[selectedMonth - 1] = {
            ...newPhotos[selectedMonth - 1],
            imageSrc: null,
            transformations: { scale: 1, posX: 0, posY: 0 },
          };
          return newPhotos;
        });
      },
    });

    setMonthPhotos((prev) => {
      const newPhotos = [...prev];
      newPhotos[selectedMonth - 1] = {
        ...newPhotos[selectedMonth - 1],
        imageSrc: null,
        transformations: { scale: 1, posX: 0, posY: 0 },
      };
      return newPhotos;
    });
  };

  // Descargar calendario
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `calendario-${MONTHS[selectedMonth - 1]}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Guardar y volver al carrito
  const handleSaveToCart = () => {
    if (!isCartMode || !cartItemId || !instanceIndex) return;

    const customizationData: CalendarCustomization = {
      months: monthPhotos,
    };

    const editorType = category ? getEditorType(category) : "calendar";

    saveCustomization({
      cartItemId: parseInt(cartItemId),
      instanceIndex: parseInt(instanceIndex),
      editorType,
      data: customizationData,
      completed: completedMonths >= 12,
    });

    router.push("/user/cart");
  };

  const handleCancelEdit = () => {
    router.push("/user/cart");
  };

  return (
    <div className="w-full min-h-screen bg-muted/30 flex flex-col">
      {/* Header móvil con navegación de meses */}
      <div className="sticky top-0 z-20 bg-background border-b shadow-sm">
        <div className="flex items-center justify-between p-2 sm:p-3">
          {/* Logo/Título */}
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h1 className="text-base sm:text-lg lg:text-xl font-bold text-primary hidden sm:block">
              Editor de Calendario
            </h1>
          </div>

          {/* Navegación de mes - Centro */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={goToPrevMonth}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            <button
              onClick={() => setShowMonthGrid(!showMonthGrid)}
              className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
            >
              <span className="font-semibold text-sm sm:text-base text-primary">
                {MONTHS[selectedMonth - 1]}
              </span>
              {currentMonthPhoto.imageSrc && (
                <Check className="h-4 w-4 text-green-600" />
              )}
            </button>

            <Button
              size="icon"
              variant="ghost"
              onClick={goToNextMonth}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>

          {/* Progreso */}
          <div className="flex items-center gap-2">
            <Badge variant={completedMonths === 12 ? "default" : "secondary"} className="text-xs sm:text-sm">
              {completedMonths}/12
            </Badge>
          </div>
        </div>

        {/* Grid de meses (expandible) */}
        {showMonthGrid && (
          <div className="p-3 border-t bg-background">
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 sm:gap-2">
              {MONTHS.map((month, index) => {
                const hasImage = monthPhotos[index].imageSrc;
                const isSelected = selectedMonth === index + 1;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedMonth(index + 1);
                      setShowMonthGrid(false);
                    }}
                    className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : hasImage
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    <span className="sm:hidden">{MONTHS_SHORT[index]}</span>
                    <span className="hidden sm:inline">{month}</span>
                    {hasImage && !isSelected && (
                      <Check className="h-3 w-3 mx-auto mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Barra de progreso */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(completedMonths / 12) * 100}%` }}
          />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 p-2 sm:p-3 lg:p-4">
        {/* Panel de controles - Abajo en móvil, lateral en desktop */}
        <div className="order-2 lg:order-1 lg:w-72 xl:w-80 flex flex-col gap-3">
          {/* Controles de imagen */}
          <div className="bg-background rounded-xl p-3 sm:p-4 shadow-sm border">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-12 sm:h-14 text-base sm:text-lg"
              variant={currentMonthPhoto.imageSrc ? "secondary" : "default"}
            >
              <Upload className="mr-2 h-5 w-5" />
              {currentMonthPhoto.imageSrc ? "Cambiar foto" : "Subir foto"}
            </Button>

            {/* Escala */}
            {currentMonthPhoto.imageSrc && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Tamaño</label>
                  <span className="text-xs text-muted-foreground">
                    {(currentMonthPhoto.transformations.scale * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.05"
                  value={currentMonthPhoto.transformations.scale}
                  onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Arrastra la imagen para posicionarla
                </p>
              </div>
            )}

            {/* Eliminar foto */}
            {currentMonthPhoto.imageSrc && (
              <Button
                onClick={handleClearImage}
                variant="outline"
                className="w-full mt-3 text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar foto
              </Button>
            )}
          </div>

          {/* Acciones de deshacer/rehacer y zoom */}
          <div className="bg-background rounded-xl p-3 sm:p-4 shadow-sm border">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={undo}
                  disabled={!canUndo}
                  className="h-9 w-9"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={redo}
                  disabled={!canRedo}
                  className="h-9 w-9"
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-1">
                <Button size="icon" variant="outline" onClick={handleZoomOut} className="h-9 w-9">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium w-12 text-center">
                  {(canvasZoom * 100).toFixed(0)}%
                </span>
                <Button size="icon" variant="outline" onClick={handleZoomIn} className="h-9 w-9">
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Botones de acción del carrito */}
          {isCartMode ? (
            <div className="bg-primary/5 rounded-xl p-3 sm:p-4 border-2 border-primary/20">
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveToCart}
                  className="flex-1 h-12 text-base font-semibold"
                >
                  <Save className="mr-2 h-5 w-5" />
                  Guardar
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  className="flex-1 h-12 text-base"
                >
                  <X className="mr-2 h-5 w-5" />
                  Cancelar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                {completedMonths < 12
                  ? `Faltan ${12 - completedMonths} meses por completar`
                  : "¡Calendario completo!"}
              </p>
            </div>
          ) : (
            <Button onClick={handleDownload} className="w-full h-12">
              <Download className="mr-2 h-5 w-5" />
              Descargar {MONTHS[selectedMonth - 1]}
            </Button>
          )}
        </div>

        {/* Área del canvas */}
        <div
          ref={canvasContainerRef}
          className="order-1 lg:order-2 flex-1 bg-background rounded-xl shadow-sm border overflow-hidden relative min-h-[50vh] lg:min-h-0"
        >
          {/* Canvas centrado */}
          <div className="absolute inset-0 flex items-center justify-center overflow-auto p-4">
            <canvas
              ref={canvasRef}
              width={CALENDAR_WIDTH}
              height={CALENDAR_HEIGHT}
              className="shadow-2xl transition-transform duration-200 ease-out"
              style={{
                transform: `scale(${canvasZoom})`,
                transformOrigin: "center center",
                cursor: isDragging ? "grabbing" : currentMonthPhoto.imageSrc ? "grab" : "default",
              }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
          </div>

          {/* Overlay de instrucciones */}
          {!currentMonthPhoto.imageSrc && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/5">
              <div className="bg-background/95 p-4 sm:p-6 rounded-xl shadow-lg text-center max-w-xs mx-4">
                <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-primary" />
                <p className="text-sm sm:text-base font-medium">
                  Sube una foto para {MONTHS[selectedMonth - 1]}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                  La imagen aparecerá en la parte superior del calendario
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
