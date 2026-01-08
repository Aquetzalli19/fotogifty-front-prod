/**
 * Utilidades para renderizar polaroids
 * Genera el polaroid completo con marco y transformaciones
 * IMPORTANTE: Exporta PNG con 300 DPI embebido para impresión de calidad
 */

import { canvasToBlobWithDPI } from "@/lib/png-dpi";

interface PolaroidData {
  imageSrc: string;
  transformations: {
    scale: number;
    posX: number;
    posY: number;
  };
}

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

// Dimensiones del polaroid
const POLAROID_WIDTH = 800;
const POLAROID_HEIGHT = 1000;

// Área de la foto dentro del polaroid
const PHOTO_AREA = {
  top: 50,
  left: 50,
  width: 700,
  height: 700,
};

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
 * Renderiza un polaroid completo con marco blanco
 */
export async function renderPolaroid(
  polaroidData: PolaroidData
): Promise<string | undefined> {
  if (!polaroidData.imageSrc) return undefined;

  const canvas = document.createElement("canvas");
  canvas.width = POLAROID_WIDTH;
  canvas.height = POLAROID_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  try {
    const img = await loadImage(polaroidData.imageSrc);

    // 1. Dibujar marco blanco del polaroid
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, POLAROID_WIDTH, POLAROID_HEIGHT);

    // 2. Dibujar la foto con transformaciones
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

    const { scale, posX, posY } = polaroidData.transformations;
    const centerX = PHOTO_AREA.left + PHOTO_AREA.width / 2;
    const centerY = PHOTO_AREA.top + PHOTO_AREA.height / 2;

    // Aplicar transformaciones
    ctx.translate(centerX + posX, centerY + posY);
    ctx.scale(scale, scale);

    // Dibujar imagen
    ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);

    ctx.restore();

    // 3. Convertir a PNG con 300 DPI para impresión de calidad
    const blob = await canvasToBlobWithDPI(canvas, 300, 0.95);
    const dataURL = await blobToDataURL(blob);

    console.log(`✅ Polaroid renderizado como PNG con 300 DPI (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);

    return dataURL;
  } catch (error) {
    console.error("Error renderizando polaroid:", error);
    return undefined;
  }
}

/**
 * Renderiza SOLO el área de la foto (sin marco) para impresión
 */
export async function renderPolaroidCropped(
  polaroidData: PolaroidData
): Promise<string | undefined> {
  if (!polaroidData.imageSrc) return undefined;

  const canvas = document.createElement("canvas");
  canvas.width = PHOTO_AREA.width;
  canvas.height = PHOTO_AREA.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  try {
    const img = await loadImage(polaroidData.imageSrc);

    // Dibujar solo la foto con transformaciones (sin marco)
    ctx.save();

    // Crear clipping path para que la foto no se salga del área
    ctx.beginPath();
    ctx.rect(0, 0, PHOTO_AREA.width, PHOTO_AREA.height);
    ctx.clip();

    const { scale, posX, posY } = polaroidData.transformations;
    const centerX = PHOTO_AREA.width / 2;
    const centerY = PHOTO_AREA.height / 2;

    // Aplicar transformaciones
    ctx.translate(centerX + posX, centerY + posY);
    ctx.scale(scale, scale);

    // Dibujar imagen
    ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);

    ctx.restore();

    // Convertir a PNG con 300 DPI para impresión de calidad
    const blob = await canvasToBlobWithDPI(canvas, 300, 0.95);
    const dataURL = await blobToDataURL(blob);

    console.log(`✅ Área recortada polaroid renderizada como PNG con 300 DPI (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);

    return dataURL;
  } catch (error) {
    console.error("Error renderizando área recortada polaroid:", error);
    return undefined;
  }
}

/**
 * Renderiza un polaroid doble (dos polaroids lado a lado)
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
 * Renderiza SOLO las áreas de las fotos (sin marcos) para impresión de polaroid doble
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
