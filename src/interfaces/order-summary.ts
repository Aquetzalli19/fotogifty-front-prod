export interface UserOrder {
  dateOfOrder: string;
  orderItems: OrderItem[];
  status: "Enviado" | "En reparto" | "Entregado";
  images: string[];
}

export interface OrderItem {
  productName: string;
  package: string;
  itemPrice: number;
}

// Estructura del item del pedido desde el backend
export interface ItemPedido {
  id: number;
  id_paquete: number;
  nombre_paquete: string;
  categoria_paquete: string;
  precio_unitario: number;
  cantidad: number;
  num_fotos_requeridas: number;
}

// Dirección de envío
export interface DireccionEnvio {
  calle: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  pais: string;
}

// Foto del pedido con metadatos completos
export interface FotoDetalle {
  id: number;
  url: string;
  nombre_archivo: string;
  ancho_foto: number;
  alto_foto: number;
  resolucion_foto: number;
  tamanio_archivo: number;
  id_item_pedido: number;
}

// Estructura del pedido desde el backend
export interface AdmiOrder {
  // IDs
  id: number;
  orderId: number; // Alias de id
  id_usuario: number;
  id_pago_stripe?: string | null;
  id_sesion_stripe?: string | null;

  // Datos del cliente
  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente?: string | null;
  direccion_envio?: DireccionEnvio;

  // Alias para compatibilidad (deprecados)
  clientName?: string;
  dateOfOrder?: string;
  orderItems?: OrderItem[];

  // Datos del pedido
  fecha_pedido: string;
  items_pedido: ItemPedido[];

  // Estados
  estado: string;
  estado_pago?: string;
  status?: string; // Alias para compatibilidad

  // Totales
  subtotal?: number;
  iva?: number;
  total: number;

  // Imágenes (NUEVO: objetos completos con IDs y metadata)
  fotos?: FotoDetalle[]; // ✅ Solución permanente: objetos con IDs
  imagenes?: string[];   // ⚠️ Retrocompatible: solo URLs
  images?: string[];     // ⚠️ Alias deprecated para compatibilidad

  // Timestamps
  creado_en?: string;
  actualizado_en?: string;
}
