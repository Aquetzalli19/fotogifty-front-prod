"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Undo,
  Redo,
  Trash2,
  Upload,
  ZoomIn,
  ZoomOut,
  Save,
  Download,
  Edit,
  Check,
  X,
} from "lucide-react";
import { useHistory } from "@/hooks/useHistory";
import { useSearchParams, useRouter } from "next/navigation";
import { useCustomizationStore, PolaroidCustomization } from "@/stores/customization-store";
import { getEditorType } from "@/lib/category-utils";
import { compressCanvas } from "@/lib/canvas-utils";
import { compressAndResizeImage } from "@/lib/image-compression";

// Interfaz para cada polaroid guardada
interface SavedPolaroid {
  id: number;
  imageSrc: string;
  transformations: {
    scale: number;
    posX: number;
    posY: number;
  };
  thumbnailDataUrl?: string; // Preview pequeño para la galería
  renderedImageSrc?: string; // ✅ Canvas completo renderizado con todas las transformaciones (WYSIWYG)
  // Campos para polaroid doble
  isDouble?: boolean;
  imageSrc2?: string;
  transformations2?: {
    scale: number;
    posX: number;
    posY: number;
  };
}

// Dimensiones del canvas polaroid
const POLAROID_WIDTH = 800;
const POLAROID_HEIGHT = 1000;

// Área de la foto dentro del polaroid (dejando espacio para el marco blanco)
const PHOTO_AREA = {
  top: 50,
  left: 50,
  width: 700,
  height: 700, // Área cuadrada para la foto
};

// Dimensiones del marco blanco
const FRAME = {
  top: 50,
  side: 50,
  bottom: 250, // Marco más grande abajo (característico de polaroid)
};

export default function PolaroidEditor() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { saveCustomization, getCustomization } = useCustomizationStore();

  const category = searchParams.get("category");
  const cartItemId = searchParams.get("cartItemId");
  const instanceIndex = searchParams.get("instanceIndex");
  const maxPolaroids = parseInt(searchParams.get("quantity") || "10");

  // Detectar si estamos en modo "carrito"
  const isCartMode = cartItemId !== null && instanceIndex !== null;

  // Estado para modo doble
  const [isDoubleMode, setIsDoubleMode] = useState(false);

  // Estado para la foto actual en edición (PRIMERA IMAGEN)
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);
  const [currentTransformations, setCurrentTransformations] = useState({
    scale: 1,
    posX: 0,
    posY: 0,
  });

  // Estado para la SEGUNDA imagen (solo en modo doble)
  const [currentImageSrc2, setCurrentImageSrc2] = useState<string | null>(null);
  const [currentTransformations2, setCurrentTransformations2] = useState({
    scale: 1,
    posX: 0,
    posY: 0,
  });

  // Colección de polaroids guardadas
  const [savedPolaroids, setSavedPolaroids] = useState<SavedPolaroid[]>([]);
  const [editingPolaroidId, setEditingPolaroidId] = useState<number | null>(null);
  const [nextId, setNextId] = useState(1);

  const [canvasZoom, setCanvasZoom] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef2 = useRef<HTMLCanvasElement>(null); // Segundo canvas para modo doble
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null); // Segundo input para modo doble
  const currentImageRef = useRef<HTMLImageElement | null>(null);
  const currentImageRef2 = useRef<HTMLImageElement | null>(null); // Segunda imagen para modo doble

  const { execute, undo, redo, canUndo, canRedo, reset } = useHistory();

  // Renderizar el canvas con el polaroid
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Si está en modo doble, cambiar tamaño del canvas
    const canvasWidth = isDoubleMode ? POLAROID_WIDTH * 2 : POLAROID_WIDTH;
    const canvasHeight = POLAROID_HEIGHT;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (isDoubleMode) {
      // ==================== MODO DOBLE ====================
      // Dibujar dos polaroids lado a lado

      // POLAROID IZQUIERDO (Foto 1)
      ctx.save();
      // Marco blanco
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, POLAROID_WIDTH, POLAROID_HEIGHT);

      // Área de foto 1
      if (!currentImageSrc) {
        ctx.fillStyle = "#F3F4F6";
        ctx.fillRect(
          PHOTO_AREA.left,
          PHOTO_AREA.top,
          PHOTO_AREA.width,
          PHOTO_AREA.height
        );

        ctx.strokeStyle = "#9CA3AF";
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(
          PHOTO_AREA.left,
          PHOTO_AREA.top,
          PHOTO_AREA.width,
          PHOTO_AREA.height
        );
        ctx.setLineDash([]);

        ctx.fillStyle = "#6B7280";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Foto 1", POLAROID_WIDTH / 2, PHOTO_AREA.top + PHOTO_AREA.height / 2);
      } else {
        const img = currentImageRef.current;
        if (img) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(PHOTO_AREA.left, PHOTO_AREA.top, PHOTO_AREA.width, PHOTO_AREA.height);
          ctx.clip();

          const { scale, posX, posY } = currentTransformations;
          const centerX = PHOTO_AREA.left + PHOTO_AREA.width / 2;
          const centerY = PHOTO_AREA.top + PHOTO_AREA.height / 2;

          ctx.translate(centerX + posX, centerY + posY);
          ctx.scale(scale, scale);
          ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
          ctx.restore();
        }
      }

      // Borde polaroid izquierdo
      ctx.strokeStyle = "#E5E7EB";
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, POLAROID_WIDTH, POLAROID_HEIGHT);
      ctx.restore();

      // POLAROID DERECHO (Foto 2)
      ctx.save();
      ctx.translate(POLAROID_WIDTH, 0); // Desplazar a la derecha

      // Marco blanco
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, POLAROID_WIDTH, POLAROID_HEIGHT);

      // Área de foto 2
      if (!currentImageSrc2) {
        ctx.fillStyle = "#F3F4F6";
        ctx.fillRect(
          PHOTO_AREA.left,
          PHOTO_AREA.top,
          PHOTO_AREA.width,
          PHOTO_AREA.height
        );

        ctx.strokeStyle = "#9CA3AF";
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(
          PHOTO_AREA.left,
          PHOTO_AREA.top,
          PHOTO_AREA.width,
          PHOTO_AREA.height
        );
        ctx.setLineDash([]);

        ctx.fillStyle = "#6B7280";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Foto 2", POLAROID_WIDTH / 2, PHOTO_AREA.top + PHOTO_AREA.height / 2);
      } else {
        const img2 = currentImageRef2.current;
        if (img2) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(PHOTO_AREA.left, PHOTO_AREA.top, PHOTO_AREA.width, PHOTO_AREA.height);
          ctx.clip();

          const { scale, posX, posY } = currentTransformations2;
          const centerX = PHOTO_AREA.left + PHOTO_AREA.width / 2;
          const centerY = PHOTO_AREA.top + PHOTO_AREA.height / 2;

          ctx.translate(centerX + posX, centerY + posY);
          ctx.scale(scale, scale);
          ctx.drawImage(img2, -img2.width / 2, -img2.height / 2, img2.width, img2.height);
          ctx.restore();
        }
      }

      // Borde polaroid derecho
      ctx.strokeStyle = "#E5E7EB";
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, POLAROID_WIDTH, POLAROID_HEIGHT);
      ctx.restore();

    } else {
      // ==================== MODO SIMPLE ====================
      // Dibujar marco blanco del polaroid
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, POLAROID_WIDTH, POLAROID_HEIGHT);

      // Dibujar área de la foto (fondo gris si no hay imagen)
      if (!currentImageSrc) {
        ctx.fillStyle = "#F3F4F6";
        ctx.fillRect(
          PHOTO_AREA.left,
          PHOTO_AREA.top,
          PHOTO_AREA.width,
          PHOTO_AREA.height
        );

        // Dibujar borde punteado para indicar el área de foto
        ctx.save();
        ctx.strokeStyle = "#9CA3AF";
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(
          PHOTO_AREA.left,
          PHOTO_AREA.top,
          PHOTO_AREA.width,
          PHOTO_AREA.height
        );
        ctx.restore();

        // Texto indicativo
        ctx.save();
        ctx.fillStyle = "#6B7280";
        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "Sube una foto",
          POLAROID_WIDTH / 2,
          PHOTO_AREA.top + PHOTO_AREA.height / 2
        );
        ctx.restore();
      } else {
        // Dibujar la foto con transformaciones
        const img = currentImageRef.current;
        if (img) {
          ctx.save();

          // Crear clipping path para que la foto no se salga del área
          ctx.beginPath();
          ctx.rect(
            PHOTO_AREA.left,
            PHOTO_AREA.top,
            PHOTO_AREA.width,
            PHOTO_AREA.height
          );
          ctx.clip();

          // Aplicar transformaciones
          const { scale, posX, posY } = currentTransformations;

          // Calcular centro del área de foto
          const centerX = PHOTO_AREA.left + PHOTO_AREA.width / 2;
          const centerY = PHOTO_AREA.top + PHOTO_AREA.height / 2;

          // Aplicar transformaciones
          ctx.translate(centerX + posX, centerY + posY);
          ctx.scale(scale, scale);

          // Dibujar imagen centrada
          ctx.drawImage(
            img,
            -img.width / 2,
            -img.height / 2,
            img.width,
            img.height
          );

          ctx.restore();
        }
      }

      // Dibujar sombra sutil para efecto 3D del polaroid
      ctx.save();
      ctx.strokeStyle = "#E5E7EB";
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, POLAROID_WIDTH, POLAROID_HEIGHT);
      ctx.restore();
    }
  };

  // Re-renderizar cuando cambian las transformaciones, la imagen o el modo doble
  useEffect(() => {
    renderCanvas();
  }, [currentImageSrc, currentTransformations, isDoubleMode, currentImageSrc2, currentTransformations2]);

  // Cargar personalización existente si estamos en modo carrito
  useEffect(() => {
    if (isCartMode && cartItemId && instanceIndex) {
      const existing = getCustomization(
        parseInt(cartItemId),
        parseInt(instanceIndex)
      );

      if (existing && existing.editorType === "polaroid") {
        const data = existing.data as PolaroidCustomization;
        setSavedPolaroids(data.polaroids);

        // Actualizar nextId para evitar IDs duplicados
        if (data.polaroids.length > 0) {
          const maxId = Math.max(...data.polaroids.map((p) => p.id));
          setNextId(maxId + 1);
        }

        // Si hay polaroids guardadas, cargar las imágenes
        data.polaroids.forEach((polaroid) => {
          const img = new Image();
          img.src = polaroid.imageSrc;
          // Las imágenes se cargarán cuando sea necesario
        });
      }
    }
  }, []);

  // Manejar carga de imagen
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Comprimir la imagen para localStorage
      // Polaroid área de foto: 700x700px, usamos 1000px para permitir zoom
      const compressedSrc = await compressAndResizeImage(file, {
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.85,
        mimeType: 'image/jpeg'
      });

      // Cargar la imagen comprimida
      const img = new Image();
      img.src = compressedSrc;
      img.onload = () => {
        currentImageRef.current = img;
        setCurrentImageSrc(compressedSrc);
        setCurrentTransformations({ scale: 1, posX: 0, posY: 0 });
        reset();
      };
    } catch (error) {
      console.error("Error comprimiendo imagen:", error);
      // Fallback: cargar imagen original
      const reader = new FileReader();
      reader.onload = (event) => {
        const originalSrc = event.target?.result as string;
        const img = new Image();
        img.src = originalSrc;
        img.onload = () => {
          currentImageRef.current = img;
          setCurrentImageSrc(originalSrc);
          setCurrentTransformations({ scale: 1, posX: 0, posY: 0 });
          reset();
        };
      };
      reader.readAsDataURL(file);
    }
  };

  // Manejar cambio de escala
  const handleScaleChange = (value: number) => {
    const oldTransformations = { ...currentTransformations };

    execute({
      undo: () => setCurrentTransformations(oldTransformations),
      redo: () =>
        setCurrentTransformations({
          ...currentTransformations,
          scale: value,
        }),
    });

    setCurrentTransformations({
      ...currentTransformations,
      scale: value,
    });
  };

  // Manejar drag de la imagen
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentImageSrc) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvasZoom;
    const y = (e.clientY - rect.top) / canvasZoom;

    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !currentImageSrc) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvasZoom;
    const y = (e.clientY - rect.top) / canvasZoom;

    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;

    const newPosX = currentTransformations.posX + deltaX;
    const newPosY = currentTransformations.posY + deltaY;

    setCurrentTransformations({
      ...currentTransformations,
      posX: newPosX,
      posY: newPosY,
    });

    setDragStart({ x, y });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom
  const handleZoomIn = () => setCanvasZoom((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setCanvasZoom((prev) => Math.max(prev - 0.1, 0.1));
  const handleResetZoom = () => setCanvasZoom(0.5);

  // Guardar polaroid actual en la colección
  const handleSavePolaroid = () => {
    if (!currentImageSrc) return;

    // Validar modo doble: si está activado, ambas imágenes deben estar presentes
    if (isDoubleMode && !currentImageSrc2) {
      alert("Para polaroid doble necesitas subir ambas imágenes");
      return;
    }

    // Generar thumbnail comprimido para la galería
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Comprimir el thumbnail a un tamaño muy pequeño para la galería
    const thumbnailDataUrl = compressCanvas(canvas, 120, 150, 0.4);

    // IMPORTANTE: NO generamos renderedImageSrc aquí para evitar QuotaExceededError
    // La imagen renderizada se generará SOLO al subir al backend
    console.log(`💾 Guardando polaroid ${isDoubleMode ? 'doble' : 'simple'} (solo original + transformaciones, sin renderizar)`);

    if (editingPolaroidId !== null) {
      // Actualizar polaroid existente
      setSavedPolaroids((prev) =>
        prev.map((p) =>
          p.id === editingPolaroidId
            ? {
                ...p,
                imageSrc: currentImageSrc,
                transformations: { ...currentTransformations },
                thumbnailDataUrl,
                // Campos para polaroid doble
                isDouble: isDoubleMode,
                imageSrc2: isDoubleMode ? (currentImageSrc2 || undefined) : undefined,
                transformations2: isDoubleMode ? { ...currentTransformations2 } : undefined,
              }
            : p
        )
      );
      setEditingPolaroidId(null);
    } else {
      // Agregar nuevo polaroid
      const newPolaroid: SavedPolaroid = {
        id: nextId,
        imageSrc: currentImageSrc,
        transformations: { ...currentTransformations },
        thumbnailDataUrl,
        // Campos para polaroid doble
        isDouble: isDoubleMode,
        imageSrc2: isDoubleMode ? (currentImageSrc2 || undefined) : undefined,
        transformations2: isDoubleMode ? { ...currentTransformations2 } : undefined,
      };
      setSavedPolaroids((prev) => [...prev, newPolaroid]);
      setNextId((prev) => prev + 1);
    }

    // Limpiar el editor
    setCurrentImageSrc(null);
    setCurrentTransformations({ scale: 1, posX: 0, posY: 0 });
    currentImageRef.current = null;
    // Limpiar segunda imagen si está en modo doble
    setCurrentImageSrc2(null);
    setCurrentTransformations2({ scale: 1, posX: 0, posY: 0 });
    currentImageRef2.current = null;
    reset();
  };

  // Editar un polaroid guardado
  const handleEditPolaroid = (polaroid: SavedPolaroid) => {
    setCurrentImageSrc(polaroid.imageSrc);
    setCurrentTransformations({ ...polaroid.transformations });
    setEditingPolaroidId(polaroid.id);

    // Si es polaroid doble, cargar también la segunda imagen
    if (polaroid.isDouble && polaroid.imageSrc2 && polaroid.transformations2) {
      setIsDoubleMode(true);
      setCurrentImageSrc2(polaroid.imageSrc2);
      setCurrentTransformations2({ ...polaroid.transformations2 });

      // Cargar la segunda imagen
      const img2 = new Image();
      img2.src = polaroid.imageSrc2;
      img2.onload = () => {
        currentImageRef2.current = img2;
      };
    } else {
      setIsDoubleMode(false);
    }

    // Cargar la primera imagen
    const img = new Image();
    img.src = polaroid.imageSrc;
    img.onload = () => {
      currentImageRef.current = img;
    };
  };

  // Eliminar un polaroid guardado
  const handleDeletePolaroid = (id: number) => {
    setSavedPolaroids((prev) => prev.filter((p) => p.id !== id));
    if (editingPolaroidId === id) {
      setCurrentImageSrc(null);
      setCurrentTransformations({ scale: 1, posX: 0, posY: 0 });
      setEditingPolaroidId(null);
      currentImageRef.current = null;
    }
  };

  // Limpiar editor actual
  const handleClearCurrent = () => {
    setCurrentImageSrc(null);
    setCurrentTransformations({ scale: 1, posX: 0, posY: 0 });
    setEditingPolaroidId(null);
    currentImageRef.current = null;
    // Limpiar también segunda imagen si existe
    setCurrentImageSrc2(null);
    setCurrentTransformations2({ scale: 1, posX: 0, posY: 0 });
    currentImageRef2.current = null;
    reset();
  };

  // Descargar todos los polaroids
  const handleDownloadAll = () => {
    savedPolaroids.forEach((polaroid, index) => {
      if (polaroid.thumbnailDataUrl) {
        const link = document.createElement("a");
        link.download = `polaroid-${index + 1}.png`;
        link.href = polaroid.thumbnailDataUrl;
        link.click();
      }
    });
  };

  // Guardar y volver al carrito
  const handleSaveToCart = () => {
    if (!isCartMode || !cartItemId || !instanceIndex) return;

    const customizationData: PolaroidCustomization = {
      polaroids: savedPolaroids,
      maxPolaroids,
    };

    const editorType = category ? getEditorType(category) : "polaroid";

    saveCustomization({
      cartItemId: parseInt(cartItemId),
      instanceIndex: parseInt(instanceIndex),
      editorType,
      data: customizationData,
      completed: savedPolaroids.length >= maxPolaroids,
    });

    // Volver al carrito
    router.push("/user/cart");
  };

  const handleCancelEdit = () => {
    if (!isCartMode) return;
    // Volver al carrito sin guardar
    router.push("/user/cart");
  };

  return (
    <div className="w-full h-screen flex flex-col md:flex-row gap-4 p-4">
      {/* Panel lateral */}
      <div className="w-full md:w-80 flex flex-col gap-4 bg-background rounded-lg p-4 shadow-lg overflow-y-auto">
        <h1 className="text-2xl font-bold text-primary">Editor de Polaroids</h1>

        <div className="text-sm text-muted-foreground">
          {savedPolaroids.length} / {maxPolaroids} polaroids
        </div>

        <Separator />

        {/* Checkbox para activar modo doble */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="doubleMode"
            checked={isDoubleMode}
            onChange={(e) => {
              const isChecked = e.target.checked;
              setIsDoubleMode(isChecked);

              // Si se desactiva el modo doble, limpiar la segunda imagen
              if (!isChecked) {
                setCurrentImageSrc2(null);
                setCurrentTransformations2({ scale: 1, posX: 0, posY: 0 });
                currentImageRef2.current = null;
              }
            }}
            className="h-4 w-4"
          />
          <label htmlFor="doubleMode" className="text-sm font-medium cursor-pointer">
            Polaroid doble (dos fotos lado a lado)
          </label>
        </div>

        {/* Cargar primera imagen */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {isDoubleMode ? "Foto 1 (izquierda)" : "Foto"}
          </label>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
            variant="secondary"
          >
            <Upload className="mr-2 h-4 w-4" />
            {currentImageSrc ? "Cambiar foto 1" : "Cargar foto 1"}
          </Button>
        </div>

        {/* Cargar segunda imagen (solo en modo doble) */}
        {isDoubleMode && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Foto 2 (derecha)</label>
            <Input
              ref={fileInputRef2}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Comprimir y redimensionar la imagen antes de cargarla
                  compressAndResizeImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.9 }).then((imageSrc) => {
                    setCurrentImageSrc2(imageSrc);
                    setCurrentTransformations2({ scale: 1, posX: 0, posY: 0 }); // Reset transformations for new image

                    const img = new Image();
                    img.src = imageSrc;
                    img.onload = () => {
                      currentImageRef2.current = img;
                      renderCanvas(); // Force re-render after image loads
                    };
                  });
                }
              }}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef2.current?.click()}
              className="w-full"
              variant="secondary"
            >
              <Upload className="mr-2 h-4 w-4" />
              {currentImageSrc2 ? "Cambiar foto 2" : "Cargar foto 2"}
            </Button>
          </div>
        )}

        {/* Controles de escala */}
        {currentImageSrc && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Escala: {currentTransformations.scale.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={currentTransformations.scale}
              onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        )}

        <Separator />

        {/* Botones de acción para la foto actual */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={undo}
              disabled={!canUndo}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={redo}
              disabled={!canRedo}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          {currentImageSrc && (
            <>
              <Button
                onClick={handleSavePolaroid}
                className="w-full"
                disabled={savedPolaroids.length >= maxPolaroids && editingPolaroidId === null}
              >
                {editingPolaroidId !== null ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Actualizar
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Polaroid
                  </>
                )}
              </Button>

              <Button
                onClick={handleClearCurrent}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Descartar
              </Button>
            </>
          )}
        </div>

        <Separator />

        {/* Galería de polaroids guardadas */}
        <div className="space-y-2">
          <h3 className="font-semibold">Polaroids Guardadas</h3>
          <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
            {savedPolaroids.map((polaroid, index) => (
              <div
                key={polaroid.id}
                className="relative group border rounded-lg overflow-hidden bg-muted"
              >
                <img
                  src={polaroid.thumbnailDataUrl}
                  alt={`Polaroid ${index + 1}`}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => handleEditPolaroid(polaroid)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => handleDeletePolaroid(polaroid.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {editingPolaroidId === polaroid.id && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                    Editando
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Guardar o Descargar */}
        {isCartMode ? (
          <div className="flex flex-col gap-2 p-3 bg-primary/10 rounded-lg border-2 border-primary/30">
            <p className="text-sm font-medium text-center text-primary">
              Acciones del carrito
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveToCart}
                className="w-1/2 h-12 text-base font-semibold"
                disabled={savedPolaroids.length === 0}
              >
                <Save className="mr-2 h-5 w-5" />
                Guardar
              </Button>
              <Button
                onClick={handleCancelEdit}
                variant="outline"
                className="w-1/2 h-12 text-base"
              >
                <X className="mr-2 h-5 w-5" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          savedPolaroids.length > 0 && (
            <Button onClick={handleDownloadAll} variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Descargar Todas ({savedPolaroids.length})
            </Button>
          )
        )}

        {/* Progreso */}
        <div className="mt-4 p-3 bg-secondary/20 rounded-lg">
          <p className="text-sm font-medium mb-2">Progreso</p>
          <div className="w-full bg-secondary/30 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{
                width: `${(savedPolaroids.length / maxPolaroids) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Área de canvas */}
      <div className="flex-1 flex flex-col gap-4 bg-muted rounded-lg p-4 relative overflow-hidden">
        {/* Controles de zoom */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button size="icon" variant="secondary" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={handleResetZoom}>
            {(canvasZoom * 100).toFixed(0)}%
          </Button>
          <Button size="icon" variant="secondary" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {/* Canvas */}
        <div className="w-full h-full flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={POLAROID_WIDTH}
            height={POLAROID_HEIGHT}
            className="shadow-2xl transition-transform duration-200 ease-out max-h-full max-w-full"
            style={{
              transform: `scale(${canvasZoom})`,
              transformOrigin: "center center",
              cursor: isDragging
                ? "grabbing"
                : currentImageSrc
                ? "grab"
                : "default",
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />
        </div>

        {/* Instrucciones */}
        {!currentImageSrc && savedPolaroids.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-background/90 p-6 rounded-lg shadow-lg text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">Crea tu primera Polaroid</p>
              <p className="text-sm text-muted-foreground mt-2">
                Carga una foto, ajústala y guárdala en tu colección
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
