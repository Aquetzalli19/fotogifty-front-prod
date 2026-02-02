import { apiClient } from '@/lib/api-client';

/**
 * Item del carrito para el checkout
 */
export interface CheckoutItem {
  id_paquete: number;
  nombre_paquete: string;
  categoria_paquete: string;
  precio_unitario: number;
  cantidad: number;
  num_fotos_requeridas: number;
}

/**
 * Request para crear sesión de checkout
 */
export interface CrearSesionRequest {
  id_usuario: number;
  id_direccion?: number; // Opcional - requerido solo si metodo_entrega es 'envio_domicilio'
  metodo_entrega: 'envio_domicilio' | 'recogida_tienda';
  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente?: string;
  items: CheckoutItem[];
  subtotal: number;
  iva: number;
  total: number;
  success_url: string;
  cancel_url: string;
}

/**
 * Response de crear sesión
 */
export interface CrearSesionResponse {
  session_id: string;
  url: string;
}

/**
 * Item del pedido creado (con ID asignado por el backend)
 */
export interface ItemPedidoCreado {
  id: number; // ID del item en el pedido (itemPedidoId)
  id_paquete: number;
  nombre_paquete: string;
  categoria_paquete: string;
  precio_unitario: number;
  cantidad: number;
  num_fotos_requeridas: number;
}

/**
 * Estado del pedido después de verificar sesión
 */
export interface PedidoCreado {
  id: number;
  estado: string;
  estado_pago: string;
  total: number;
  items_pedido: ItemPedidoCreado[];
  creado_en: string;
  fotos?: Array<{ id: number; url: string; item_pedido_id: number }>; // Fotos ya subidas (para evitar resubidas)
}

/**
 * Response de verificar sesión
 */
export interface VerificarSesionResponse {
  status: 'complete' | 'open' | 'expired';
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  pedido: PedidoCreado | null;
}

/**
 * Response de subir imágenes
 */
export interface SubirImagenesResponse {
  pedido_id: number;
  imagenes_subidas: number;
  urls: string[];
}

/**
 * Crea una sesión de Stripe Checkout
 */
export async function crearSesionCheckout(data: CrearSesionRequest) {
  // Validar dirección solo para envío a domicilio
  if (data.metodo_entrega === 'envio_domicilio' && !data.id_direccion) {
    throw new Error('La dirección de envío es requerida para envío a domicilio');
  }

  // Limpiar id_direccion si es recogida en tienda
  const payload = {
    ...data,
    id_direccion: data.metodo_entrega === 'envio_domicilio' ? data.id_direccion : undefined,
  };

  return apiClient.post<CrearSesionResponse>('/checkout/crear-sesion', payload);
}

/**
 * Verifica el estado de una sesión de checkout
 */
export async function verificarSesion(sessionId: string) {
  return apiClient.get<VerificarSesionResponse>(`/checkout/verificar-sesion/${sessionId}`);
}

/**
 * Sube imágenes a un pedido
 * @param pedidoId ID del pedido
 * @param itemPedidoId ID del item del pedido al que pertenecen las imágenes
 * @param imagenes Array de blobs/files de imágenes
 * @param metadata Metadata opcional para cada imagen
 */
export async function subirImagenesPedido(
  pedidoId: number,
  itemPedidoId: number,
  imagenes: Blob[],
  metadata?: Record<string, unknown>
) {
  console.log(`📤 Preparando subida de ${imagenes.length} imágenes:`);
  console.log(`   - Pedido ID: ${pedidoId}`);
  console.log(`   - Item Pedido ID: ${itemPedidoId}`);

  const formData = new FormData();

  // Agregar el ID del item del pedido
  formData.append('itemPedidoId', itemPedidoId.toString());

  // Agregar imágenes y calcular tamaño total
  let totalSize = 0;
  imagenes.forEach((imagen, index) => {
    totalSize += imagen.size;
    console.log(`   - Imagen ${index + 1}: ${(imagen.size / 1024 / 1024).toFixed(2)} MB, tipo: ${imagen.type}`);
    formData.append('imagenes', imagen, `imagen-${index + 1}.jpg`);
  });

  console.log(`   📊 Tamaño total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }

  // Para FormData, no usar el apiClient normal porque necesitamos quitar el Content-Type
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('auth_token')
    : null;

  const url = `${process.env.NEXT_PUBLIC_API_URL}/pedidos/${pedidoId}/imagenes`;
  console.log(`🌐 Subiendo a: ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData,
  });

  console.log(`📥 Respuesta del servidor: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    let errorMessage = 'Error al subir imágenes';
    try {
      const error = await response.json();
      errorMessage = error.message || errorMessage;
      console.error('❌ Error del backend:', error);
    } catch (e) {
      console.error('❌ No se pudo parsear el error del backend');
    }
    throw new Error(errorMessage);
  }

  const result = await response.json() as { success: boolean; data: SubirImagenesResponse };
  console.log('✅ Imágenes subidas exitosamente:', result);
  return result;
}

/**
 * NUEVO: Sube una foto individual con cantidad de copias al backend
 * Compatible con el endpoint /api/fotos/upload del backend
 */
export async function subirFotoConCopias(
  usuarioId: number,
  itemPedidoId: number,
  pedidoId: number,
  foto: Blob,
  cantidadCopias: number = 1
) {
  console.log(`📤 Subiendo foto individual:`);
  console.log(`   - Usuario ID: ${usuarioId}`);
  console.log(`   - Item Pedido ID: ${itemPedidoId}`);
  console.log(`   - Pedido ID: ${pedidoId}`);
  console.log(`   - Cantidad Copias: ${cantidadCopias}`);
  console.log(`   - Tamaño: ${(foto.size / 1024 / 1024).toFixed(2)} MB`);

  const formData = new FormData();
  formData.append('foto', foto, 'foto.jpg');
  formData.append('usuarioId', usuarioId.toString());
  formData.append('itemPedidoId', itemPedidoId.toString());
  formData.append('pedidoId', pedidoId.toString());
  formData.append('cantidad_copias', cantidadCopias.toString());

  const token = typeof window !== 'undefined'
    ? localStorage.getItem('auth_token')
    : null;

  const url = `/api/fotos/upload`; // Endpoint del backend
  console.log(`🌐 Subiendo a: ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData,
  });

  console.log(`📥 Respuesta: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    let errorMessage = 'Error al subir foto';
    try {
      const error = await response.json();
      errorMessage = error.error || error.message || errorMessage;
      console.error('❌ Error del backend:', error);

      // Manejar error de límite excedido
      if (response.status === 400 && error.data) {
        console.error(`   - Copias disponibles: ${error.data.copias_disponibles}`);
        console.error(`   - Copias usadas: ${error.data.copias_usadas_total}`);
        console.error(`   - Límite paquete: ${error.data.limite_paquete}`);
      }
    } catch (e) {
      console.error('❌ No se pudo parsear el error del backend');
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();
  console.log('✅ Foto subida exitosamente:', result);
  return result;
}

/**
 * Convierte un dataURL (base64) a Blob
 * @deprecated Use dataURLtoBlobWithDPI from png-dpi.ts for better DPI preservation
 */
export function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Verifica si una string es un data URL válido
 */
export function isDataURL(str: string): boolean {
  return str.startsWith('data:');
}

/**
 * Verifica si una string es un blob URL
 */
export function isBlobURL(str: string): boolean {
  return str.startsWith('blob:');
}

/**
 * Convierte cualquier tipo de imagen URL a Blob en formato JPEG
 * Soporta: data URLs, blob URLs, y URLs normales
 * La imagen se redibuja en un canvas limpio antes de la conversión
 * El backend embebe automáticamente metadatos DPI de 300 para impresión
 * @param imageURL - URL de la imagen
 * @returns Promise<Blob> - Blob en formato JPEG con 95% de calidad
 */
export async function imageURLtoBlob(imageURL: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Crear canvas limpio (sin metadatos EXIF problemáticos)
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo obtener contexto del canvas'));
        return;
      }

      // Dibujar imagen (esto limpia los metadatos EXIF)
      ctx.drawImage(img, 0, 0);

      // Convertir a Blob (JPEG con alta calidad)
      // El backend ahora maneja correctamente los metadatos EXIF (.withMetadata(false))
      // y embebe 300 DPI automáticamente
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('No se pudo crear blob'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',  // JPEG para archivos más pequeños (2-3x vs PNG)
        0.95           // 95% calidad - balance perfecto entre tamaño y calidad
      );
    };

    img.onerror = () => {
      reject(new Error('Error al cargar la imagen'));
    };

    img.src = imageURL;
  });
}
