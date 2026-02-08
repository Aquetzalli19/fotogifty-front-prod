"use client";

import React, { useState, useRef, useEffect } from "react";
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
  ZoomIn,
  ZoomOut,
  Save,
  Download,
  Edit,
  Check,
  X,
  Settings2,
  Paintbrush,
  AlertCircle,
} from "lucide-react";
import { useHistory } from "@/hooks/useHistory";
import { useSearchParams, useRouter } from "next/navigation";
import { useCustomizationStore, PolaroidCustomization } from "@/stores/customization-store";
import { getEditorType } from "@/lib/category-utils";
import { compressCanvas } from "@/lib/canvas-utils";
import { compressAndResizeImage } from "@/lib/image-compression";
import TransformTab from "@/components/editor-components/TransformTab";
import AdjustTab from "@/components/editor-components/AdjustTab";
import BackgroundTab from "@/components/editor-components/BackgroundTab";
import EditorDisclaimer from "@/components/editor-components/EditorDisclaimer";

// Interfaz para cada polaroid guardada
interface SavedPolaroid {
  id: number;
  imageSrc: string;
  transformations: {
    scale: number;
    rotation: number;
    posX: number;
    posY: number;
  };
  effects: {
    brightness: number;
    contrast: number;
    saturation: number;
    sepia: number;
  };
  selectedFilter: string;
  canvasStyle: {
    borderColor: string;
    borderWidth: number;
    backgroundColor: string;
  };
  thumbnailDataUrl?: string; // Preview pequeño para la galería
  renderedImageSrc?: string; // ✅ Canvas completo renderizado con todas las transformaciones (WYSIWYG)
  copies: number; // NUEVO: Cantidad de copias de este polaroid
  // DEPRECADO: Campos para polaroid doble (funcionalidad removida, se mantiene para compatibilidad con datos existentes)
  isDouble?: boolean;
  imageSrc2?: string;
  transformations2?: {
    scale: number;
    posX: number;
    posY: number;
  };
}

export default function PolaroidEditor() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { saveCustomization, getCustomization } = useCustomizationStore();

  const category = searchParams.get("category");
  const cartItemId = searchParams.get("cartItemId");
  const instanceIndex = searchParams.get("instanceIndex");
  const maxPolaroids = parseInt(searchParams.get("quantity") || "10");

  // Obtener dimensiones del paquete desde los parámetros (en pulgadas)
  const widthInches = parseFloat(searchParams.get("width") || "4");
  const heightInches = parseFloat(searchParams.get("height") || "5");
  const exportResolution = parseInt(searchParams.get("resolution") || "300"); // DPI

  // Calcular dimensiones base del canvas polaroid en pixels
  const BASE_POLAROID_WIDTH = Math.round(widthInches * exportResolution);
  const BASE_POLAROID_HEIGHT = Math.round(heightInches * exportResolution);

  // Detectar si estamos en modo "carrito"
  const isCartMode = cartItemId !== null && instanceIndex !== null;

  const [activeTab, setActiveTab] = useState<string | null>("transform");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  // Estado para orientación del canvas
  const [canvasOrientation, setCanvasOrientation] = useState<"portrait" | "landscape">("portrait");

  // Calcular dimensiones según orientación
  const POLAROID_WIDTH = canvasOrientation === "portrait" ? BASE_POLAROID_WIDTH : BASE_POLAROID_HEIGHT;
  const POLAROID_HEIGHT = canvasOrientation === "portrait" ? BASE_POLAROID_HEIGHT : BASE_POLAROID_WIDTH;

  // Área de la foto dentro del polaroid (se ajusta según orientación)
  // Calculamos proporcionalmente basado en las dimensiones del canvas
  const PHOTO_AREA = React.useMemo(() => {
    // Marco proporcional: 6.25% del ancho/alto como borde
    const borderSize = Math.round(Math.min(POLAROID_WIDTH, POLAROID_HEIGHT) * 0.0625);

    if (canvasOrientation === "portrait") {
      // En portrait: marco superior y laterales iguales, marco inferior más grande
      const bottomMargin = Math.round(POLAROID_HEIGHT * 0.25); // 25% del alto para el marco inferior
      const photoWidth = POLAROID_WIDTH - (borderSize * 2);
      const photoHeight = POLAROID_HEIGHT - borderSize - bottomMargin;

      return {
        top: borderSize,
        left: borderSize,
        width: photoWidth,
        height: photoHeight,
      };
    } else {
      // Landscape: marco superior, inferior e izquierdo iguales, marco derecho más grande
      const rightMargin = Math.round(POLAROID_WIDTH * 0.25); // 25% del ancho para el marco derecho
      const photoWidth = POLAROID_WIDTH - borderSize - rightMargin;
      const photoHeight = POLAROID_HEIGHT - (borderSize * 2);

      return {
        top: borderSize,
        left: borderSize,
        width: photoWidth,
        height: photoHeight,
      };
    }
  }, [canvasOrientation, POLAROID_WIDTH, POLAROID_HEIGHT]);

  // Dimensiones del marco blanco (calculadas proporcionalmente)
  const FRAME = React.useMemo(() => {
    const borderSize = Math.round(Math.min(POLAROID_WIDTH, POLAROID_HEIGHT) * 0.0625);

    if (canvasOrientation === "portrait") {
      return {
        top: borderSize,
        side: borderSize,
        bottom: Math.round(POLAROID_HEIGHT * 0.25), // Marco más grande abajo (característico de polaroid)
      };
    } else {
      // Landscape: el marco grande va a la derecha
      return {
        top: borderSize,
        side: Math.round(POLAROID_WIDTH * 0.25), // Marco grande a la derecha
        bottom: borderSize,
      };
    }
  }, [canvasOrientation, POLAROID_WIDTH, POLAROID_HEIGHT]);

  // Estado para la foto actual en edición
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);
  const [currentTransformations, setCurrentTransformations] = useState({
    scale: 1,
    rotation: 0,
    posX: 0,
    posY: 0,
  });
  const [currentEffects, setCurrentEffects] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    sepia: 0,
  });
  const [selectedFilter, setSelectedFilter] = useState<string>("none");
  // Border width proporcional al tamaño del canvas
  const defaultBorderWidth = Math.round(Math.min(BASE_POLAROID_WIDTH, BASE_POLAROID_HEIGHT) * 0.0625);

  const [canvasStyle, setCanvasStyle] = useState({
    borderColor: "#FFFFFF",
    borderWidth: defaultBorderWidth,
    backgroundColor: "#FFFFFF",
  });

  // Colección de polaroids guardadas
  const [savedPolaroids, setSavedPolaroids] = useState<SavedPolaroid[]>([]);
  const [editingPolaroidId, setEditingPolaroidId] = useState<number | null>(null);
  const [nextId, setNextId] = useState(1);

  // NUEVO: Estado para cantidad de copias
  const [copiesToSave, setCopiesToSave] = useState(1);

  const [canvasZoom, setCanvasZoom] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentImageRef = useRef<HTMLImageElement | null>(null);

  const { execute, undo, redo, canUndo, canRedo, reset } = useHistory();

  // NUEVO: Calcular copias usadas SIEMPRE desde el estado local (savedPolaroids)
  // No usar getTotalCopiesUsed() porque solo se actualiza al guardar, causando que la UI muestre datos viejos
  const copiesUsed = React.useMemo(() => {
    return savedPolaroids.reduce((sum, p) => sum + (p.copies || 1), 0);
  }, [savedPolaroids]);

  // Copias del polaroid que se está editando (si aplica)
  const currentCopiesWhenEditing = React.useMemo(() => {
    if (editingPolaroidId === null) return 0;
    return savedPolaroids.find(p => p.id === editingPolaroidId)?.copies || 1;
  }, [editingPolaroidId, savedPolaroids]);

  // LEGACY: mantener copiesAvailable para retrocompatibilidad
  const copiesAvailable = maxPolaroids - copiesUsed;

  // Máximo de copias permitidas para el INPUT (sin incluir copiesToSave para evitar círculo vicioso)
  const maxCopiesAllowed = React.useMemo(() => {
    if (editingPolaroidId !== null) {
      // Modo edición: Las copias actuales de este polaroid + las disponibles
      const disponibles = maxPolaroids - (copiesUsed - currentCopiesWhenEditing);
      return Math.max(1, disponibles);
    } else {
      // Modo nuevo polaroid: Todas las copias disponibles (sin restar copiesToSave aún)
      const disponibles = maxPolaroids - copiesUsed;
      return Math.max(1, disponibles);
    }
  }, [editingPolaroidId, maxPolaroids, copiesUsed, currentCopiesWhenEditing]);

  // NUEVO: Copias proyectadas (incluye el polaroid actual con copiesToSave)
  // Esto es SOLO para mostrar el progreso y validar al guardar
  const copiesProjected = React.useMemo(() => {
    let total = copiesUsed;

    if (currentImageSrc) {
      if (editingPolaroidId === null) {
        // Nuevo polaroid: sumar copiesToSave
        total += copiesToSave;
      } else {
        // Editando: restar las copias viejas y sumar las nuevas
        total = total - currentCopiesWhenEditing + copiesToSave;
      }
    }

    return total;
  }, [copiesUsed, currentImageSrc, editingPolaroidId, copiesToSave, currentCopiesWhenEditing]);

  // Renderizar el canvas con el polaroid
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    canvas.width = POLAROID_WIDTH;
    canvas.height = POLAROID_HEIGHT;

    // Limpiar canvas
    ctx.clearRect(0, 0, POLAROID_WIDTH, POLAROID_HEIGHT);

    // Dibujar marco del polaroid con el color de fondo personalizado
    ctx.fillStyle = canvasStyle.backgroundColor;
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
      // Dibujar la foto con transformaciones y efectos
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
        const { scale, rotation, posX, posY } = currentTransformations;

        // Calcular centro del área de foto
        const centerX = PHOTO_AREA.left + PHOTO_AREA.width / 2;
        const centerY = PHOTO_AREA.top + PHOTO_AREA.height / 2;

        // Aplicar transformaciones
        ctx.translate(centerX + posX, centerY + posY);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(scale, scale);

        // Aplicar filtros CSS
        const { brightness, contrast, saturation, sepia } = currentEffects;
        const filters: string[] = [];

        // Aplicar filtro seleccionado
        if (selectedFilter === "blackwhite") {
          filters.push("grayscale(100%)");
        } else if (selectedFilter === "sepia") {
          filters.push("sepia(100%)");
        } else {
          // Aplicar ajustes manuales
          if (brightness !== 0) filters.push(`brightness(${1 + brightness / 100})`);
          if (contrast !== 0) filters.push(`contrast(${1 + contrast / 100})`);
          if (saturation !== 0) filters.push(`saturate(${1 + saturation / 100})`);
          if (sepia !== 0) filters.push(`sepia(${sepia / 100})`);
        }

        if (filters.length > 0) {
          ctx.filter = filters.join(" ");
        }

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

    // Dibujar borde personalizado del polaroid
    if (canvasStyle.borderWidth > 0) {
      ctx.save();
      ctx.strokeStyle = canvasStyle.borderColor;
      ctx.lineWidth = canvasStyle.borderWidth;
      ctx.strokeRect(
        canvasStyle.borderWidth / 2,
        canvasStyle.borderWidth / 2,
        POLAROID_WIDTH - canvasStyle.borderWidth,
        POLAROID_HEIGHT - canvasStyle.borderWidth
      );
      ctx.restore();
    }
  };

  // Re-renderizar cuando cambian las transformaciones, efectos o la imagen
  useEffect(() => {
    renderCanvas();
  }, [currentImageSrc, currentTransformations, currentEffects, selectedFilter, canvasStyle, canvasOrientation, POLAROID_WIDTH, POLAROID_HEIGHT, PHOTO_AREA]);

  // Cargar personalización existente si estamos en modo carrito
  useEffect(() => {
    if (isCartMode && cartItemId && instanceIndex) {
      const existing = getCustomization(
        parseInt(cartItemId),
        parseInt(instanceIndex)
      );

      if (existing && existing.editorType === "polaroid") {
        const data = existing.data as PolaroidCustomization;

        // BACKWARD COMPATIBILITY: Si no existen las dimensiones, usar las del paquete actual
        // Esto permite que customizaciones viejas sigan funcionando
        if (!data.canvasWidth || !data.canvasHeight) {
          console.log("⚠️ Customización sin dimensiones, usando valores del paquete actual");
        }

        // Agregar valores por defecto para nuevos campos si no existen
        const normalizedPolaroids = data.polaroids.map(polaroid => ({
          ...polaroid,
          transformations: {
            scale: polaroid.transformations?.scale || 1,
            rotation: polaroid.transformations?.rotation || 0,
            posX: polaroid.transformations?.posX || 0,
            posY: polaroid.transformations?.posY || 0,
          },
          effects: polaroid.effects || { brightness: 0, contrast: 0, saturation: 0, sepia: 0 },
          selectedFilter: polaroid.selectedFilter || "none",
          canvasStyle: polaroid.canvasStyle || { borderColor: "#FFFFFF", borderWidth: 50, backgroundColor: "#FFFFFF" },
          copies: polaroid.copies || 1, // NUEVO: Backward compatibility para copias
        }));
        setSavedPolaroids(normalizedPolaroids);

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
        setCurrentTransformations({ scale: 1, rotation: 0, posX: 0, posY: 0 });
        setCurrentEffects({ brightness: 0, contrast: 0, saturation: 0, sepia: 0 });
        setSelectedFilter("none");
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
          setCurrentTransformations({ scale: 1, rotation: 0, posX: 0, posY: 0 });
          setCurrentEffects({ brightness: 0, contrast: 0, saturation: 0, sepia: 0 });
          setSelectedFilter("none");
          reset();
        };
      };
      reader.readAsDataURL(file);
    }
  };

  // ===== HANDLERS DE TRANSFORMACIONES =====
  const handleScaleChange = (value: number) => {
    const oldTransformations = { ...currentTransformations };
    execute({
      undo: () => setCurrentTransformations(oldTransformations),
      redo: () => setCurrentTransformations({ ...currentTransformations, scale: value }),
    });
    setCurrentTransformations({ ...currentTransformations, scale: value });
  };

  const handleRotationChange = (value: number) => {
    const oldTransformations = { ...currentTransformations };
    execute({
      undo: () => setCurrentTransformations(oldTransformations),
      redo: () => setCurrentTransformations({ ...currentTransformations, rotation: value }),
    });
    setCurrentTransformations({ ...currentTransformations, rotation: value });
  };

  const handlePosXChange = (value: number) => {
    const oldTransformations = { ...currentTransformations };
    execute({
      undo: () => setCurrentTransformations(oldTransformations),
      redo: () => setCurrentTransformations({ ...currentTransformations, posX: value }),
    });
    setCurrentTransformations({ ...currentTransformations, posX: value });
  };

  const handlePosYChange = (value: number) => {
    const oldTransformations = { ...currentTransformations };
    execute({
      undo: () => setCurrentTransformations(oldTransformations),
      redo: () => setCurrentTransformations({ ...currentTransformations, posY: value }),
    });
    setCurrentTransformations({ ...currentTransformations, posY: value });
  };

  // Live updates (sin historial)
  const handleScaleLive = (value: number) => {
    setCurrentTransformations({ ...currentTransformations, scale: value });
  };

  const handleRotationLive = (value: number) => {
    setCurrentTransformations({ ...currentTransformations, rotation: value });
  };

  const handlePosXLive = (value: number) => {
    setCurrentTransformations({ ...currentTransformations, posX: value });
  };

  const handlePosYLive = (value: number) => {
    setCurrentTransformations({ ...currentTransformations, posY: value });
  };

  // ===== HANDLERS DE EFECTOS =====
  const handleBrightnessChange = (value: number) => {
    const oldEffects = { ...currentEffects };
    execute({
      undo: () => setCurrentEffects(oldEffects),
      redo: () => setCurrentEffects({ ...currentEffects, brightness: value }),
    });
    setCurrentEffects({ ...currentEffects, brightness: value });
  };

  const handleContrastChange = (value: number) => {
    const oldEffects = { ...currentEffects };
    execute({
      undo: () => setCurrentEffects(oldEffects),
      redo: () => setCurrentEffects({ ...currentEffects, contrast: value }),
    });
    setCurrentEffects({ ...currentEffects, contrast: value });
  };

  const handleSaturationChange = (value: number) => {
    const oldEffects = { ...currentEffects };
    execute({
      undo: () => setCurrentEffects(oldEffects),
      redo: () => setCurrentEffects({ ...currentEffects, saturation: value }),
    });
    setCurrentEffects({ ...currentEffects, saturation: value });
  };

  const handleSepiaChange = (value: number) => {
    const oldEffects = { ...currentEffects };
    execute({
      undo: () => setCurrentEffects(oldEffects),
      redo: () => setCurrentEffects({ ...currentEffects, sepia: value }),
    });
    setCurrentEffects({ ...currentEffects, sepia: value });
  };

  // Live updates para efectos
  const handleBrightnessLive = (value: number) => {
    setCurrentEffects({ ...currentEffects, brightness: value });
  };

  const handleContrastLive = (value: number) => {
    setCurrentEffects({ ...currentEffects, contrast: value });
  };

  const handleSaturationLive = (value: number) => {
    setCurrentEffects({ ...currentEffects, saturation: value });
  };

  const handleSepiaLive = (value: number) => {
    setCurrentEffects({ ...currentEffects, sepia: value });
  };

  const handleFilterSelect = (filter: string) => {
    const oldFilter = selectedFilter;
    execute({
      undo: () => setSelectedFilter(oldFilter),
      redo: () => setSelectedFilter(filter),
    });
    setSelectedFilter(filter);
  };

  // ===== HANDLERS DE ESTILO DE CANVAS =====
  const handleBorderWidthChange = (value: number) => {
    const oldStyle = { ...canvasStyle };
    execute({
      undo: () => setCanvasStyle(oldStyle),
      redo: () => setCanvasStyle({ ...canvasStyle, borderWidth: value }),
    });
    setCanvasStyle({ ...canvasStyle, borderWidth: value });
  };

  const handleBorderWidthLive = (value: number) => {
    setCanvasStyle({ ...canvasStyle, borderWidth: value });
  };

  const handleBorderColorChange = (color: ColorResult) => {
    const oldStyle = { ...canvasStyle };
    execute({
      undo: () => setCanvasStyle(oldStyle),
      redo: () => setCanvasStyle({ ...canvasStyle, borderColor: color.hex }),
    });
    setCanvasStyle({ ...canvasStyle, borderColor: color.hex });
  };

  const handleBackgroundColorChange = (color: ColorResult) => {
    const oldStyle = { ...canvasStyle };
    execute({
      undo: () => setCanvasStyle(oldStyle),
      redo: () => setCanvasStyle({ ...canvasStyle, backgroundColor: color.hex }),
    });
    setCanvasStyle({ ...canvasStyle, backgroundColor: color.hex });
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

    // NUEVO: Validar cantidad de copias
    if (copiesToSave < 1) {
      alert("La cantidad mínima de copias es 1");
      return;
    }

    // NUEVO: Validar que no se exceda el límite del paquete
    if (copiesToSave > maxCopiesAllowed) {
      alert(`Solo puedes asignar hasta ${maxCopiesAllowed} ${maxCopiesAllowed === 1 ? 'copia' : 'copias'} a este polaroid`);
      return;
    }

    // Generar thumbnail comprimido para la galería
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Comprimir el thumbnail a un tamaño muy pequeño para la galería
    const thumbnailDataUrl = compressCanvas(canvas, 500, 500, 0.92);

    // IMPORTANTE: NO generamos renderedImageSrc aquí para evitar QuotaExceededError
    // La imagen renderizada se generará SOLO al subir al backend
    console.log(`💾 Guardando polaroid (solo original + transformaciones, sin renderizar)`);

    if (editingPolaroidId !== null) {
      // Actualizar polaroid existente
      setSavedPolaroids((prev) =>
        prev.map((p) =>
          p.id === editingPolaroidId
            ? {
                ...p,
                imageSrc: currentImageSrc,
                transformations: { ...currentTransformations },
                effects: { ...currentEffects },
                selectedFilter,
                canvasStyle: { ...canvasStyle },
                thumbnailDataUrl,
                copies: copiesToSave, // NUEVO
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
        effects: { ...currentEffects },
        selectedFilter,
        canvasStyle: { ...canvasStyle },
        thumbnailDataUrl,
        copies: copiesToSave, // NUEVO
      };
      setSavedPolaroids((prev) => [...prev, newPolaroid]);
      setNextId((prev) => prev + 1);
    }

    // Limpiar el editor
    setCurrentImageSrc(null);
    setCurrentTransformations({ scale: 1, rotation: 0, posX: 0, posY: 0 });
    setCurrentEffects({ brightness: 0, contrast: 0, saturation: 0, sepia: 0 });
    setSelectedFilter("none");
    setCopiesToSave(1); // NUEVO: Reset copias a 1
    currentImageRef.current = null;
    reset();
  };

  // Editar un polaroid guardado
  const handleEditPolaroid = (polaroid: SavedPolaroid) => {
    // Cargar la imagen primero
    const img = new Image();
    img.src = polaroid.imageSrc;

    img.onload = () => {
      // Una vez cargada la imagen, actualizar todos los estados
      currentImageRef.current = img;
      setCurrentImageSrc(polaroid.imageSrc);
      setCurrentTransformations({ ...polaroid.transformations });
      setCurrentEffects(polaroid.effects || { brightness: 0, contrast: 0, saturation: 0, sepia: 0 });
      setSelectedFilter(polaroid.selectedFilter || "none");
      setCanvasStyle(polaroid.canvasStyle || { borderColor: "#FFFFFF", borderWidth: 50, backgroundColor: "#FFFFFF" });
      setCopiesToSave(polaroid.copies || 1);
      setEditingPolaroidId(polaroid.id);

      // Forzar re-render del canvas después de un pequeño delay
      setTimeout(() => {
        setCurrentTransformations(prev => ({ ...prev }));
      }, 50);
    };

    // Si hay error al cargar, establecer estados de todas formas
    img.onerror = () => {
      setCurrentImageSrc(polaroid.imageSrc);
      setCurrentTransformations({ ...polaroid.transformations });
      setCurrentEffects(polaroid.effects || { brightness: 0, contrast: 0, saturation: 0, sepia: 0 });
      setSelectedFilter(polaroid.selectedFilter || "none");
      setCanvasStyle(polaroid.canvasStyle || { borderColor: "#FFFFFF", borderWidth: 50, backgroundColor: "#FFFFFF" });
      setCopiesToSave(polaroid.copies || 1);
      setEditingPolaroidId(polaroid.id);
    };
  };

  // Eliminar un polaroid guardado
  const handleDeletePolaroid = (id: number) => {
    setSavedPolaroids((prev) => prev.filter((p) => p.id !== id));
    if (editingPolaroidId === id) {
      setCurrentImageSrc(null);
      setCurrentTransformations({ scale: 1, rotation: 0, posX: 0, posY: 0 });
      setEditingPolaroidId(null);
      currentImageRef.current = null;
    }
  };

  // Limpiar editor actual
  const handleClearCurrent = () => {
    setCurrentImageSrc(null);
    setCurrentTransformations({ scale: 1, rotation: 0, posX: 0, posY: 0 });
    setCurrentEffects({ brightness: 0, contrast: 0, saturation: 0, sepia: 0 });
    setSelectedFilter("none");
    setEditingPolaroidId(null);
    currentImageRef.current = null;
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
      // Guardar dimensiones del canvas y área de foto para renderizar correctamente
      canvasWidth: POLAROID_WIDTH,
      canvasHeight: POLAROID_HEIGHT,
      widthInches,
      heightInches,
      exportResolution,
      photoArea: PHOTO_AREA,
      polaroids: savedPolaroids,
      maxPolaroids,
    };

    const editorType = category ? getEditorType(category) : "polaroid";

    saveCustomization({
      cartItemId: parseInt(cartItemId),
      instanceIndex: parseInt(instanceIndex),
      editorType,
      data: customizationData,
      completed: copiesUsed >= maxPolaroids,
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
    <>
      {/* Disclaimer que debe aceptarse antes de usar el editor */}
      {!disclaimerAccepted && (
        <EditorDisclaimer onAccept={() => setDisclaimerAccepted(true)} />
      )}

      {/* Editor principal - solo visible después de aceptar disclaimer */}
      <div className="w-full h-screen flex flex-col md:flex-row gap-4 p-4">
      {/* Panel lateral */}
      <div className="w-full md:w-80 flex flex-col gap-4 bg-background rounded-lg p-4 shadow-lg overflow-y-auto">
        <h1 className="text-2xl font-bold text-primary">Editor de Polaroids</h1>

        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">
            {copiesProjected} / {maxPolaroids} copias
          </div>
          {copiesProjected > maxPolaroids && (
            <p className="text-xs text-red-500 font-medium">
              ⚠️ Excede el límite del paquete
            </p>
          )}
        </div>

        <Separator />

        {/* Cargar imagen */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Foto</label>
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
            disabled={!currentImageSrc && copiesProjected >= maxPolaroids}
          >
            <Upload className="mr-2 h-4 w-4" />
            {!currentImageSrc && copiesProjected >= maxPolaroids
              ? "Paquete completo"
              : currentImageSrc
              ? "Cambiar foto"
              : "Cargar foto"
            }
          </Button>
          {!currentImageSrc && copiesProjected >= maxPolaroids && (
            <p className="text-xs text-red-500 text-center">
              Reduce copias o elimina polaroids para agregar más
            </p>
          )}
        </div>

        {/* Opciones de edición */}
        {currentImageSrc && (
          <>
            <Separator />
            <Accordion
              type="single"
              collapsible
              value={activeTab || undefined}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <AccordionItem value="transform">
                <AccordionTrigger className="py-2 flex flex-row justify-between items-center gap-6 text-md">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Transformar
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <TransformTab
                    scale={currentTransformations.scale}
                    rotation={currentTransformations.rotation}
                    posX={currentTransformations.posX}
                    posY={currentTransformations.posY}
                    onScaleChange={handleScaleChange}
                    onRotationChange={handleRotationChange}
                    onPosXChange={handlePosXChange}
                    onPosYChange={handlePosYChange}
                    onScaleLive={handleScaleLive}
                    onRotationLive={handleRotationLive}
                    onPosXLive={handlePosXLive}
                    onPosYLive={handlePosYLive}
                    canvasWidth={PHOTO_AREA.width}
                    canvasHeight={PHOTO_AREA.height}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="adjust">
                <AccordionTrigger className="py-2 flex flex-row justify-between items-center gap-6 text-md">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Ajustar
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <AdjustTab
                    imageSrc={currentImageSrc}
                    brightness={currentEffects.brightness}
                    contrast={currentEffects.contrast}
                    saturation={currentEffects.saturation}
                    sepia={currentEffects.sepia}
                    selectedFilter={selectedFilter}
                    onBrightnessChange={handleBrightnessChange}
                    onContrastChange={handleContrastChange}
                    onSaturationChange={handleSaturationChange}
                    onSepiaChange={handleSepiaChange}
                    onFilterSelect={handleFilterSelect}
                    onBrightnessLive={handleBrightnessLive}
                    onContrastLive={handleContrastLive}
                    onSaturationLive={handleSaturationLive}
                    onSepiaLive={handleSepiaLive}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="colorize">
                <AccordionTrigger className="py-2 flex flex-row justify-between items-center gap-6 text-md">
                  <div className="flex items-center gap-2">
                    <Paintbrush className="h-4 w-4" />
                    Personalizar marco
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <BackgroundTab
                    borderColor={canvasStyle.borderColor}
                    borderWidth={canvasStyle.borderWidth}
                    backgroundColor={canvasStyle.backgroundColor}
                    borderUpdate={handleBorderWidthChange}
                    borderColorUpdate={handleBorderColorChange}
                    backgroundColorUpdate={handleBackgroundColorChange}
                    borderWidthLive={handleBorderWidthLive}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <Separator />
          </>
        )}


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
              {/* NUEVO: Contador de copias usadas */}
              <div className="bg-primary/10 p-3 rounded-lg space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Polaroids usados:</span>
                  <span className="font-bold text-primary">
                    {copiesProjected}/{maxPolaroids}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all"
                    style={{ width: `${(copiesProjected / maxPolaroids) * 100}%` }}
                  />
                </div>
                {copiesProjected > maxPolaroids && (
                  <p className="text-xs text-red-500 font-medium">
                    ⚠️ Excede el límite del paquete
                  </p>
                )}
              </div>

              {/* NUEVO: Campo para cantidad de copias */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  ¿Cuántas veces quieres imprimir este polaroid?
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={maxCopiesAllowed}
                    value={copiesToSave}
                    onChange={(e) => {
                      const newValue = Math.max(1, parseInt(e.target.value) || 1);
                      setCopiesToSave(Math.min(newValue, maxCopiesAllowed));
                    }}
                    className="w-24 text-center"
                  />
                  <span className="text-sm text-muted-foreground">
                    (Disponibles: {maxCopiesAllowed})
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Total de impresiones: {copiesToSave} {copiesToSave === 1 ? 'polaroid' : 'polaroids'}
                </p>
              </div>

              <Button
                onClick={handleSavePolaroid}
                className="w-full"
                disabled={copiesProjected > maxPolaroids}
              >
                {editingPolaroidId !== null ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Actualizar
                  </>
                ) : copiesProjected > maxPolaroids ? (
                  <>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Límite excedido
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar ({copiesToSave} {copiesToSave === 1 ? 'copia' : 'copias'})
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

                {/* Badge de cantidad de copias */}
                {polaroid.copies && polaroid.copies > 1 && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
                    ×{polaroid.copies}
                  </div>
                )}

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
        <div className="mt-4 p-3 bg-secondary/20 rounded-lg space-y-1">
          <p className="text-sm font-medium">Progreso: {copiesProjected}/{maxPolaroids} copias</p>
          <div className="w-full bg-secondary/30 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{
                width: `${Math.min(100, (copiesProjected / maxPolaroids) * 100)}%`,
              }}
            />
          </div>
          {copiesProjected >= maxPolaroids && (
            <p className="text-xs text-green-500 font-medium">
              ✓ Paquete completo
            </p>
          )}
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
    </>
  );
}
