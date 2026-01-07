/**
 * Tipo de método de entrega
 */
export type DeliveryMethod = 'envio_domicilio' | 'recogida_tienda';

/**
 * Información de la tienda para recogida
 */
export interface StoreInfo {
  nombre: string;
  direccion: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  telefono: string;
  horario: string;
}
