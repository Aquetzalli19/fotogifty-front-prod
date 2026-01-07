import { apiClient } from '@/lib/api-client';

/**
 * Metadata de la foto descargada
 */
export interface FotoMetadata {
  anchoFisico: number;
  altoFisico: number;
  resolucionDPI: number;
  tamanioArchivo: number;
}

/**
 * Response del endpoint de descarga
 */
export interface DescargarFotoResponse {
  downloadUrl: string;
  filename: string;
  expiresIn: number;
  metadata: FotoMetadata;
}

/**
 * Obtiene la URL de descarga de una foto
 * @param fotoId ID de la foto a descargar
 * @returns URL firmada de S3 y metadata de la foto
 */
export async function obtenerUrlDescargaFoto(fotoId: number) {
  return apiClient.get<DescargarFotoResponse>(`/fotos/${fotoId}/download`);
}

/**
 * Descarga una foto directamente al navegador
 * @param fotoId ID de la foto a descargar
 * @param nombreArchivo Nombre opcional para el archivo descargado
 */
export async function descargarFoto(fotoId: number, nombreArchivo?: string) {
  try {
    // 1. Obtener URL firmada de descarga
    const response = await obtenerUrlDescargaFoto(fotoId);

    if (!response.success || !response.data) {
      throw new Error('No se pudo obtener la URL de descarga');
    }

    const { downloadUrl, filename, metadata } = response.data;

    console.log('📥 Descargando foto:', {
      fotoId,
      filename,
      metadata
    });

    // 2. Descargar archivo desde S3
    const fileResponse = await fetch(downloadUrl);

    if (!fileResponse.ok) {
      throw new Error('Error al descargar el archivo desde S3');
    }

    const blob = await fileResponse.blob();

    // 3. Crear enlace de descarga y hacer clic automáticamente
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo || filename;
    document.body.appendChild(link);
    link.click();

    // 4. Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log('✅ Foto descargada correctamente con DPI:', metadata.resolucionDPI);

    return {
      success: true,
      filename: nombreArchivo || filename,
      metadata
    };
  } catch (error) {
    console.error('❌ Error al descargar foto:', error);
    throw error;
  }
}

/**
 * Descarga múltiples fotos de un pedido
 * @param fotoIds Array de IDs de fotos a descargar
 * @param delay Delay entre descargas en ms (para evitar saturar el navegador)
 */
export async function descargarMultiplesFotos(
  fotoIds: number[],
  delay: number = 500
): Promise<{ success: number; failed: number; errors: Error[] }> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as Error[]
  };

  for (let i = 0; i < fotoIds.length; i++) {
    try {
      await descargarFoto(fotoIds[i]);
      results.success++;

      // Delay entre descargas (excepto en la última)
      if (i < fotoIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      results.failed++;
      results.errors.push(error as Error);
    }
  }

  return results;
}

/**
 * Obtiene solo la metadata de una foto sin descargarla
 * @param fotoId ID de la foto
 */
export async function obtenerMetadataFoto(fotoId: number): Promise<FotoMetadata | null> {
  try {
    const response = await obtenerUrlDescargaFoto(fotoId);

    if (!response.success || !response.data) {
      return null;
    }

    return response.data.metadata;
  } catch (error) {
    console.error('Error al obtener metadata de foto:', error);
    return null;
  }
}
