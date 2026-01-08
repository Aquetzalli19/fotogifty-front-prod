/**
 * Utilidades para renderizar calendarios
 * Funciones compartidas entre CalendarEditor y order-success
 * IMPORTANTE: Exporta PNG con 300 DPI embebido para impresión de calidad
 */

import { canvasToBlobWithDPI } from "@/lib/png-dpi";

// Archivos de templates de calendarios por mes
export const MONTH_CALENDAR_FILES = {
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

// Configuración del área de foto del calendario
export const PHOTO_AREA_CONFIG = {
  HEIGHT_PERCENT: 0.47,
  TOP_PERCENT: 0.0758,
  LEFT_PERCENT: 0.0278,
  WIDTH_PERCENT: 0.944,
};

interface MonthData {
  month: number;
  imageSrc: string | null;
  transformations: {
    scale: number;
    posX: number;
    posY: number;
  };
}

/**
 * Dibuja un fondo difuminado de la imagen
 */
function drawBlurredBackground(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  areaLeft: number,
  areaTop: number,
  areaWidth: number,
  areaHeight: number
) {
  ctx.save();

  const imgRatio = img.width / img.height;
  const areaRatio = areaWidth / areaHeight;

  let drawWidth, drawHeight, offsetX, offsetY;

  if (imgRatio > areaRatio) {
    drawHeight = areaHeight;
    drawWidth = img.width * (areaHeight / img.height);
    offsetX = areaLeft - (drawWidth - areaWidth) / 2;
    offsetY = areaTop;
  } else {
    drawWidth = areaWidth;
    drawHeight = img.height * (areaWidth / img.width);
    offsetX = areaLeft;
    offsetY = areaTop - (drawHeight - areaHeight) / 2;
  }

  ctx.filter = "blur(25px)";
  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  ctx.filter = "none";

  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.fillRect(areaLeft, areaTop, areaWidth, areaHeight);

  ctx.restore();
}

/**
 * Carga una imagen desde una URL (data URL o HTTP)
 */
async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Error cargando imagen: ${src.substring(0, 50)}...`));
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
 * Renderiza un mes del calendario completo (con template)
 */
export async function renderCalendarMonth(
  monthData: MonthData,
  calendarWidth: number = 2400,
  calendarHeight: number = 3600
): Promise<string | undefined> {
  if (!monthData.imageSrc) return undefined;

  const PHOTO_AREA = {
    left: Math.round(calendarWidth * PHOTO_AREA_CONFIG.LEFT_PERCENT),
    top: Math.round(calendarHeight * PHOTO_AREA_CONFIG.TOP_PERCENT),
    width: Math.round(calendarWidth * PHOTO_AREA_CONFIG.WIDTH_PERCENT),
    height: Math.round(calendarHeight * PHOTO_AREA_CONFIG.HEIGHT_PERCENT),
  };

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = calendarWidth;
  tempCanvas.height = calendarHeight;
  const ctx = tempCanvas.getContext("2d");
  if (!ctx) return undefined;

  try {
    const photoImg = await loadImage(monthData.imageSrc);

    // 1. Dibujar fondo difuminado
    ctx.save();
    ctx.beginPath();
    ctx.rect(PHOTO_AREA.left, PHOTO_AREA.top, PHOTO_AREA.width, PHOTO_AREA.height);
    ctx.clip();
    drawBlurredBackground(ctx, photoImg, PHOTO_AREA.left, PHOTO_AREA.top, PHOTO_AREA.width, PHOTO_AREA.height);
    ctx.restore();

    // 2. Dibujar la foto del usuario encima del blur (CON CLIP)
    ctx.save();
    ctx.beginPath();
    ctx.rect(PHOTO_AREA.left, PHOTO_AREA.top, PHOTO_AREA.width, PHOTO_AREA.height);
    ctx.clip();

    const { scale, posX, posY } = monthData.transformations;
    const centerX = PHOTO_AREA.left + PHOTO_AREA.width / 2;
    const centerY = PHOTO_AREA.top + PHOTO_AREA.height / 2;

    ctx.translate(centerX + posX, centerY + posY);
    ctx.scale(scale, scale);
    ctx.drawImage(photoImg, -photoImg.width / 2, -photoImg.height / 2, photoImg.width, photoImg.height);
    ctx.restore();

    // 3. Cargar y dibujar el template del calendario encima
    const templateImg = await loadImage(MONTH_CALENDAR_FILES[monthData.month as keyof typeof MONTH_CALENDAR_FILES]);
    ctx.drawImage(templateImg, 0, 0, calendarWidth, calendarHeight);

    // 4. Convertir a PNG con 300 DPI para impresión de calidad
    const blob = await canvasToBlobWithDPI(tempCanvas, 300, 0.95);
    const dataURL = await blobToDataURL(blob);

    console.log(`✅ Calendario mes ${monthData.month} renderizado como PNG con 300 DPI (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);

    return dataURL;
  } catch (error) {
    console.error(`Error renderizando mes ${monthData.month}:`, error);
    return undefined;
  }
}

/**
 * Renderiza SOLO el área de foto recortada (sin template)
 */
export async function renderCroppedPhoto(
  monthData: MonthData,
  calendarWidth: number = 2400,
  calendarHeight: number = 3600
): Promise<string | undefined> {
  if (!monthData.imageSrc) return undefined;

  const PHOTO_AREA = {
    width: Math.round(calendarWidth * PHOTO_AREA_CONFIG.WIDTH_PERCENT),
    height: Math.round(calendarHeight * PHOTO_AREA_CONFIG.HEIGHT_PERCENT),
  };

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = PHOTO_AREA.width;
  tempCanvas.height = PHOTO_AREA.height;
  const ctx = tempCanvas.getContext("2d");
  if (!ctx) return undefined;

  try {
    const photoImg = await loadImage(monthData.imageSrc);

    // 1. Dibujar fondo difuminado
    ctx.save();
    drawBlurredBackground(ctx, photoImg, 0, 0, PHOTO_AREA.width, PHOTO_AREA.height);
    ctx.restore();

    // 2. Dibujar la foto del usuario encima del blur
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, PHOTO_AREA.width, PHOTO_AREA.height);
    ctx.clip();

    const { scale, posX, posY } = monthData.transformations;
    const centerX = PHOTO_AREA.width / 2;
    const centerY = PHOTO_AREA.height / 2;

    ctx.translate(centerX + posX, centerY + posY);
    ctx.scale(scale, scale);
    ctx.drawImage(photoImg, -photoImg.width / 2, -photoImg.height / 2, photoImg.width, photoImg.height);
    ctx.restore();

    // 3. Convertir a PNG con 300 DPI para impresión de calidad
    const blob = await canvasToBlobWithDPI(tempCanvas, 300, 0.95);
    const dataURL = await blobToDataURL(blob);

    console.log(`✅ Área recortada mes ${monthData.month} renderizada como PNG con 300 DPI (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);

    return dataURL;
  } catch (error) {
    console.error(`Error renderizando área recortada mes ${monthData.month}:`, error);
    return undefined;
  }
}
