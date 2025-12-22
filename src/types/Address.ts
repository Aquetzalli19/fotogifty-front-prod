export interface Address {
  id?: number;
  usuario_id: number;
  alias: string;
  pais: string;
  estado: string;
  ciudad: string;
  codigo_postal: string;
  direccion: string;
  numero_casa?: string;
  numero_departamento?: string;
  especificaciones?: string;
  predeterminada: boolean;
  fecha_registro?: string; // Formateado como string en formato ISO
}