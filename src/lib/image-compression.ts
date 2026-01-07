/**
 * Utilidades para comprimir y redimensionar imágenes antes de guardarlas en localStorage
 * Esto previene QuotaExceededError cuando los usuarios suben fotos muy grandes
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1600,  // Suficiente para impresión de alta calidad
  maxHeight: 1600, // Suficiente para impresión de alta calidad
  quality: 0.85,   // Balance entre calidad y tamaño
  mimeType: 'image/jpeg',
};

/**
 * Carga una imagen desde un File o data URL
 */
function loadImageFromSource(source: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Error cargando imagen'));

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Error leyendo archivo'));
      reader.readAsDataURL(source);
    }
  });
}

/**
 * Calcula las nuevas dimensiones manteniendo el aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // Si la imagen es más grande que los límites, redimensionar
  if (width > maxWidth || height > maxHeight) {
    const aspectRatio = width / height;

    if (width > height) {
      // Imagen horizontal
      width = Math.min(width, maxWidth);
      height = width / aspectRatio;
    } else {
      // Imagen vertical
      height = Math.min(height, maxHeight);
      width = height * aspectRatio;
    }
  }

  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Estima el tamaño en bytes de un data URL
 */
function estimateDataURLSize(dataURL: string): number {
  // Remover el prefijo "data:image/jpeg;base64,"
  const base64String = dataURL.split(',')[1] || dataURL;
  // Cada carácter base64 representa 6 bits, así que (length * 6) / 8 = bytes
  return (base64String.length * 3) / 4;
}

/**
 * Comprime y redimensiona una imagen para optimizar el uso de localStorage
 *
 * @param source - File object o data URL de la imagen
 * @param options - Opciones de compresión (opcional)
 * @returns Promise con el data URL comprimido
 *
 * @example
 * const file = event.target.files[0];
 * const compressedDataURL = await compressAndResizeImage(file);
 * // Ahora guardar compressedDataURL en localStorage
 */
export async function compressAndResizeImage(
  source: File | string,
  options: CompressionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // 1. Cargar la imagen
    const img = await loadImageFromSource(source);

    console.log(`📸 Imagen original: ${img.width}×${img.height}px`);

    // 2. Calcular nuevas dimensiones
    const { width, height } = calculateDimensions(
      img.width,
      img.height,
      opts.maxWidth!,
      opts.maxHeight!
    );

    // 3. Crear canvas con las nuevas dimensiones
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No se pudo obtener contexto del canvas');
    }

    // 4. Dibujar imagen redimensionada con suavizado de alta calidad
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    // 5. Convertir a data URL con compresión
    const compressedDataURL = canvas.toDataURL(opts.mimeType!, opts.quality!);

    // 6. Logging para debug
    const originalSize = typeof source === 'string'
      ? estimateDataURLSize(source)
      : source.size;
    const compressedSize = estimateDataURLSize(compressedDataURL);
    const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(1);

    console.log(`✅ Compresión exitosa:`);
    console.log(`   - Dimensiones: ${img.width}×${img.height}px → ${width}×${height}px`);
    console.log(`   - Tamaño: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB`);
    console.log(`   - Reducción: ${reduction}%`);

    return compressedDataURL;

  } catch (error) {
    console.error('❌ Error comprimiendo imagen:', error);
    throw error;
  }
}

/**
 * Verifica si una imagen necesita ser comprimida
 *
 * @param source - File object o data URL
 * @returns true si la imagen es muy grande y debería comprimirse
 */
export function shouldCompressImage(source: File | string): boolean {
  if (typeof source === 'string') {
    const size = estimateDataURLSize(source);
    return size > 1024 * 1024; // > 1MB
  } else {
    return source.size > 1024 * 1024; // > 1MB
  }
}
