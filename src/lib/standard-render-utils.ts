/**
 * Utilidades para renderizar imágenes estándar
 * Genera la imagen renderizada con todas las transformaciones aplicadas
 * IMPORTANTE: Exporta PNG con 300 DPI embebido para impresión de calidad
 * Las dimensiones se calculan dinámicamente según el paquete
 */

import { SavedStandardImage } from "@/stores/customization-store";
import { Effect } from "@/lib/types";
import { canvasToBlobWithDPI, addPrintMetadataToPNG } from "@/lib/png-dpi";

/**
 * Carga una imagen desde una URL
 */
async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Error cargando imagen`));
    img.src = src;
  });
}

/**
 * Convierte un Blob a data URL
 */
async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Aplica filtros de color a un canvas
 */
function applyFilters(ctx: CanvasRenderingContext2D, selectedFilter: string) {
  if (selectedFilter === "grayscale") {
    ctx.filter = "grayscale(100%)";
  } else if (selectedFilter === "sepia") {
    ctx.filter = "sepia(100%)";
  } else if (selectedFilter === "invert") {
    ctx.filter = "invert(100%)";
  } else {
    ctx.filter = "none";
  }
}

/**
 * Aplica efectos personalizados (brightness, contrast, saturate, sepia)
 */
function applyEffects(ctx: CanvasRenderingContext2D, effects: Effect[]) {
  const brightness = effects.find(e => e.type === "brightness");
  const contrast = effects.find(e => e.type === "contrast");
  const saturate = effects.find(e => e.type === "saturate");
  const sepia = effects.find(e => e.type === "sepia");

  let filterString = "";

  if (brightness) {
    const value = ((brightness.value + 100) / 100);
    filterString += `brightness(${value}) `;
  }
  if (contrast) {
    const value = ((contrast.value + 100) / 100);
    filterString += `contrast(${value}) `;
  }
  if (saturate) {
    const value = ((saturate.value + 100) / 100);
    filterString += `saturate(${value}) `;
  }
  if (sepia && sepia.value > 0) {
    const value = sepia.value / 100;
    filterString += `sepia(${value}) `;
  }

  ctx.filter = filterString || "none";
}

/**
 * Renderiza una imagen estándar con todas las transformaciones
 */
export async function renderStandardImage(
  imageData: SavedStandardImage
): Promise<string | undefined> {
  if (!imageData.imageSrc) return undefined;

  // Obtener dimensiones físicas y resolución de impresión
  // Si no existen (imágenes antiguas), usar valores por defecto de 4×6 a 300 DPI
  const printDims = imageData.printDimensions || {
    widthInches: 4,
    heightInches: 6,
    resolution: 300,
  };

  // Calcular dimensiones del canvas en pixels
  const CANVAS_WIDTH = Math.round(printDims.widthInches * printDims.resolution);
  const CANVAS_HEIGHT = Math.round(printDims.heightInches * printDims.resolution);

  console.log(`📐 Renderizando: ${printDims.widthInches}"×${printDims.heightInches}" a ${printDims.resolution} DPI = ${CANVAS_WIDTH}×${CANVAS_HEIGHT} px`);

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  try {
    const img = await loadImage(imageData.imageSrc);

    // 1. Dibujar fondo (color de fondo del canvas)
    ctx.fillStyle = imageData.canvasStyle.backgroundColor || "#ffffff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Dibujar la imagen con transformaciones
    ctx.save();

    const { scale, rotation, mirrorX, mirrorY, posX, posY } = imageData.transformations;
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;

    // Aplicar transformaciones
    ctx.translate(centerX + posX, centerY + posY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(mirrorX ? -scale : scale, mirrorY ? -scale : scale);

    // Aplicar efectos y filtros
    applyEffects(ctx, imageData.effects);
    applyFilters(ctx, imageData.selectedFilter);

    // Dibujar imagen
    ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);

    ctx.restore();

    // 3. Dibujar borde si existe
    if (imageData.canvasStyle.borderWidth > 0) {
      ctx.strokeStyle = imageData.canvasStyle.borderColor || "#000000";
      ctx.lineWidth = imageData.canvasStyle.borderWidth;
      ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // 4. Convertir a PNG con DPI para impresión de calidad
    const blob = await canvasToBlobWithDPI(canvas, printDims.resolution, 0.95);

    // 5. Agregar metadatos de dimensiones físicas (tEXt chunks)
    const blobWithMetadata = await addPrintMetadataToPNG(
      blob,
      printDims.widthInches,
      printDims.heightInches,
      printDims.resolution
    );

    const dataURL = await blobToDataURL(blobWithMetadata);

    console.log(
      `✅ Imagen estándar renderizada: ${printDims.widthInches}"×${printDims.heightInches}" ` +
      `a ${printDims.resolution} DPI (${(blobWithMetadata.size / 1024 / 1024).toFixed(2)} MB)`
    );

    return dataURL;
  } catch (error) {
    console.error("Error renderizando imagen estándar:", error);
    return undefined;
  }
}
