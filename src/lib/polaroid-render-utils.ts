/**
 * Utilidades para renderizar polaroids
 * Genera el polaroid completo con marco y transformaciones
 * IMPORTANTE: Exporta PNG con 300 DPI embebido para impresión de calidad
 */

import { canvasToBlobWithDPI, addPrintMetadataToPNG } from "@/lib/png-dpi";

interface PolaroidData {
  imageSrc: string;
  transformations: {
    scale: number;
    rotation?: number; // NUEVO: Soporte para rotación
    posX: number;
    posY: number;
  };
  effects?: { // NUEVO: Soporte para efectos
    brightness: number;
    contrast: number;
    saturation: number;
    sepia: number;
  };
  selectedFilter?: string; // NUEVO: Soporte para filtros
  canvasStyle?: { // NUEVO: Soporte para estilos de canvas
    borderColor: string;
    borderWidth: number;
    backgroundColor: string;
  };
}

// DEPRECADO: Funcionalidad de polaroid doble removida
// Se mantiene la interfaz para compatibilidad con datos existentes
interface DoublePolaroidData {
  imageSrc1: string;
  transformations1: {
    scale: number;
    posX: number;
    posY: number;
  };
  imageSrc2: string;
  transformations2: {
    scale: number;
    posX: number;
    posY: number;
  };
}

// DEPRECADO: Dimensiones hardcodeadas (se mantienen solo para compatibilidad con llamadas antiguas)
const POLAROID_WIDTH = 800;
const POLAROID_HEIGHT = 1000;

// Área de la foto dentro del polaroid (se mantiene solo para compatibilidad con llamadas antiguas)
const PHOTO_AREA = {
  top: 50,
  left: 50,
  width: 700,
  height: 700,
};

// Interfaz para parámetros de renderizado (usada en las nuevas funciones)
export interface RenderOptions {
  canvasWidth: number; // Ancho del canvas en pixels (a exportResolution DPI)
  canvasHeight: number; // Alto del canvas en pixels (a exportResolution DPI)
  widthInches: number; // Ancho en pulgadas (para metadatos de impresión)
  heightInches: number; // Alto en pulgadas (para metadatos de impresión)
  exportResolution: number; // DPI (300)
  photoArea: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

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
 * Renderiza un polaroid completo usando el template PNG como overlay
 * @param polaroidData - Datos del polaroid (imagen, transformaciones, efectos)
 * @param options - Opciones de renderizado (dimensiones, DPI). Si no se proporciona, usa dimensiones hardcodeadas (800×1000)
 */
export async function renderPolaroid(
  polaroidData: PolaroidData,
  options?: RenderOptions
): Promise<string | undefined> {
  if (!polaroidData.imageSrc) return undefined;

  // Usar opciones proporcionadas o valores hardcodeados para compatibilidad
  const canvasWidth = options?.canvasWidth ?? POLAROID_WIDTH;
  const canvasHeight = options?.canvasHeight ?? POLAROID_HEIGHT;
  const photoArea = options?.photoArea ?? PHOTO_AREA;
  const exportResolution = options?.exportResolution ?? 300;
  const widthInches = options?.widthInches ?? (canvasWidth / exportResolution);
  const heightInches = options?.heightInches ?? (canvasHeight / exportResolution);

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  try {
    const [img, templateImg] = await Promise.all([
      loadImage(polaroidData.imageSrc),
      loadImage("/polaroid/Polaroid.png"),
    ]);

    // 1. Dibujar la foto del usuario con transformaciones (clipped al photo area)
    ctx.save();

    ctx.beginPath();
    ctx.rect(photoArea.left, photoArea.top, photoArea.width, photoArea.height);
    ctx.clip();

    const { scale, rotation = 0, posX, posY } = polaroidData.transformations;
    const centerX = photoArea.left + photoArea.width / 2;
    const centerY = photoArea.top + photoArea.height / 2;

    ctx.translate(centerX + posX, centerY + posY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    // Aplicar filtros CSS
    const effects = polaroidData.effects ?? { brightness: 0, contrast: 0, saturation: 0, sepia: 0 };
    const selectedFilter = polaroidData.selectedFilter ?? "none";
    const filters: string[] = [];

    if (selectedFilter === "blackwhite") {
      filters.push("grayscale(100%)");
    } else if (selectedFilter === "sepia") {
      filters.push("sepia(100%)");
    } else {
      if (effects.brightness !== 0) filters.push(`brightness(${1 + effects.brightness / 100})`);
      if (effects.contrast !== 0) filters.push(`contrast(${1 + effects.contrast / 100})`);
      if (effects.saturation !== 0) filters.push(`saturate(${1 + effects.saturation / 100})`);
      if (effects.sepia !== 0) filters.push(`sepia(${effects.sepia / 100})`);
    }

    if (filters.length > 0) {
      ctx.filter = filters.join(" ");
    }

    ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);

    ctx.restore();

    // 2. Dibujar el template PNG encima como overlay (el marco tapa los bordes de la foto)
    ctx.drawImage(templateImg, 0, 0, canvasWidth, canvasHeight);

    // 3. Convertir a PNG con DPI y metadatos de impresión
    const blob = await canvasToBlobWithDPI(canvas, exportResolution, 0.95);
    const blobWithMetadata = await addPrintMetadataToPNG(blob, widthInches, heightInches, exportResolution);
    const dataURL = await blobToDataURL(blobWithMetadata);

    console.log(`✅ Polaroid renderizado como PNG con ${exportResolution} DPI (${(blobWithMetadata.size / 1024 / 1024).toFixed(2)} MB) - ${widthInches}"×${heightInches}"`);

    return dataURL;
  } catch (error) {
    console.error("Error renderizando polaroid:", error);
    return undefined;
  }
}

/**
 * Renderiza SOLO el área de la foto (sin marco) para impresión
 * @param polaroidData - Datos del polaroid (imagen, transformaciones, efectos)
 * @param options - Opciones de renderizado (dimensiones, DPI). Si no se proporciona, usa dimensiones hardcodeadas
 */
export async function renderPolaroidCropped(
  polaroidData: PolaroidData,
  options?: RenderOptions
): Promise<string | undefined> {
  if (!polaroidData.imageSrc) return undefined;

  // Usar opciones proporcionadas o valores hardcodeados para compatibilidad
  const photoArea = options?.photoArea ?? PHOTO_AREA;
  const exportResolution = options?.exportResolution ?? 300;
  const widthInches = options?.widthInches ?? (photoArea.width / exportResolution);
  const heightInches = options?.heightInches ?? (photoArea.height / exportResolution);

  const canvas = document.createElement("canvas");
  canvas.width = photoArea.width;
  canvas.height = photoArea.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  try {
    const img = await loadImage(polaroidData.imageSrc);

    // Dibujar solo la foto con transformaciones (sin marco)
    ctx.save();

    // Crear clipping path para que la foto no se salga del área
    ctx.beginPath();
    ctx.rect(0, 0, photoArea.width, photoArea.height);
    ctx.clip();

    const { scale, rotation = 0, posX, posY } = polaroidData.transformations;
    const centerX = photoArea.width / 2;
    const centerY = photoArea.height / 2;

    // Aplicar transformaciones
    ctx.translate(centerX + posX, centerY + posY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    // Aplicar filtros CSS
    const effects = polaroidData.effects ?? { brightness: 0, contrast: 0, saturation: 0, sepia: 0 };
    const selectedFilter = polaroidData.selectedFilter ?? "none";
    const filters: string[] = [];

    // Aplicar filtro seleccionado
    if (selectedFilter === "blackwhite") {
      filters.push("grayscale(100%)");
    } else if (selectedFilter === "sepia") {
      filters.push("sepia(100%)");
    } else {
      // Aplicar ajustes manuales
      if (effects.brightness !== 0) filters.push(`brightness(${1 + effects.brightness / 100})`);
      if (effects.contrast !== 0) filters.push(`contrast(${1 + effects.contrast / 100})`);
      if (effects.saturation !== 0) filters.push(`saturate(${1 + effects.saturation / 100})`);
      if (effects.sepia !== 0) filters.push(`sepia(${effects.sepia / 100})`);
    }

    if (filters.length > 0) {
      ctx.filter = filters.join(" ");
    }

    // Dibujar imagen
    ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);

    ctx.restore();

    // Convertir a PNG con DPI y metadatos de impresión
    const blob = await canvasToBlobWithDPI(canvas, exportResolution, 0.95);
    const blobWithMetadata = await addPrintMetadataToPNG(blob, widthInches, heightInches, exportResolution);
    const dataURL = await blobToDataURL(blobWithMetadata);

    console.log(`✅ Área recortada polaroid renderizada como PNG con ${exportResolution} DPI (${(blobWithMetadata.size / 1024 / 1024).toFixed(2)} MB) - ${widthInches}"×${heightInches}"`);

    return dataURL;
  } catch (error) {
    console.error("Error renderizando área recortada polaroid:", error);
    return undefined;
  }
}

/**
 * DEPRECADO: Renderiza un polaroid doble (dos polaroids lado a lado)
 * Esta funcionalidad ha sido removida del editor.
 * Se mantiene para compatibilidad con datos existentes.
 */
export async function renderDoublePolaroid(
  doublePolaroidData: DoublePolaroidData
): Promise<string | undefined> {
  if (!doublePolaroidData.imageSrc1 || !doublePolaroidData.imageSrc2) {
    return undefined;
  }

  // Canvas para dos polaroids lado a lado
  const DOUBLE_WIDTH = POLAROID_WIDTH * 2;
  const DOUBLE_HEIGHT = POLAROID_HEIGHT;

  const canvas = document.createElement("canvas");
  canvas.width = DOUBLE_WIDTH;
  canvas.height = DOUBLE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  try {
    const img1 = await loadImage(doublePolaroidData.imageSrc1);
    const img2 = await loadImage(doublePolaroidData.imageSrc2);

    // ===== POLAROID 1 (IZQUIERDO) =====
    // 1. Dibujar marco blanco del primer polaroid
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, POLAROID_WIDTH, POLAROID_HEIGHT);

    // 2. Dibujar la primera foto con transformaciones
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

    const { scale: scale1, posX: posX1, posY: posY1 } = doublePolaroidData.transformations1;
    const centerX1 = PHOTO_AREA.left + PHOTO_AREA.width / 2;
    const centerY1 = PHOTO_AREA.top + PHOTO_AREA.height / 2;

    // Aplicar transformaciones
    ctx.translate(centerX1 + posX1, centerY1 + posY1);
    ctx.scale(scale1, scale1);

    // Dibujar primera imagen
    ctx.drawImage(img1, -img1.width / 2, -img1.height / 2, img1.width, img1.height);

    ctx.restore();

    // ===== POLAROID 2 (DERECHO) =====
    // 1. Dibujar marco blanco del segundo polaroid (offset por POLAROID_WIDTH)
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(POLAROID_WIDTH, 0, POLAROID_WIDTH, POLAROID_HEIGHT);

    // 2. Dibujar la segunda foto con transformaciones
    ctx.save();

    // Crear clipping path para la segunda foto
    ctx.beginPath();
    ctx.rect(
      POLAROID_WIDTH + PHOTO_AREA.left,
      PHOTO_AREA.top,
      PHOTO_AREA.width,
      PHOTO_AREA.height
    );
    ctx.clip();

    const { scale: scale2, posX: posX2, posY: posY2 } = doublePolaroidData.transformations2;
    const centerX2 = POLAROID_WIDTH + PHOTO_AREA.left + PHOTO_AREA.width / 2;
    const centerY2 = PHOTO_AREA.top + PHOTO_AREA.height / 2;

    // Aplicar transformaciones
    ctx.translate(centerX2 + posX2, centerY2 + posY2);
    ctx.scale(scale2, scale2);

    // Dibujar segunda imagen
    ctx.drawImage(img2, -img2.width / 2, -img2.height / 2, img2.width, img2.height);

    ctx.restore();

    // 3. Convertir a PNG con 300 DPI para impresión de calidad
    const blob = await canvasToBlobWithDPI(canvas, 300, 0.95);
    const dataURL = await blobToDataURL(blob);

    console.log(`✅ Polaroid doble renderizado como PNG con 300 DPI (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);

    return dataURL;
  } catch (error) {
    console.error("Error renderizando polaroid doble:", error);
    return undefined;
  }
}

/**
 * DEPRECADO: Renderiza SOLO las áreas de las fotos (sin marcos) para impresión de polaroid doble
 * Esta funcionalidad ha sido removida del editor.
 * Se mantiene para compatibilidad con datos existentes.
 */
export async function renderDoublePolaroidCropped(
  doublePolaroidData: DoublePolaroidData
): Promise<string | undefined> {
  if (!doublePolaroidData.imageSrc1 || !doublePolaroidData.imageSrc2) {
    return undefined;
  }

  // Canvas para dos áreas de foto lado a lado (sin marcos)
  const DOUBLE_CROPPED_WIDTH = PHOTO_AREA.width * 2;
  const DOUBLE_CROPPED_HEIGHT = PHOTO_AREA.height;

  const canvas = document.createElement("canvas");
  canvas.width = DOUBLE_CROPPED_WIDTH;
  canvas.height = DOUBLE_CROPPED_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  try {
    const img1 = await loadImage(doublePolaroidData.imageSrc1);
    const img2 = await loadImage(doublePolaroidData.imageSrc2);

    // ===== FOTO 1 (IZQUIERDA) - SOLO ÁREA DE FOTO =====
    ctx.save();

    // Crear clipping path para la primera foto
    ctx.beginPath();
    ctx.rect(0, 0, PHOTO_AREA.width, PHOTO_AREA.height);
    ctx.clip();

    const { scale: scale1, posX: posX1, posY: posY1 } = doublePolaroidData.transformations1;
    const centerX1 = PHOTO_AREA.width / 2;
    const centerY1 = PHOTO_AREA.height / 2;

    // Aplicar transformaciones
    ctx.translate(centerX1 + posX1, centerY1 + posY1);
    ctx.scale(scale1, scale1);

    // Dibujar primera imagen
    ctx.drawImage(img1, -img1.width / 2, -img1.height / 2, img1.width, img1.height);

    ctx.restore();

    // ===== FOTO 2 (DERECHA) - SOLO ÁREA DE FOTO =====
    ctx.save();

    // Crear clipping path para la segunda foto (offset por PHOTO_AREA.width)
    ctx.beginPath();
    ctx.rect(PHOTO_AREA.width, 0, PHOTO_AREA.width, PHOTO_AREA.height);
    ctx.clip();

    const { scale: scale2, posX: posX2, posY: posY2 } = doublePolaroidData.transformations2;
    const centerX2 = PHOTO_AREA.width + PHOTO_AREA.width / 2;
    const centerY2 = PHOTO_AREA.height / 2;

    // Aplicar transformaciones
    ctx.translate(centerX2 + posX2, centerY2 + posY2);
    ctx.scale(scale2, scale2);

    // Dibujar segunda imagen
    ctx.drawImage(img2, -img2.width / 2, -img2.height / 2, img2.width, img2.height);

    ctx.restore();

    // Convertir a PNG con 300 DPI para impresión de calidad
    const blob = await canvasToBlobWithDPI(canvas, 300, 0.95);
    const dataURL = await blobToDataURL(blob);

    console.log(`✅ Áreas recortadas polaroid doble renderizadas como PNG con 300 DPI (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);

    return dataURL;
  } catch (error) {
    console.error("Error renderizando áreas recortadas polaroid doble:", error);
    return undefined;
  }
}
