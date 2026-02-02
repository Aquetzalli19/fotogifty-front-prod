/**
 * Configuración de la tienda física
 */
export interface StoreConfiguration {
  id: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  pais: string;
  telefono: string;
  email: string | null;
  latitud: number;
  longitud: number;
  horario_lunes_viernes: string | null;
  horario_sabado: string | null;
  horario_domingo: string | null;
  descripcion: string | null;
  instrucciones_llegada: string | null;
  fecha_actualizacion: string;
}

/**
 * DTO para actualizar configuración
 */
export interface StoreConfigurationDTO {
  nombre: string;
  direccion: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  pais: string;
  telefono: string;
  email?: string;
  latitud: number;
  longitud: number;
  horario_lunes_viernes?: string;
  horario_sabado?: string;
  horario_domingo?: string;
  descripcion?: string;
  instrucciones_llegada?: string;
}
