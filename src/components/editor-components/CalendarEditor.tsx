"use client";

import React, { useState, useRef, useEffect } from "react";
import { ColorResult } from "react-color";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Download,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  ImageIcon,
  Calendar,
  Loader2,
  Settings2,
  Paintbrush,
} from "lucide-react";
import { useHistory } from "@/hooks/useHistory";
import { useSearchParams, useRouter } from "next/navigation";
import { useCustomizationStore, CalendarCustomization } from "@/stores/customization-store";
import { getEditorType } from "@/lib/category-utils";
import { compressAndResizeImage } from "@/lib/image-compression";
import TransformTab from "@/components/editor-components/TransformTab";
import AdjustTab from "@/components/editor-components/AdjustTab";
import BackgroundTab from "@/components/editor-components/BackgroundTab";
import EditorDisclaimer from "@/components/editor-components/EditorDisclaimer";

// Interfaz para las fotos de cada mes
interface MonthPhoto {
  month: number;
  imageSrc: string | null; // Imagen ORIGINAL para permitir edición posterior
  renderedImageSrc?: string; // Imagen RENDERIZADA (canvas con calendario y foto) - SE ENVÍA AL BACKEND
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

// Mapeo de mes (1-12) a archivo de calendario
const MONTH_CALENDAR_FILES: Record<number, string> = {
  1: "/calendarios2026/1-ENERO 2026.png",
  2: "/calendarios2026/Calendario Febrero 2026.png",
  3: "/calendarios2026/3-MARZO 2026.png",
  4: "/calendarios2026/Calendario Abril 2026.png",
  5: "/calendarios2026/Calendario Mayo 2026.png",
  6: "/calendarios2026/6-JUNIO 2026.png",
  7: "/calendarios2026/Calendario Julio 2026.png",
  8: "/calendarios2026/Calendario Agosto 2026.png",
  9: "/calendarios2026/Calendario Septiembre 2026.png",
  10: "/calendarios2026/Calendario Octubre 2026.png",
  11: "/calendarios2026/Calendario Noviembre 2026.png",
  12: "/calendarios2026/Calendario Diciembre 2026.png",
};

// ⚙️ CONFIGURACIÓN DEL ÁREA DE FOTO
// ============================================
// 📍 Si necesitas modificar el área de la foto, cambia estos valores:

// Porcentaje de altura que ocupa el área de la foto (0.52 = 52%)
const PHOTO_AREA_HEIGHT_PERCENT = 0.47; // ← MODIFICAR AQUÍ para cambiar la altura del área

// Posición del área de la foto (en porcentaje del tamaño total)
const PHOTO_AREA_TOP_PERCENT = 0.0758;    // ← MODIFICAR AQUÍ (0 = pegado arriba, 0.1 = 10% desde arriba)
const PHOTO_AREA_LEFT_PERCENT = 0.0278;   // ← MODIFICAR AQUÍ (0 = pegado izquierda, 0.1 = 10% desde izquierda)
const PHOTO_AREA_WIDTH_PERCENT = .944;  // ← MODIFICAR AQUÍ (1 = 100% del ancho, 0.8 = 80% del ancho)
// ============================================

export default function CalendarEditor() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { saveCustomization, getCustomization } = useCustomizationStore();

  const category = searchParams.get("category");
  const cartItemId = searchParams.get("cartItemId");
  const instanceIndex = searchParams.get("instanceIndex");

  const isCartMode = cartItemId !== null && instanceIndex !== null;

  // 📐 DIMENSIONES DEL CALENDARIO
  // Las dimensiones se obtienen del template cargado, NO del paquete
  // Los templates tienen dimensiones fijas (2400x3600)
  const [baseDimensions, setBaseDimensions] = useState({
    width: 2400,   // Dimensión base desde el template
    height: 3600   // Dimensión base desde el template
  });

  // Estado para orientación del canvas
  const [canvasOrientation, setCanvasOrientation] = useState<"portrait" | "landscape">(
    "portrait" // Los calendarios por defecto son verticales
  );

  // Calcular dimensiones finales según orientación
  const calendarDimensions = React.useMemo(() => {
    const originalOrientation = baseDimensions.width > baseDimensions.height ? "landscape" : "portrait";
    const shouldSwap = canvasOrientation !== originalOrientation;

    return {
      width: shouldSwap ? baseDimensions.height : baseDimensions.width,
      height: shouldSwap ? baseDimensions.width : baseDimensions.height,
    };
  }, [baseDimensions.width, baseDimensions.height, canvasOrientation]);

  // Calcular área de la foto dinámicamente usando los porcentajes configurados
  const PHOTO_AREA = {
    top: Math.round(calendarDimensions.height * PHOTO_AREA_TOP_PERCENT),
    left: Math.round(calendarDimensions.width * PHOTO_AREA_LEFT_PERCENT),
    width: Math.round(calendarDimensions.width * PHOTO_AREA_WIDTH_PERCENT),
    height: Math.round(calendarDimensions.height * PHOTO_AREA_HEIGHT_PERCENT),
  };

  const [activeTab, setActiveTab] = useState<string | null>("transform");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [monthPhotos, setMonthPhotos] = useState<MonthPhoto[]>(
    Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      imageSrc: null,
      transformations: {
        scale: 1,
        rotation: 0,
        posX: 0,
        posY: 0,
      },
      effects: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        sepia: 0,
      },
      selectedFilter: "none",
      canvasStyle: {
        borderColor: "#000000",
        borderWidth: 0,
        backgroundColor: "#FFFFFF",
      },
    }))
  );

  const [canvasZoom, setCanvasZoom] = useState(0.2);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showMonthGrid, setShowMonthGrid] = useState(false);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [copyFromMonth, setCopyFromMonth] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateImageRef = useRef<HTMLImageElement | null>(null);
  const photoImageRefs = useRef<Map<number, HTMLImageElement>>(new Map());
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const { execute, undo, redo, canUndo, canRedo } = useHistory();

  // Cargar imagen del template según el mes seleccionado
  useEffect(() => {
    const img = new Image();
    const calendarFile = MONTH_CALENDAR_FILES[selectedMonth];
    img.src = calendarFile;
    img.onload = () => {
      templateImageRef.current = img;

      // 📐 Detectar dimensiones reales del template
      setBaseDimensions({
        width: img.width,
        height: img.height
      });

      console.log("📐 Template cargado:");
      console.log(`   - Mes: ${MONTHS[selectedMonth - 1]}`);
      console.log(`   - Dimensiones: ${img.width}px × ${img.height}px`);
      console.log(`   - Área de foto: ${Math.round(img.width)}px × ${Math.round(img.height * PHOTO_AREA_HEIGHT_PERCENT)}px (${(PHOTO_AREA_HEIGHT_PERCENT * 100).toFixed(0)}%)`);

      renderCanvas();
    };
    img.onerror = () => {
      console.error(`Error cargando calendario para mes ${selectedMonth}: ${calendarFile}`);
    };
  }, [selectedMonth]);

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
        // Agregar valores por defecto para nuevos campos si no existen
        const normalizedMonths = data.months.map(month => ({
          ...month,
          transformations: {
            scale: month.transformations?.scale || 1,
            rotation: month.transformations?.rotation || 0,
            posX: month.transformations?.posX || 0,
            posY: month.transformations?.posY || 0,
          },
          effects: month.effects || { brightness: 0, contrast: 0, saturation: 0, sepia: 0 },
          selectedFilter: month.selectedFilter || "none",
          canvasStyle: month.canvasStyle || { borderColor: "#000000", borderWidth: 0, backgroundColor: "#FFFFFF" },
        }));
        setMonthPhotos(normalizedMonths);

        let loadedCount = 0;
        const totalToLoad = data.months.filter(m => m.imageSrc).length;

        data.months.forEach((monthData) => {
          if (monthData.imageSrc) {
            const img = new Image();
            img.onload = () => {
              photoImageRefs.current.set(monthData.month, img);
              loadedCount++;
              // Cuando todas las imágenes cargaron, forzar re-render
              if (loadedCount >= totalToLoad) {
                setImagesLoaded(true);
              }
            };
            img.src = monthData.imageSrc;
          }
        });
      }
    }
  }, []);

  const currentMonthPhoto = monthPhotos[selectedMonth - 1];
  const completedMonths = monthPhotos.filter(m => m.imageSrc).length;

  // ========================================
  // FUNCIONES AUXILIARES DE RENDERIZADO
  // ========================================

  // Función auxiliar para dibujar fondo difuminado (blur) de la imagen
  const buildFilterString = (monthPhoto: MonthPhoto): string => {
    const filters: string[] = [];

    if (monthPhoto.selectedFilter === "blackwhite") {
      filters.push("grayscale(100%)");
    } else if (monthPhoto.selectedFilter === "sepia") {
      filters.push("sepia(100%)");
    } else {
      const { brightness, contrast, saturation, sepia } = monthPhoto.effects;
      if (brightness !== 0) filters.push(`brightness(${1 + brightness / 100})`);
      if (contrast !== 0) filters.push(`contrast(${1 + contrast / 100})`);
      if (saturation !== 0) filters.push(`saturate(${1 + saturation / 100})`);
      if (sepia !== 0) filters.push(`sepia(${sepia / 100})`);
    }

    return filters.join(" ");
  };

  const drawBlurredBackground = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    areaLeft: number,
    areaTop: number,
    areaWidth: number,
    areaHeight: number
  ) => {
    ctx.save();

    // Calcular escala para cubrir toda el área (similar a background-size: cover)
    const imgRatio = img.width / img.height;
    const areaRatio = areaWidth / areaHeight;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgRatio > areaRatio) {
      // Imagen más ancha que el área
      drawHeight = areaHeight;
      drawWidth = img.width * (areaHeight / img.height);
      offsetX = areaLeft - (drawWidth - areaWidth) / 2;
      offsetY = areaTop;
    } else {
      // Imagen más alta que el área
      drawWidth = areaWidth;
      drawHeight = img.height * (areaWidth / img.width);
      offsetX = areaLeft;
      offsetY = areaTop - (drawHeight - areaHeight) / 2;
    }

    // Aplicar blur + los mismos filtros de la imagen (brillo, contraste, etc.)
    const imageFilters = buildFilterString(currentMonthPhoto);
    ctx.filter = imageFilters ? `blur(25px) ${imageFilters}` : 'blur(25px)';

    // Dibujar imagen difuminada cubriendo toda el área
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    // Resetear filtro
    ctx.filter = 'none';

    // Oscurecer un poco para que la foto principal destaque más
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(areaLeft, areaTop, areaWidth, areaHeight);

    ctx.restore();
  };

  // Función para dibujar el marco de resaltado del área de foto
  const drawPhotoAreaHighlight = (ctx: CanvasRenderingContext2D) => {
    const x = PHOTO_AREA.left;
    const y = PHOTO_AREA.top;
    const w = PHOTO_AREA.width;
    const h = PHOTO_AREA.height;
    const cornerLength = 100; // Longitud de las esquinas
    const borderWidth = 3;

    ctx.save();

    // 1. Sombra interna sutil
    ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
    ctx.lineWidth = 8;
    ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);

    // 2. Borde fino permanente
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(x, y, w, h);

    // 3. Esquinas marcadas (más prominentes)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";

    // Esquina superior izquierda
    ctx.beginPath();
    ctx.moveTo(x, y + cornerLength);
    ctx.lineTo(x, y);
    ctx.lineTo(x + cornerLength, y);
    ctx.stroke();

    // Esquina superior derecha
    ctx.beginPath();
    ctx.moveTo(x + w - cornerLength, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + cornerLength);
    ctx.stroke();

    // Esquina inferior izquierda
    ctx.beginPath();
    ctx.moveTo(x, y + h - cornerLength);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + cornerLength, y + h);
    ctx.stroke();

    // Esquina inferior derecha
    ctx.beginPath();
    ctx.moveTo(x + w - cornerLength, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h - cornerLength);
    ctx.stroke();

    ctx.restore();
  };

  // Renderizar el canvas
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, calendarDimensions.width, calendarDimensions.height);

    // 1. Dibujar fondo difuminado si hay imagen
    if (currentMonthPhoto.imageSrc) {
      const img = photoImageRefs.current.get(selectedMonth);
      if (img) {
        ctx.save();
        // Clip al área de la foto
        ctx.beginPath();
        ctx.rect(PHOTO_AREA.left, PHOTO_AREA.top, PHOTO_AREA.width, PHOTO_AREA.height);
        ctx.clip();

        // Dibujar fondo blur con offset correcto
        drawBlurredBackground(ctx, img, PHOTO_AREA.left, PHOTO_AREA.top, PHOTO_AREA.width, PHOTO_AREA.height);
        ctx.restore();
      }
    }

    // 2. Dibujar la foto del usuario ENCIMA del blur (CON CLIP para que no se salga del área)
    if (currentMonthPhoto.imageSrc) {
      const img = photoImageRefs.current.get(selectedMonth);
      if (img) {
        ctx.save();

        // IMPORTANTE: Aplicar clip para que la imagen NO se salga del área de foto
        ctx.beginPath();
        ctx.rect(PHOTO_AREA.left, PHOTO_AREA.top, PHOTO_AREA.width, PHOTO_AREA.height);
        ctx.clip();

        const { scale, rotation, posX, posY } = currentMonthPhoto.transformations;
        // Centro del ÁREA de foto (no del canvas completo)
        const centerX = PHOTO_AREA.left + (PHOTO_AREA.width / 2);
        const centerY = PHOTO_AREA.top + (PHOTO_AREA.height / 2);

        ctx.translate(centerX + posX, centerY + posY);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(scale, scale);

        // Aplicar filtros CSS
        const filterStr = buildFilterString(currentMonthPhoto);
        if (filterStr) {
          ctx.filter = filterStr;
        }

        ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
        ctx.restore();
      }
    }

    // 3. Dibujar el template del calendario ENCIMA (con transparencia)
    if (templateImageRef.current) {
      ctx.drawImage(templateImageRef.current, 0, 0, calendarDimensions.width, calendarDimensions.height);
    }

    // 4. Si no hay foto, mostrar el área de foto con indicador
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
      ctx.fillText("ÁREA DE FOTO", calendarDimensions.width / 2, PHOTO_AREA.height / 2);
      ctx.restore();
    }

    // 5. Resaltar el área de la foto SIEMPRE (encima de todo)
    drawPhotoAreaHighlight(ctx);
  };

  useEffect(() => {
    renderCanvas();
  }, [currentMonthPhoto, selectedMonth, calendarDimensions, canvasOrientation, imagesLoaded]);

  // Generar vista previa del calendario renderizado
  const generatePreview = async () => {
    if (!currentMonthPhoto.imageSrc || !templateImageRef.current) {
      setPreviewThumbnail(null);
      return;
    }

    setIsGeneratingPreview(true);

    try {
      // Crear canvas temporal para la vista previa de alta calidad
      const previewCanvas = document.createElement('canvas');
      const previewWidth = 600;  // Aumentado de 300
      const previewHeight = 900; // Aumentado de 450
      previewCanvas.width = previewWidth;
      previewCanvas.height = previewHeight;
      const ctx = previewCanvas.getContext('2d');
      if (!ctx) return;

      // Escalar las dimensiones
      const scale = previewWidth / calendarDimensions.width;
      const scaledPhotoAreaHeight = PHOTO_AREA.height * scale;

      const img = photoImageRefs.current.get(selectedMonth);
      if (img) {
        // 1. Dibujar fondo difuminado
        ctx.save();

        // Coordenadas del área de foto escaladas
        const scaledPhotoAreaLeft = PHOTO_AREA.left * scale;
        const scaledPhotoAreaTop = PHOTO_AREA.top * scale;
        const scaledPhotoAreaWidth = PHOTO_AREA.width * scale;
        const scaledPhotoAreaHeight_blur = PHOTO_AREA.height * scale;

        // Clip al área de la foto en la preview
        ctx.beginPath();
        ctx.rect(scaledPhotoAreaLeft, scaledPhotoAreaTop, scaledPhotoAreaWidth, scaledPhotoAreaHeight_blur);
        ctx.clip();

        // Calcular escala para cubrir toda el área de la foto
        const imgRatio = img.width / img.height;
        const areaRatio = scaledPhotoAreaWidth / scaledPhotoAreaHeight_blur;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgRatio > areaRatio) {
          drawHeight = scaledPhotoAreaHeight_blur;
          drawWidth = img.width * (scaledPhotoAreaHeight_blur / img.height);
          offsetX = scaledPhotoAreaLeft - (drawWidth - scaledPhotoAreaWidth) / 2;
          offsetY = scaledPhotoAreaTop;
        } else {
          drawWidth = scaledPhotoAreaWidth;
          drawHeight = img.height * (scaledPhotoAreaWidth / img.width);
          offsetX = scaledPhotoAreaLeft;
          offsetY = scaledPhotoAreaTop - (drawHeight - scaledPhotoAreaHeight_blur) / 2;
        }

        // Aplicar blur
        ctx.filter = 'blur(10px)';
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        ctx.filter = 'none';

        // Oscurecer un poco
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(scaledPhotoAreaLeft, scaledPhotoAreaTop, scaledPhotoAreaWidth, scaledPhotoAreaHeight_blur);

        ctx.restore();

        // 2. Dibujar la foto del usuario encima del blur (CON CLIP)
        ctx.save();

        // IMPORTANTE: Aplicar clip para que la imagen NO se salga del área (en escala de preview)
        ctx.beginPath();
        ctx.rect(scaledPhotoAreaLeft, scaledPhotoAreaTop, scaledPhotoAreaWidth, scaledPhotoAreaHeight_blur);
        ctx.clip();

        const { scale: photoScale, posX, posY } = currentMonthPhoto.transformations;

        // Centro del ÁREA de foto en la vista previa (escalado) - reutilizando variables ya declaradas
        const centerX = scaledPhotoAreaLeft + (scaledPhotoAreaWidth / 2);
        const centerY = scaledPhotoAreaTop + (scaledPhotoAreaHeight_blur / 2);

        ctx.translate(centerX + (posX * scale), centerY + (posY * scale));
        ctx.scale(photoScale * scale, photoScale * scale);
        ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
        ctx.restore();
      }

      // 3. Dibujar el template del calendario encima
      ctx.drawImage(templateImageRef.current, 0, 0, previewWidth, previewHeight);

      // Convertir a data URL con alta calidad
      const thumbnailDataUrl = previewCanvas.toDataURL('image/jpeg', 0.92);
      setPreviewThumbnail(thumbnailDataUrl);
    } catch (error) {
      console.error('Error generando vista previa:', error);
      setPreviewThumbnail(null);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // Actualizar vista previa cuando cambian las transformaciones o la imagen
  useEffect(() => {
    if (currentMonthPhoto.imageSrc) {
      generatePreview();
    } else {
      setPreviewThumbnail(null);
    }
  }, [currentMonthPhoto, selectedMonth]);

  // Manejar carga de imagen
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Comprimir y redimensionar la imagen antes de guardarla
      const imageSrc = await compressAndResizeImage(file);

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
  // ===== HANDLERS DE TRANSFORMACIONES =====
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

  const handleRotationChange = (value: number) => {
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
              rotation: value,
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
          rotation: value,
        },
      };
      return newPhotos;
    });
  };

  const handlePosXChange = (value: number) => {
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
              posX: value,
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
          posX: value,
        },
      };
      return newPhotos;
    });
  };

  const handlePosYChange = (value: number) => {
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
              posY: value,
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
          posY: value,
        },
      };
      return newPhotos;
    });
  };

  // Live updates (sin historial)
  const handleScaleLive = (value: number) => {
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

  const handleRotationLive = (value: number) => {
    setMonthPhotos((prev) => {
      const newPhotos = [...prev];
      newPhotos[selectedMonth - 1] = {
        ...newPhotos[selectedMonth - 1],
        transformations: {
          ...newPhotos[selectedMonth - 1].transformations,
          rotation: value,
        },
      };
      return newPhotos;
    });
  };

  const handlePosXLive = (value: number) => {
    setMonthPhotos((prev) => {
      const newPhotos = [...prev];
      newPhotos[selectedMonth - 1] = {
        ...newPhotos[selectedMonth - 1],
        transformations: {
          ...newPhotos[selectedMonth - 1].transformations,
          posX: value,
        },
      };
      return newPhotos;
    });
  };

  const handlePosYLive = (value: number) => {
    setMonthPhotos((prev) => {
      const newPhotos = [...prev];
      newPhotos[selectedMonth - 1] = {
        ...newPhotos[selectedMonth - 1],
        transformations: {
          ...newPhotos[selectedMonth - 1].transformations,
          posY: value,
        },
      };
      return newPhotos;
    });
  };

  // ===== HANDLERS DE EFECTOS =====
  const handleBrightnessChange = (value: number) => {
    const oldEffects = { ...currentMonthPhoto.effects };
    execute({
      undo: () => {
        setMonthPhotos((prev) => {
          const newPhotos = [...prev];
          newPhotos[selectedMonth - 1] = {
            ...newPhotos[selectedMonth - 1],
            effects: oldEffects,
          };
          return newPhotos;
        });
      },
      redo: () => {
        setMonthPhotos((prev) => {
          const newPhotos = [...prev];
          newPhotos[selectedMonth - 1] = {
            ...newPhotos[selectedMonth - 1],
            effects: {
              ...newPhotos[selectedMonth - 1].effects,
              brightness: value,
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
        effects: {
          ...newPhotos[selectedMonth - 1].effects,
          brightness: value,
        },
      };
      return newPhotos;
    });
  };

  const handleContrastChange = (value: number) => {
    const oldEffects = { ...currentMonthPhoto.effects };
    execute({
      undo: () => {
        setMonthPhotos((prev) => {
          const newPhotos = [...prev];
          newPhotos[selectedMonth - 1] = {
            ...newPhotos[selectedMonth - 1],
            effects: oldEffects,
          };
          return newPhotos;
        });
      },
      redo: () => {
        setMonthPhotos((prev) => {
          const newPhotos = [...prev];
          newPhotos[selectedMonth - 1] = {
            ...newPhotos[selectedMonth - 1],
            effects: {
              ...newPhotos[selectedMonth - 1].effects,
              contrast: value,
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
        effects: {
          ...newPhotos[selectedMonth - 1].effects,
          contrast: value,
        },
      };
      return newPhotos;
    });
  };

  const handleSaturationChange = (value: number) => {
    const oldEffects = { ...currentMonthPhoto.effects };
    execute({
      undo: () => {
        setMonthPhotos((prev) => {
          const newPhotos = [...prev];
          newPhotos[selectedMonth - 1] = {
            ...newPhotos[selectedMonth - 1],
            effects: oldEffects,
          };
          return newPhotos;
        });
      },
      redo: () => {
        setMonthPhotos((prev) => {
          const newPhotos = [...prev];
          newPhotos[selectedMonth - 1] = {
            ...newPhotos[selectedMonth - 1],
            effects: {
              ...newPhotos[selectedMonth - 1].effects,
              saturation: value,
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
        effects: {
          ...newPhotos[selectedMonth - 1].effects,
          saturation: value,
        },
      };
      return newPhotos;
    });
  };

  const handleSepiaChange = (value: number) => {
    const oldEffects = { ...currentMonthPhoto.effects };
    execute({
      undo: () => {
        setMonthPhotos((prev) => {
          const newPhotos = [...prev];
          newPhotos[selectedMonth - 1] = {
            ...newPhotos[selectedMonth - 1],
            effects: oldEffects,
          };
          return newPhotos;
        });
      },
      redo: () => {
        setMonthPhotos((prev) => {
          const newPhotos = [...prev];
          newPhotos[selectedMonth - 1] = {
            ...newPhotos[selectedMonth - 1],
            effects: {
              ...newPhotos[selectedMonth - 1].effects,
              sepia: value,
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
        effects: {
          ...newPhotos[selectedMonth - 1].effects,
          sepia: value,
        },
      };
      return newPhotos;
    });
  };

  // Live updates para efectos
  const handleBrightnessLive = (value: number) => {
    setMonthPhotos((prev) => {
      const newPhotos = [...prev];
      newPhotos[selectedMonth - 1] = {
        ...newPhotos[selectedMonth - 1],
        effects: {
          ...newPhotos[selectedMonth - 1].effects,
          brightness: value,
        },
      };
      return newPhotos;
    });
  };

  const handleContrastLive = (value: number) => {
    setMonthPhotos((prev) => {
      const newPhotos = [...prev];
      newPhotos[selectedMonth - 1] = {
        ...newPhotos[selectedMonth - 1],
        effects: {
          ...newPhotos[selectedMonth - 1].effects,
          contrast: value,
        },
      };
      return newPhotos;
    });
  };

  const handleSaturationLive = (value: number) => {
    setMonthPhotos((prev) => {
      const newPhotos = [...prev];
      newPhotos[selectedMonth - 1] = {
        ...newPhotos[selectedMonth - 1],
        effects: {
          ...newPhotos[selectedMonth - 1].effects,
          saturation: value,
        },
      };
      return newPhotos;
    });
  };

  const handleSepiaLive = (value: number) => {
    setMonthPhotos((prev) => {
      const newPhotos = [...prev];
      newPhotos[selectedMonth - 1] = {
        ...newPhotos[selectedMonth - 1],
        effects: {
          ...newPhotos[selectedMonth - 1].effects,
          sepia: value,
        },
      };
      return newPhotos;
    });
  };

  const handleFilterSelect = (filter: string) => {
    const oldFilter = currentMonthPhoto.selectedFilter;
    execute({
      undo: () => {
        setMonthPhotos((prev) => {
          const newPhotos = [...prev];
          newPhotos[selectedMonth - 1] = {
            ...newPhotos[selectedMonth - 1],
            selectedFilter: oldFilter,
          };
          return newPhotos;
        });
      },
      redo: () => {
        setMonthPhotos((prev) => {
          const newPhotos = [...prev];
          newPhotos[selectedMonth - 1] = {
            ...newPhotos[selectedMonth - 1],
            selectedFilter: filter,
          };
          return newPhotos;
        });
      },
    });

    setMonthPhotos((prev) => {
      const newPhotos = [...prev];
      newPhotos[selectedMonth - 1] = {
        ...newPhotos[selectedMonth - 1],
        selectedFilter: filter,
      };
      return newPhotos;
    });
  };

  // ===== HANDLERS DE ESTILO DE CANVAS =====
  const handleBorderWidthChange = (value: number) => {
    const oldStyle = { ...currentMonthPhoto.canvasStyle };
    execute({
      undo: () => {
        setMonthPhotos((prev) => {
          const newPhotos = [...prev];
          newPhotos[selectedMonth - 1] = {
            ...newPhotos[selectedMonth - 1],
            canvasStyle: oldStyle,
          };
          return newPhotos;
        });
      },
      redo: () => {
        setMonthPhotos((prev) => {
          const newPhotos = [...prev];
          newPhotos[selectedMonth - 1] = {
            ...newPhotos[selectedMonth - 1],
            canvasStyle: {
              ...newPhotos[selectedMonth - 1].canvasStyle,
              borderWidth: value,
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
        canvasStyle: {
          ...newPhotos[selectedMonth - 1].canvasStyle,
          borderWidth: value,
        },
      };
      return newPhotos;
    });
  };

  const handleBorderWidthLive = (value: number) => {
    setMonthPhotos((prev) => {
      const newPhotos = [...prev];
      newPhotos[selectedMonth - 1] = {
        ...newPhotos[selectedMonth - 1],
        canvasStyle: {
          ...newPhotos[selectedMonth - 1].canvasStyle,
          borderWidth: value,
        },
      };
      return newPhotos;
    });
  };

  const handleBorderColorChange = (color: ColorResult) => {
    const oldStyle = { ...currentMonthPhoto.canvasStyle };
    execute({
      undo: () => {
        setMonthPhotos((prev) => {
          const newPhotos = [...prev];
          newPhotos[selectedMonth - 1] = {
            ...newPhotos[selectedMonth - 1],
            canvasStyle: oldStyle,
          };
          return newPhotos;
        });
      },
      redo: () => {
        setMonthPhotos((prev) => {
          const newPhotos = [...prev];
          newPhotos[selectedMonth - 1] = {
            ...newPhotos[selectedMonth - 1],
            canvasStyle: {
              ...newPhotos[selectedMonth - 1].canvasStyle,
              borderColor: color.hex,
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
        canvasStyle: {
          ...newPhotos[selectedMonth - 1].canvasStyle,
          borderColor: color.hex,
        },
      };
      return newPhotos;
    });
  };

  const handleBackgroundColorChange = (color: ColorResult) => {
    const oldStyle = { ...currentMonthPhoto.canvasStyle };
    execute({
      undo: () => {
        setMonthPhotos((prev) => {
          const newPhotos = [...prev];
          newPhotos[selectedMonth - 1] = {
            ...newPhotos[selectedMonth - 1],
            canvasStyle: oldStyle,
          };
          return newPhotos;
        });
      },
      redo: () => {
        setMonthPhotos((prev) => {
          const newPhotos = [...prev];
          newPhotos[selectedMonth - 1] = {
            ...newPhotos[selectedMonth - 1],
            canvasStyle: {
              ...newPhotos[selectedMonth - 1].canvasStyle,
              backgroundColor: color.hex,
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
        canvasStyle: {
          ...newPhotos[selectedMonth - 1].canvasStyle,
          backgroundColor: color.hex,
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

        // LÓGICA CORREGIDA: Permitir panear cuando la imagen es más grande que el área
        // Si la imagen es más grande, puedes moverla para ver diferentes partes
        // Si la imagen es más pequeña, se mantiene centrada

        let maxPosX, minPosX, maxPosY, minPosY;

        if (scaledImgWidth > PHOTO_AREA.width) {
          // Imagen más ancha que el área: permitir mover horizontalmente
          const halfOverflow = (scaledImgWidth - PHOTO_AREA.width) / 2;
          maxPosX = halfOverflow;   // Puedes mover a la derecha
          minPosX = -halfOverflow;  // Puedes mover a la izquierda
        } else {
          // Imagen más pequeña: mantener centrada, no permitir movimiento
          maxPosX = 0;
          minPosX = 0;
        }

        if (scaledImgHeight > PHOTO_AREA.height) {
          // Imagen más alta que el área: permitir mover verticalmente
          const halfOverflow = (scaledImgHeight - PHOTO_AREA.height) / 2;
          maxPosY = halfOverflow;   // Puedes mover hacia abajo
          minPosY = -halfOverflow;  // Puedes mover hacia arriba
        } else {
          // Imagen más pequeña: mantener centrada, no permitir movimiento
          maxPosY = 0;
          minPosY = 0;
        }

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
            transformations: { scale: 1, rotation: 0, posX: 0, posY: 0 },
            effects: { brightness: 0, contrast: 0, saturation: 0, sepia: 0 },
            selectedFilter: "none",
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
        transformations: { scale: 1, rotation: 0, posX: 0, posY: 0 },
        effects: { brightness: 0, contrast: 0, saturation: 0, sepia: 0 },
        selectedFilter: "none",
      };
      return newPhotos;
    });
  };

  // Copiar foto y edición desde otro mes
  const handleCopyFromMonth = () => {
    if (!copyFromMonth) {
      alert("Por favor selecciona un mes para copiar");
      return;
    }

    const sourceMonthIndex = parseInt(copyFromMonth) - 1;
    const sourceMonth = monthPhotos[sourceMonthIndex];

    if (!sourceMonth.imageSrc) {
      alert("El mes seleccionado no tiene foto");
      return;
    }

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
            imageSrc: sourceMonth.imageSrc,
            transformations: { ...sourceMonth.transformations },
            effects: { ...sourceMonth.effects },
            selectedFilter: sourceMonth.selectedFilter,
            canvasStyle: { ...sourceMonth.canvasStyle },
          };
          return newPhotos;
        });
      },
    });

    setMonthPhotos((prev) => {
      const newPhotos = [...prev];
      newPhotos[selectedMonth - 1] = {
        ...newPhotos[selectedMonth - 1],
        imageSrc: sourceMonth.imageSrc,
        transformations: { ...sourceMonth.transformations },
        effects: { ...sourceMonth.effects },
        selectedFilter: sourceMonth.selectedFilter,
        canvasStyle: { ...sourceMonth.canvasStyle },
      };
      return newPhotos;
    });

    // Copiar la imagen al ref para renderizado
    const sourceImage = photoImageRefs.current.get(sourceMonthIndex + 1);
    if (sourceImage) {
      photoImageRefs.current.set(selectedMonth, sourceImage);
    }

    setCopyFromMonth(""); // Reset selection
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

  // Función auxiliar para renderizar un mes específico y obtener el canvas como JPEG
  const renderMonthToDataURL = async (monthData: MonthPhoto): Promise<string | undefined> => {
    if (!monthData.imageSrc) return undefined;

    // Crear canvas temporal
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = calendarDimensions.width;
    tempCanvas.height = calendarDimensions.height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return undefined;

    try {
      const photoImg = photoImageRefs.current.get(monthData.month);

      if (photoImg) {
        // 1. Dibujar fondo difuminado
        ctx.save();
        ctx.beginPath();
        ctx.rect(PHOTO_AREA.left, PHOTO_AREA.top, PHOTO_AREA.width, PHOTO_AREA.height);
        ctx.clip();

        // Dibujar fondo blur usando la función auxiliar con offset correcto
        drawBlurredBackground(ctx, photoImg, PHOTO_AREA.left, PHOTO_AREA.top, PHOTO_AREA.width, PHOTO_AREA.height);
        ctx.restore();

        // 2. Dibujar la foto del usuario encima del blur (CON CLIP)
        ctx.save();

        // IMPORTANTE: Aplicar clip para que la imagen NO se salga del área
        ctx.beginPath();
        ctx.rect(PHOTO_AREA.left, PHOTO_AREA.top, PHOTO_AREA.width, PHOTO_AREA.height);
        ctx.clip();

        const { scale, posX, posY } = monthData.transformations;
        // Centro del ÁREA de foto (no del canvas completo)
        const centerX = PHOTO_AREA.left + (PHOTO_AREA.width / 2);
        const centerY = PHOTO_AREA.top + (PHOTO_AREA.height / 2);

        ctx.translate(centerX + posX, centerY + posY);
        ctx.scale(scale, scale);
        ctx.drawImage(photoImg, -photoImg.width / 2, -photoImg.height / 2, photoImg.width, photoImg.height);
        ctx.restore();
      }

      // 3. Cargar y dibujar el template del calendario encima
      const templateImg = new Image();
      const calendarFile = MONTH_CALENDAR_FILES[monthData.month];

      await new Promise<void>((resolve, reject) => {
        templateImg.onload = () => resolve();
        templateImg.onerror = () => reject(new Error(`Error cargando template ${calendarFile}`));
        templateImg.src = calendarFile;
      });

      ctx.drawImage(templateImg, 0, 0, calendarDimensions.width, calendarDimensions.height);

      // 4. Convertir a JPEG (WYSIWYG con fondo blur incluido)
      const renderedImageSrc = tempCanvas.toDataURL("image/jpeg", 0.95);

      console.log(`📅 Mes ${MONTHS[monthData.month - 1]} renderizado:`);
      console.log(`   - Tamaño original: ${(monthData.imageSrc.length / 1024).toFixed(2)} KB`);
      console.log(`   - Tamaño renderizado JPEG: ${(renderedImageSrc.length / 1024).toFixed(2)} KB`);

      return renderedImageSrc;
    } catch (error) {
      console.error(`Error renderizando mes ${monthData.month}:`, error);
      return undefined;
    }
  };

  // Renderizar SOLO el área de la foto (recortada, sin template) para impresión
  const renderCroppedPhotoToDataURL = async (monthData: MonthPhoto): Promise<string | undefined> => {
    if (!monthData.imageSrc) return undefined;

    // Crear canvas del tamaño del ÁREA DE FOTO únicamente
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = PHOTO_AREA.width;
    tempCanvas.height = PHOTO_AREA.height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return undefined;

    try {
      const photoImg = photoImageRefs.current.get(monthData.month);

      if (photoImg) {
        // 1. Dibujar fondo difuminado (ahora desde 0,0 porque el canvas ES el área)
        ctx.save();
        drawBlurredBackground(ctx, photoImg, 0, 0, PHOTO_AREA.width, PHOTO_AREA.height);
        ctx.restore();

        // 2. Dibujar la foto del usuario encima del blur
        ctx.save();
        const { scale, posX, posY } = monthData.transformations;

        // Centro del canvas (que ahora ES el área de foto)
        const centerX = PHOTO_AREA.width / 2;
        const centerY = PHOTO_AREA.height / 2;

        // Clip para asegurar que nada se salga del área
        ctx.beginPath();
        ctx.rect(0, 0, PHOTO_AREA.width, PHOTO_AREA.height);
        ctx.clip();

        ctx.translate(centerX + posX, centerY + posY);
        ctx.scale(scale, scale);
        ctx.drawImage(photoImg, -photoImg.width / 2, -photoImg.height / 2, photoImg.width, photoImg.height);
        ctx.restore();
      }

      // 3. Convertir a JPEG (SOLO el área de foto, sin template)
      const croppedImageSrc = tempCanvas.toDataURL("image/jpeg", 0.95);

      console.log(`✂️ Área recortada del mes ${MONTHS[monthData.month - 1]}:`);
      console.log(`   - Dimensiones: ${PHOTO_AREA.width}px × ${PHOTO_AREA.height}px`);
      console.log(`   - Tamaño JPEG: ${(croppedImageSrc.length / 1024).toFixed(2)} KB`);

      return croppedImageSrc;
    } catch (error) {
      console.error(`Error renderizando área recortada mes ${monthData.month}:`, error);
      return undefined;
    }
  };

  // Guardar y volver al carrito
  const saveProgress = () => {
    if (!isCartMode || !cartItemId || !instanceIndex) return;

    const customizationData: CalendarCustomization = {
      months: monthPhotos.map((monthData) => ({
        month: monthData.month,
        imageSrc: monthData.imageSrc,
        transformations: monthData.transformations,
        effects: monthData.effects,
        selectedFilter: monthData.selectedFilter,
        canvasStyle: monthData.canvasStyle,
      })),
    };

    const editorType = category ? getEditorType(category) : "calendar";

    saveCustomization({
      cartItemId: parseInt(cartItemId),
      instanceIndex: parseInt(instanceIndex),
      editorType,
      data: customizationData,
      completed: completedMonths >= 12,
    });
  };

  const handleSaveToCart = async () => {
    if (!isCartMode || !cartItemId || !instanceIndex) return;
    saveProgress();
    router.push("/user/cart");
  };

  const [showSavedMessage, setShowSavedMessage] = useState(false);

  const handleSaveProgress = () => {
    saveProgress();
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 3000);
  };

  const handleCancelEdit = () => {
    router.push("/user/cart");
  };

  return (
    <>
      {/* Disclaimer que debe aceptarse antes de usar el editor */}
      {!disclaimerAccepted && (
        <EditorDisclaimer onAccept={() => setDisclaimerAccepted(true)} />
      )}

      {/* Editor principal - solo visible después de aceptar disclaimer */}
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
                        ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/70"
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

            {/* Opciones de edición */}
            {currentMonthPhoto.imageSrc && (
              <div className="mt-4">
                <Accordion
                  type="single"
                  collapsible
                  value={activeTab || undefined}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <AccordionItem value="transform">
                    <AccordionTrigger className="py-2 flex flex-row justify-between items-center gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Settings2 className="h-4 w-4" />
                        Transformar
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <TransformTab
                        scale={currentMonthPhoto.transformations.scale}
                        rotation={currentMonthPhoto.transformations.rotation}
                        posX={currentMonthPhoto.transformations.posX}
                        posY={currentMonthPhoto.transformations.posY}
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
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Arrastra la imagen para posicionarla
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="adjust">
                    <AccordionTrigger className="py-2 flex flex-row justify-between items-center gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Settings2 className="h-4 w-4" />
                        Ajustar
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <AdjustTab
                        imageSrc={currentMonthPhoto.imageSrc}
                        brightness={currentMonthPhoto.effects.brightness}
                        contrast={currentMonthPhoto.effects.contrast}
                        saturation={currentMonthPhoto.effects.saturation}
                        sepia={currentMonthPhoto.effects.sepia}
                        selectedFilter={currentMonthPhoto.selectedFilter}
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

                </Accordion>
              </div>
            )}

            {/* Copiar desde otro mes */}
            <div className="bg-primary/5 rounded-xl p-3 sm:p-4 border-2 border-primary/20 space-y-3 mt-3">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                <label className="text-sm font-medium">Reutilizar foto de otro mes</label>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Copia la foto y toda su edición desde otro mes a este mes
              </p>
              <Select value={copyFromMonth} onValueChange={setCopyFromMonth}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar mes..." />
                </SelectTrigger>
                <SelectContent>
                  {monthPhotos
                    .filter((m) => m.month !== selectedMonth)
                    .map((m) => (
                      <SelectItem key={m.month} value={m.month.toString()}>
                        {MONTHS[m.month - 1]}{m.imageSrc ? "" : " (sin foto)"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleCopyFromMonth}
                disabled={!copyFromMonth || !monthPhotos[parseInt(copyFromMonth || "0") - 1]?.imageSrc}
                variant="secondary"
                className="w-full"
                size="sm"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Copiar foto seleccionada
              </Button>
              {copyFromMonth && !monthPhotos[parseInt(copyFromMonth) - 1]?.imageSrc && (
                <p className="text-xs text-amber-600 text-center">
                  {MONTHS[parseInt(copyFromMonth) - 1]} no tiene foto cargada
                </p>
              )}
            </div>

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

          {/* Vista Previa del Calendario */}
          {currentMonthPhoto.imageSrc && (
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-3 sm:p-4 shadow-sm border-2 border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Vista Previa
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={generatePreview}
                  disabled={isGeneratingPreview}
                  className="h-7 text-xs"
                >
                  {isGeneratingPreview ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    "Actualizar"
                  )}
                </Button>
              </div>

              {previewThumbnail ? (
                <div className="space-y-2">
                  <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden border-2 border-primary/30">
                    <img
                      src={previewThumbnail}
                      alt={`Vista previa ${MONTHS[selectedMonth - 1]}`}
                      className="w-full h-auto"
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Así se verá tu calendario impreso
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/30">
                  {isGeneratingPreview ? (
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  ) : (
                    <p className="text-sm text-muted-foreground">Generando vista previa...</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Botones de acción del carrito */}
          {isCartMode ? (
            <div className="bg-primary/5 rounded-xl p-3 sm:p-4 border-2 border-primary/20 space-y-3">
              <Button
                onClick={handleSaveProgress}
                variant="outline"
                className="w-full h-10 text-sm"
              >
                <Save className="mr-2 h-4 w-4" />
                {showSavedMessage ? "Progreso guardado" : "Guardar progreso"}
              </Button>
              {showSavedMessage && (
                <p className="text-xs text-green-600 text-center">
                  Tu progreso ha sido guardado. Puedes continuar después.
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveToCart}
                  className="flex-1 h-12 text-base font-semibold"
                  disabled={completedMonths < 12}
                >
                  <Check className="mr-2 h-5 w-5" />
                  Finalizar
                </Button>
                <Button
                  onClick={() => { saveProgress(); router.push("/user/cart"); }}
                  variant="outline"
                  className="flex-1 h-12 text-base"
                >
                  <ChevronLeft className="mr-2 h-5 w-5" />
                  Volver al carrito
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
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
              width={calendarDimensions.width}
              height={calendarDimensions.height}
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
    </>
  );
}
