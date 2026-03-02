/**
 * s3-upload.ts
 *
 * Utilidad para subir imágenes directamente a S3 usando presigned PUT URLs.
 * El archivo nunca pasa por el backend — va directo del navegador a S3.
 *
 * Flujo:
 *   1. POST /api/images/temp/presigned-url  → { uploadUrl, s3Key, publicUrl }
 *   2. PUT {uploadUrl} con el Blob (directo a S3, sin pasar por backend)
 *   3. Retornar publicUrl para guardar en el estado del editor
 */

import { apiClient } from './api-client';

interface PresignedUrlData {
  uploadUrl: string;  // URL firmada para PUT directo a S3 (expira en 1h)
  s3Key: string;      // "temp/userId/timestamp-uuid.jpg"
  publicUrl: string;  // "https://bucket.s3.region.amazonaws.com/temp/..."
  expiresAt: string;  // ISO date
}

export interface S3UploadResult {
  s3Key: string;
  publicUrl: string;
}

/** Convierte un data URL base64 a Blob sin dependencias externas. */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64Data] = dataUrl.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const bytes = atob(base64Data);
  const array = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    array[i] = bytes.charCodeAt(i);
  }
  return new Blob([array], { type: mimeType });
}

/**
 * Sube una imagen comprimida (data URL) directamente a S3 vía presigned URL.
 *
 * @param compressedDataUrl - Data URL base64 de la imagen ya comprimida/redimensionada
 * @param onProgress - Callback opcional con porcentaje de progreso (0–100)
 * @returns { s3Key, publicUrl } — la URL pública de S3 para guardar en el estado
 */
export async function uploadImageToS3(
  compressedDataUrl: string,
  onProgress?: (percent: number) => void
): Promise<S3UploadResult> {
  const blob = dataUrlToBlob(compressedDataUrl);
  const mimeType = blob.type;
  const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';

  // 1. Solicitar presigned URL al backend
  const presignedRes = await apiClient.post<PresignedUrlData>(
    '/images/temp/presigned-url',
    {
      filename: `image_${Date.now()}.${ext}`,
      contentType: mimeType,
      sizeBytes: blob.size,
    }
  );

  if (!presignedRes.success || !presignedRes.data) {
    throw new Error(presignedRes.message ?? 'No se pudo obtener URL de subida');
  }

  const { uploadUrl, s3Key, publicUrl } = presignedRes.data;

  // 2. Subir directamente a S3 (no pasa por el backend)
  if (onProgress) {
    await uploadToS3WithProgress(uploadUrl, blob, mimeType, onProgress);
  } else {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': mimeType },
      body: blob,
    });
    if (!res.ok) {
      throw new Error(`Error subiendo a S3: ${res.status} ${res.statusText}`);
    }
  }

  return { s3Key, publicUrl };
}

/** PUT a S3 con reporte de progreso vía XMLHttpRequest. */
function uploadToS3WithProgress(
  uploadUrl: string,
  blob: Blob,
  mimeType: string,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`S3 rechazó el upload: ${xhr.status} ${xhr.statusText}`));
    });

    xhr.addEventListener('error', () =>
      reject(new Error('Error de red al subir imagen a S3'))
    );

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', mimeType);
    xhr.send(blob);
  });
}
