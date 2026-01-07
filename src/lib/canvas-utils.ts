export type Rectangle = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type Viewport = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export interface Layer {
  left: number;
  top: number;
  width: number;
  height: number;
  transform: {
    scale: number;
    rotation: number;
    mirrorX: boolean;
    mirrorY: boolean;
    posX: number;
    posY: number;
  };
}

const layerToRect = (layer: Layer): Rectangle => ({
  left: layer.left,
  top: layer.top,
  width: layer.width,
  height: layer.height,
});

const scaleRectangle = (rect: Rectangle, scale: number): Rectangle => {
  const newWidth = rect.width * scale;
  const newHeight = rect.height * scale;
  return {
    width: newWidth,
    height: newHeight,
    left: rect.left - (newWidth - rect.width) / 2,
    top: rect.top - (newHeight - rect.height) / 2,
  };
};

const getRotationCenter = (
  rect: Rectangle,
  useCeil = false
): { x: number; y: number } => {
  const method = useCeil ? Math.ceil : Math.round;
  return {
    x: method(rect.left + rect.width / 2),
    y: method(rect.top + rect.height / 2),
  };
};

let bounds: Rectangle;

/**
 * The MIT License (MIT)
 *
 * Igor Zinken 2021-2022 - https://www.igorski.nl
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
export const applyTransformation = (
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  viewport: Partial<Viewport> = { left: 0, top: 0 }
): Rectangle | undefined => {
  const { mirrorX, mirrorY, scale, rotation } = layer.transform;

  const isMirrored = mirrorX || mirrorY;
  const isScaled = scale !== 1;
  const isRotated = rotation % (2 * Math.PI) !== 0;

  if (!isMirrored && !isRotated && !isScaled) {
    return;
  }

  bounds = layerToRect(layer);

  if (isScaled) {
    bounds = scaleRectangle(bounds, scale);
  }

  const { width, height } = bounds;

  if (viewport.left && viewport.top) {
    ctx.translate(-viewport.left, -viewport.top);
  }

  if (isMirrored) {
    ctx.scale(mirrorX ? -1 : 1, mirrorY ? -1 : 1);
    ctx.translate(mirrorX ? -width : 0, mirrorY ? -height : 0);

    if (mirrorX) {
      bounds.left = -bounds.left;
    }
    if (mirrorY) {
      bounds.top = -bounds.top;
    }
  }

  if (isRotated) {
    const { x, y } = getRotationCenter(bounds, true);

    ctx.translate(x, y);
    ctx.rotate(mirrorX ? -rotation : rotation);
    ctx.translate(-x, -y);
  }
  return bounds;
};

/**
 * Comprime una imagen para reducir su tamaño en localStorage
 * @param imageSrc - Data URL o URL de la imagen
 * @param maxWidth - Ancho máximo (default 800px)
 * @param maxHeight - Alto máximo (default 800px)
 * @param quality - Calidad (no usado para PNG, se mantiene para compatibilidad)
 * @returns Promise con el data URL comprimido
 */
export const compressImage = (
  imageSrc: string,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7, // Mantener parámetro para compatibilidad (no usado en PNG)
  minWidth = 0,  // Tamaño mínimo (no comprimir por debajo)
  minHeight = 0
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Calcular nuevas dimensiones manteniendo aspecto
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Asegurar que no sea menor al mínimo requerido
      if (minWidth > 0 && minHeight > 0) {
        if (width < minWidth || height < minHeight) {
          const ratio = Math.max(minWidth / width, minHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
      }

      // Crear canvas temporal
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No se pudo obtener contexto del canvas"));
        return;
      }

      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      // Exportar como JPEG con alta calidad (0.95 para impresión)
      const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.95);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      reject(new Error("Error al cargar la imagen"));
    };

    img.src = imageSrc;
  });
};

/**
 * Comprime un canvas existente a un data URL más pequeño
 * @param canvas - El canvas a comprimir
 * @param maxWidth - Ancho máximo
 * @param maxHeight - Alto máximo
 * @param quality - Calidad (no usado para PNG, se mantiene para compatibilidad)
 * @returns Data URL comprimido
 */
export const compressCanvas = (
  canvas: HTMLCanvasElement,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.6 // Mantener parámetro para compatibilidad (no usado en PNG)
): string => {
  let { width, height } = canvas;

  // Calcular nuevas dimensiones
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // Crear canvas temporal
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;

  const ctx = tempCanvas.getContext("2d");
  if (!ctx) {
    // Fallback: devolver PNG sin compresión
    return canvas.toDataURL("image/png");
  }

  // Dibujar canvas redimensionado
  ctx.drawImage(canvas, 0, 0, width, height);

  // Exportar como JPEG con buena calidad
  return tempCanvas.toDataURL("image/jpeg", 0.85);
};
