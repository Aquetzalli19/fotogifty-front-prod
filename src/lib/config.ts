/**
 * Configuración de la aplicación
 * Centraliza todas las variables de entorno y configuraciones
 */

export const config = {
  /**
   * URL base de la API del backend
   * Por defecto apunta a localhost:3001/api para desarrollo
   */
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',

  /**
   * Indica si estamos en modo desarrollo
   */
  isDevelopment: process.env.NODE_ENV === 'development',

  /**
   * Indica si estamos en modo producción
   */
  isProduction: process.env.NODE_ENV === 'production',
} as const;
