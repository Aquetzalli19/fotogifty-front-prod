/**
 * Utilidades para agregar metadatos DPI a imágenes PNG
 *
 * Los archivos PNG usan el chunk pHYs (Physical Pixel Dimensions) para almacenar DPI:
 * - Pixels per unit, X axis: 4 bytes (unsigned integer)
 * - Pixels per unit, Y axis: 4 bytes (unsigned integer)
 * - Unit specifier: 1 byte (0 = unknown, 1 = meters)
 *
 * Para convertir DPI a pixels/meter: DPI * 39.3701 (1 inch = 0.0254 meters)
 */

/**
 * Convierte DPI a pixels por metro
 */
function dpiToPixelsPerMeter(dpi: number): number {
  return Math.round(dpi * 39.3701);
}

/**
 * Crea un chunk pHYs para PNG
 */
function createPhysChunk(dpi: number): Uint8Array {
  const pixelsPerMeter = dpiToPixelsPerMeter(dpi);

  // Estructura del chunk pHYs:
  // 4 bytes: length (9 bytes de data)
  // 4 bytes: type ("pHYs")
  // 4 bytes: pixels per unit X
  // 4 bytes: pixels per unit Y
  // 1 byte: unit (1 = meter)
  // 4 bytes: CRC

  const data = new Uint8Array(9);
  const view = new DataView(data.buffer);

  // Pixels per meter (X axis)
  view.setUint32(0, pixelsPerMeter, false); // big-endian

  // Pixels per meter (Y axis)
  view.setUint32(4, pixelsPerMeter, false);

  // Unit: 1 = meter
  view.setUint8(8, 1);

  return data;
}

/**
 * Calcula CRC32 para validación de chunk PNG
 */
function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;

  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
    }
  }

  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Agrega chunk pHYs a un array de bytes PNG
 */
function addPhysChunk(pngBytes: Uint8Array, dpi: number): Uint8Array {
  // Signature PNG: 8 bytes
  const signature = pngBytes.slice(0, 8);

  // Buscar el primer chunk IDAT (donde insertaremos pHYs antes)
  let idatIndex = 8;
  while (idatIndex < pngBytes.length) {
    const chunkLength = new DataView(pngBytes.buffer, pngBytes.byteOffset + idatIndex).getUint32(0, false);
    const chunkType = String.fromCharCode(
      pngBytes[idatIndex + 4],
      pngBytes[idatIndex + 5],
      pngBytes[idatIndex + 6],
      pngBytes[idatIndex + 7]
    );

    if (chunkType === 'IDAT') {
      break;
    }

    // Length (4) + Type (4) + Data (chunkLength) + CRC (4)
    idatIndex += 4 + 4 + chunkLength + 4;
  }

  // Crear chunk pHYs
  const physData = createPhysChunk(dpi);
  const physType = new TextEncoder().encode('pHYs');

  // Calcular CRC (type + data)
  const crcInput = new Uint8Array(physType.length + physData.length);
  crcInput.set(physType, 0);
  crcInput.set(physData, physType.length);
  const crcValue = crc32(crcInput);

  // Construir chunk completo
  const physChunk = new Uint8Array(4 + 4 + physData.length + 4);
  const physView = new DataView(physChunk.buffer);

  // Length
  physView.setUint32(0, physData.length, false);

  // Type
  physChunk.set(physType, 4);

  // Data
  physChunk.set(physData, 8);

  // CRC
  physView.setUint32(8 + physData.length, crcValue, false);

  // Construir nuevo PNG: signature + chunks antes de IDAT + pHYs + resto
  const resultLength = pngBytes.length + physChunk.length;
  const resultBuffer = new ArrayBuffer(resultLength);
  const result = new Uint8Array(resultBuffer);

  result.set(pngBytes.slice(0, idatIndex), 0);
  result.set(physChunk, idatIndex);
  result.set(pngBytes.slice(idatIndex), idatIndex + physChunk.length);

  return result;
}

/**
 * Convierte un data URL a Blob con DPI especificado
 * @param dataURL - Data URL de la imagen (formato: data:image/png;base64,...)
 * @param dpi - DPI deseado (default: 300)
 * @returns Blob con metadatos DPI
 */
export async function dataURLtoBlobWithDPI(dataURL: string, dpi: number = 300): Promise<Blob> {
  // Extraer el contenido base64
  const arr = dataURL.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';

  // Solo procesamos PNG (JPEG usa EXIF, más complejo)
  if (!mime.includes('png')) {
    console.warn('DPI metadata only supported for PNG. Converting to PNG...');
  }

  // Decodificar base64
  const bstr = atob(arr[1]);
  const n = bstr.length;
  const buffer = new ArrayBuffer(n);
  const pngBytes = new Uint8Array(buffer);

  for (let i = 0; i < n; i++) {
    pngBytes[i] = bstr.charCodeAt(i);
  }

  // Agregar chunk pHYs con DPI
  const pngWithDPI = addPhysChunk(pngBytes, dpi);

  // Crear nuevo ArrayBuffer para asegurar compatibilidad de tipos
  const finalBuffer = new ArrayBuffer(pngWithDPI.length);
  const finalBytes = new Uint8Array(finalBuffer);
  finalBytes.set(pngWithDPI);

  return new Blob([finalBytes], { type: 'image/png' });
}

/**
 * Convierte un canvas a Blob con DPI especificado
 * @param canvas - Canvas element
 * @param dpi - DPI deseado (default: 300)
 * @param quality - Calidad de compresión (0-1, default: 0.95)
 * @returns Promise<Blob> con metadatos DPI
 */
export async function canvasToBlobWithDPI(
  canvas: HTMLCanvasElement,
  dpi: number = 300,
  quality: number = 0.95
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob from canvas'));
          return;
        }

        // Leer el blob como array buffer
        const arrayBuffer = await blob.arrayBuffer();
        const pngBytes = new Uint8Array(arrayBuffer);

        // Agregar chunk pHYs
        const pngWithDPI = addPhysChunk(pngBytes, dpi);

        // Crear nuevo ArrayBuffer para asegurar compatibilidad de tipos
        const finalBuffer = new ArrayBuffer(pngWithDPI.length);
        const finalBytes = new Uint8Array(finalBuffer);
        finalBytes.set(pngWithDPI);

        resolve(new Blob([finalBytes], { type: 'image/png' }));
      },
      'image/png',
      quality
    );
  });
}

/**
 * Verifica si un PNG tiene el chunk pHYs (metadatos DPI)
 */
export function hasPhysChunk(pngBytes: Uint8Array): boolean {
  let index = 8; // Skip PNG signature

  while (index < pngBytes.length) {
    const chunkLength = new DataView(
      pngBytes.buffer,
      pngBytes.byteOffset + index
    ).getUint32(0, false);

    const chunkType = String.fromCharCode(
      pngBytes[index + 4],
      pngBytes[index + 5],
      pngBytes[index + 6],
      pngBytes[index + 7]
    );

    if (chunkType === 'pHYs') {
      return true;
    }

    if (chunkType === 'IEND') {
      break;
    }

    index += 4 + 4 + chunkLength + 4;
  }

  return false;
}

/**
 * Lee los DPI de un PNG con chunk pHYs
 */
export function readPNGDPI(pngBytes: Uint8Array): number | null {
  let index = 8;

  while (index < pngBytes.length) {
    const chunkLength = new DataView(
      pngBytes.buffer,
      pngBytes.byteOffset + index
    ).getUint32(0, false);

    const chunkType = String.fromCharCode(
      pngBytes[index + 4],
      pngBytes[index + 5],
      pngBytes[index + 6],
      pngBytes[index + 7]
    );

    if (chunkType === 'pHYs') {
      const dataView = new DataView(
        pngBytes.buffer,
        pngBytes.byteOffset + index + 8
      );

      const pixelsPerMeterX = dataView.getUint32(0, false);
      const unit = dataView.getUint8(8);

      if (unit === 1) {
        // Convert pixels/meter to DPI
        return Math.round(pixelsPerMeterX / 39.3701);
      }
    }

    if (chunkType === 'IEND') {
      break;
    }

    index += 4 + 4 + chunkLength + 4;
  }

  return null;
}
