/**
 * Configuración de la aplicación
 * Centraliza todas las variables de entorno y configuraciones
 */

import { StoreInfo } from '@/types/DeliveryMethod';

export const config = {
  /**
   * URL base de la API del backend
   * Usa '/api' que será redirigido por el proxy de Next.js (configurado en next.config.ts)
   * El proxy redirige a la URL configurada en NEXT_PUBLIC_API_URL o localhost:3001/api
   */
  apiUrl: '/api',

  /**
   * Indica si estamos en modo desarrollo
   */
  isDevelopment: process.env.NODE_ENV === 'development',

  /**
   * Indica si estamos en modo producción
   */
  isProduction: process.env.NODE_ENV === 'production',

  /**
   * Información de la tienda física para recogida de pedidos
   * Configurable mediante variables de entorno NEXT_PUBLIC_STORE_*
   */
  storeInfo: {
    nombre: process.env.NEXT_PUBLIC_STORE_NAME || 'FotoGifty - Tienda Principal',
    direccion: process.env.NEXT_PUBLIC_STORE_ADDRESS || 'Av. Principal #123',
    ciudad: process.env.NEXT_PUBLIC_STORE_CITY || 'Ciudad de México',
    estado: process.env.NEXT_PUBLIC_STORE_STATE || 'CDMX',
    codigo_postal: process.env.NEXT_PUBLIC_STORE_ZIP || '01000',
    telefono: process.env.NEXT_PUBLIC_STORE_PHONE || '55-1234-5678',
    horario: process.env.NEXT_PUBLIC_STORE_HOURS || 'Lunes a Viernes: 9:00 AM - 6:00 PM',
  } as StoreInfo,
} as const;
