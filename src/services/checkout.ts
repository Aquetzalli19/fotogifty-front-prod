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
  id_direccion: number;
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
  return apiClient.post<CrearSesionResponse>('/checkout/crear-sesion', data);
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
  const formData = new FormData();

  // Agregar el ID del item del pedido
  formData.append('itemPedidoId', itemPedidoId.toString());

  imagenes.forEach((imagen, index) => {
    formData.append('imagenes', imagen, `imagen-${index + 1}.jpg`);
  });

  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }

  // Para FormData, no usar el apiClient normal porque necesitamos quitar el Content-Type
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('auth_token')
    : null;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/pedidos/${pedidoId}/imagenes`,
    {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al subir imágenes');
  }

  return response.json() as Promise<{ success: boolean; data: SubirImagenesResponse }>;
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
 * Convierte cualquier tipo de imagen URL a Blob con DPI preservado
 * Soporta: data URLs, blob URLs, y URLs normales
 * @param imageURL - URL de la imagen
 * @param dpi - DPI para la imagen (default: 300 para impresión de calidad)
 * @returns Promise<Blob> con metadatos DPI
 */
export async function imageURLtoBlob(imageURL: string, dpi: number = 300): Promise<Blob> {
  // Si es un data URL, convertir con DPI
  if (isDataURL(imageURL)) {
    // Importar dinámicamente para evitar problemas de SSR
    const { dataURLtoBlobWithDPI } = await import('@/lib/png-dpi');
    return dataURLtoBlobWithDPI(imageURL, dpi);
  }

  // Si es un blob URL o URL normal, hacer fetch
  try {
    const response = await fetch(imageURL);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    return await response.blob();
  } catch (error) {
    console.error('Error converting image to blob:', error);
    throw error;
  }
}
