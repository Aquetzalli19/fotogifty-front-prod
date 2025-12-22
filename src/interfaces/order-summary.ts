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

  // Imágenes
  imagenes: string[];
  images?: string[]; // Alias para compatibilidad

  // Timestamps
  creado_en?: string;
  actualizado_en?: string;
}
