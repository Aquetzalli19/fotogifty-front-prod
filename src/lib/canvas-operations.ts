import { useEffect, useRef } from "react";
import { applyTransformation, Layer } from "./canvas-utils";
import { Transformations, Effect } from "./types";

type CanvasStyle = {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
};

type CanvasDimensions = {
  width: number;
  height: number;
};

export const validateImageResolution = (
  image: HTMLImageElement,
  canvasDimensions: CanvasDimensions,
  setResolutionWarning: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const requiredWidth = canvasDimensions.width;
  const requiredHeight = canvasDimensions.height;

  if (image.width < requiredWidth || image.height < requiredHeight) {
    setResolutionWarning(
      `La resolución de la imagen es baja. Se recomienda una imagen de al menos ${requiredWidth}x${requiredHeight} píxeles para una impresión de calidad.`
    );
  } else {
    setResolutionWarning(null);
  }
};

// Cache global para la imagen con TODOS los efectos aplicados
let imageEffectsCache: {
  imageSrc: string | null;
  effectsKey: string;
  canvas: HTMLCanvasElement | null;
} = { imageSrc: null, effectsKey: '', canvas: null };

// Genera una key única para los efectos (sin incluir posición)
const getEffectsKey = (effects: Effect[], scale: number, rotation: number, mirrorX: boolean, mirrorY: boolean): string => {
  const effectsStr = effects.map(e => `${e.type}:${e.value}`).join('|');
  return `${effectsStr}|s:${scale}|r:${rotation}|mx:${mirrorX}|my:${mirrorY}`;
};

// Aplica sepia manualmente (manipulación de píxeles)
const applySepiaToCanvas = (sourceCanvas: HTMLCanvasElement, sepiaValue: number): HTMLCanvasElement => {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = sourceCanvas.width;
  tempCanvas.height = sourceCanvas.height;
  const tempCtx = tempCanvas.getContext("2d");

  if (!tempCtx) return sourceCanvas;

  tempCtx.drawImage(sourceCanvas, 0, 0);

  if (sepiaValue <= 0) return tempCanvas;

  const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  const data = imageData.data;
  const sepiaMultiplier = sepiaValue / 100;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const newR = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
    const newG = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
    const newB = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);

    data[i] = r + (newR - r) * sepiaMultiplier;
    data[i + 1] = g + (newG - g) * sepiaMultiplier;
    data[i + 2] = b + (newB - b) * sepiaMultiplier;
  }

  tempCtx.putImageData(imageData, 0, 0);
  return tempCanvas;
};

// Crea un canvas con la imagen y todos los efectos aplicados (excepto posición)
const createEffectsCache = (
  img: HTMLImageElement,
  effects: Effect[],
  transformations: Transformations
): HTMLCanvasElement => {
  const { scale, rotation, mirrorX, mirrorY } = transformations;

  // Calcular dimensiones del canvas rotado
  const radians = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const scaledWidth = img.width * scale;
  const scaledHeight = img.height * scale;
  const rotatedWidth = Math.ceil(scaledWidth * cos + scaledHeight * sin);
  const rotatedHeight = Math.ceil(scaledHeight * cos + scaledWidth * sin);

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = rotatedWidth;
  tempCanvas.height = rotatedHeight;
  const tempCtx = tempCanvas.getContext("2d");

  if (!tempCtx) return tempCanvas;

  // Aplicar filtros CSS (excepto sepia)
  const nonSepiaFilters = effects
    .filter((e) => e.type !== "sepia")
    .map((e) => `${e.type}(${e.value}%)`)
    .join(" ");

  tempCtx.filter = nonSepiaFilters || "none";

  // Centrar y aplicar transformaciones
  tempCtx.translate(rotatedWidth / 2, rotatedHeight / 2);

  if (mirrorX || mirrorY) {
    tempCtx.scale(mirrorX ? -1 : 1, mirrorY ? -1 : 1);
  }

  tempCtx.rotate(radians);
  tempCtx.drawImage(img, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);

  // Aplicar sepia si es necesario
  const sepiaEffect = effects.find((e) => e.type === "sepia");
  const sepiaValue = sepiaEffect ? sepiaEffect.value : 0;

  if (sepiaValue > 0) {
    return applySepiaToCanvas(tempCanvas, sepiaValue);
  }

  return tempCanvas;
};

export const renderCanvas = (
  canvas: HTMLCanvasElement,
  imageRef: React.RefObject<HTMLImageElement | null>,
  transformations: Transformations,
  effects: Effect[],
  canvasStyle: CanvasStyle
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Limpiar y dibujar fondo
  ctx.fillStyle = canvasStyle.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const img = imageRef.current;
  if (!img) return;

  // Generar key para el cache (excluye posX y posY)
  const effectsKey = getEffectsKey(
    effects,
    transformations.scale,
    transformations.rotation,
    transformations.mirrorX,
    transformations.mirrorY
  );

  // Verificar si necesitamos actualizar el cache
  const needsCacheUpdate =
    imageEffectsCache.imageSrc !== img.src ||
    imageEffectsCache.effectsKey !== effectsKey ||
    !imageEffectsCache.canvas;

  if (needsCacheUpdate) {
    // Crear nuevo cache con todos los efectos aplicados
    imageEffectsCache = {
      imageSrc: img.src,
      effectsKey: effectsKey,
      canvas: createEffectsCache(img, effects, transformations),
    };
  }

  // Usar la imagen cacheada (ya tiene todos los efectos y transformaciones excepto posición)
  const cachedImage = imageEffectsCache.canvas;
  if (!cachedImage) return;

  // Calcular posición centrada + offset del usuario
  const drawX = (canvas.width - cachedImage.width) / 2 + transformations.posX;
  const drawY = (canvas.height - cachedImage.height) / 2 + transformations.posY;

  // Dibujar la imagen cacheada (muy rápido - solo una operación drawImage)
  ctx.drawImage(cachedImage, drawX, drawY);

  // Dibujar borde si es necesario
  if (canvasStyle.borderWidth > 0) {
    ctx.strokeStyle = canvasStyle.borderColor;
    ctx.lineWidth = canvasStyle.borderWidth * 2;
    ctx.strokeRect(
      canvasStyle.borderWidth,
      canvasStyle.borderWidth,
      canvas.width - canvasStyle.borderWidth * 2,
      canvas.height - canvasStyle.borderWidth * 2
    );
  }
};

export const useCanvasRendering = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  imageSrc: string | null,
  transformations: Transformations,
  effects: Effect[],
  canvasStyle: CanvasStyle,
  canvasDimensions: CanvasDimensions,
  setResolutionWarning: React.Dispatch<React.SetStateAction<string | null>>,
  selectedFilter: string
) => {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  // Cache para la imagen con efectos aplicados (evitar recalcular sepia en cada frame)
  const effectsCacheRef = useRef<{
    canvas: HTMLCanvasElement | null;
    effectsKey: string;
    imageSrc: string | null;
  }>({ canvas: null, effectsKey: '', imageSrc: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvasDimensions.width;
    canvas.height = canvasDimensions.height;

    // Cancelar cualquier frame pendiente
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    const doRender = () => {
      if (imageSrc && (!imageRef.current || imageRef.current.src !== imageSrc)) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          imageRef.current = img;
          // Invalidar cache cuando cambia la imagen
          effectsCacheRef.current = { canvas: null, effectsKey: '', imageSrc: null };

          validateImageResolution(img, canvasDimensions, setResolutionWarning);

          renderCanvas(canvas, imageRef, transformations, effects, canvasStyle);
        };
        img.src = imageSrc;
      } else if (imageRef.current && imageSrc) {
        renderCanvas(canvas, imageRef, transformations, effects, canvasStyle);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.filter = "none";
        ctx.fillStyle = canvasStyle.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (canvasStyle.borderWidth > 0) {
          ctx.strokeStyle = canvasStyle.borderColor;
          ctx.lineWidth = canvasStyle.borderWidth * 2;
          ctx.strokeRect(
            canvasStyle.borderWidth,
            canvasStyle.borderWidth,
            canvas.width - canvasStyle.borderWidth * 2,
            canvas.height - canvasStyle.borderWidth * 2
          );
        }
      }
    };

    // Usar requestAnimationFrame para mejor rendimiento durante el drag
    rafIdRef.current = requestAnimationFrame(doRender);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [
    imageSrc,
    transformations,
    effects,
    canvasStyle,
    selectedFilter,
    canvasDimensions,
    setResolutionWarning,
    canvasRef,
  ]);

  return imageRef;
};
