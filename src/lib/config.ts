/**
 * Configuración de la aplicación
 * Centraliza todas las variables de entorno y configuraciones
 */

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
} as const;
