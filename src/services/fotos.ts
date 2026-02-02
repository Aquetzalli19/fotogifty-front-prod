import { apiClient } from '@/lib/api-client';
import { config } from '@/lib/config';

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
    console.log('🔄 Iniciando descarga de foto ID:', fotoId);

    // 1. Obtener URL firmada de descarga
    const response = await obtenerUrlDescargaFoto(fotoId);

    console.log('📡 Respuesta del backend:', response);

    if (!response.success || !response.data) {
      console.error('❌ Backend no devolvió datos válidos:', response);
      throw new Error('No se pudo obtener la URL de descarga');
    }

    const { downloadUrl, filename, metadata } = response.data;

    console.log('📥 Descargando foto desde S3:', {
      fotoId,
      downloadUrl: downloadUrl.substring(0, 100) + '...', // Mostrar solo inicio de URL
      filename,
      metadata
    });

    // 2. Descargar archivo desde S3
    const fileResponse = await fetch(downloadUrl);

    console.log('📦 Respuesta de S3:', {
      status: fileResponse.status,
      statusText: fileResponse.statusText,
      contentType: fileResponse.headers.get('content-type'),
      contentLength: fileResponse.headers.get('content-length')
    });

    if (!fileResponse.ok) {
      console.error('❌ Error en respuesta de S3:', fileResponse.status, fileResponse.statusText);
      throw new Error(`Error al descargar el archivo desde S3: ${fileResponse.status} ${fileResponse.statusText}`);
    }

    const blob = await fileResponse.blob();
    console.log('💾 Blob creado:', {
      size: blob.size,
      type: blob.type
    });

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

/**
 * Descarga todas las fotos de un pedido en formato ZIP con metadatos EXIF embebidos
 * @param pedidoId ID del pedido
 * @returns Promise con información de la descarga
 */
export async function descargarPedidoZip(pedidoId: number) {
  try {
    console.log('📦 Iniciando descarga de ZIP del pedido:', pedidoId);

    const token = typeof window !== 'undefined'
      ? localStorage.getItem('auth_token')
      : null;

    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // Usar config.apiUrl que maneja el proxy de Next.js correctamente
    const url = `${config.apiUrl}/pedidos/${pedidoId}/fotos/download-zip`;

    console.log('🌐 URL del endpoint:', url);

    // Descargar el ZIP
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📥 Respuesta del servidor:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });

    if (!response.ok) {
      // Intentar obtener el mensaje de error del backend
      let errorMessage = 'Error al descargar el ZIP del pedido';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // Si no se puede parsear el JSON, usar mensaje genérico
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    // Obtener el nombre del archivo desde el header Content-Disposition
    const disposition = response.headers.get('Content-Disposition');
    let filename = `pedido-${pedidoId}.zip`;

    if (disposition) {
      const filenameMatch = disposition.match(/filename="?(.+)"?/i);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/"/g, '');
      }
    }

    console.log('📁 Nombre del archivo:', filename);

    // Obtener el blob
    const blob = await response.blob();

    console.log('💾 Blob creado:', {
      size: blob.size,
      type: blob.type,
      sizeMB: (blob.size / 1024 / 1024).toFixed(2) + ' MB'
    });

    // Crear enlace de descarga
    const url2 = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url2;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url2);

    console.log('✅ ZIP descargado correctamente:', filename);

    return {
      success: true,
      filename,
      size: blob.size
    };
  } catch (error) {
    console.error('❌ Error al descargar ZIP del pedido:', error);
    throw error;
  }
}
