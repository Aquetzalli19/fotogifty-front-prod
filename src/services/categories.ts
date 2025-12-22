import { apiClient } from '@/lib/api-client';

/**
 * Servicio para la gestión de categorías
 * Basado en la API real documentada en Swagger
 */

/**
 * Interfaz para una categoría según la API real
 */
export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  fecha_creacion: string;
}

/**
 * Datos para crear una nueva categoría
 */
export interface CrearCategoriaDTO {
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

/**
 * Datos para actualizar una categoría existente
 */
export interface ActualizarCategoriaDTO {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

/**
 * Obtiene todas las categorías
 * @param includeInactive - Si debe incluir categorías inactivas (por defecto true)
 * @returns Lista de categorías
 */
export async function obtenerTodasCategorias(includeInactive: boolean = true) {
  return apiClient.get<Categoria[]>('/categorias', { 
    params: includeInactive ? { incluir_inactivas: 'true' } : {} 
  });
}

/**
 * Obtiene una categoría por su ID
 * @param id - ID de la categoría
 * @returns Datos de la categoría
 */
export async function obtenerCategoriaPorId(id: number) {
  return apiClient.get<Categoria>(`/categorias/${id}`);
}

/**
 * Crea una nueva categoría
 * @param categoria - Datos de la categoría
 * @returns Categoría creada
 */
export async function crearCategoria(categoria: CrearCategoriaDTO) {
  return apiClient.post<Categoria>('/categorias', categoria);
}

/**
 * Actualiza una categoría existente
 * @param id - ID de la categoría
 * @param categoria - Datos a actualizar
 * @returns Categoría actualizada
 */
export async function actualizarCategoria(id: number, categoria: ActualizarCategoriaDTO) {
  return apiClient.put<Categoria>(`/categorias/${id}`, categoria);
}

/**
 * Elimina una categoría (cambiar estado a inactivo)
 * @param id - ID de la categoría
 * @returns Confirmación de eliminación
 */
export async function eliminarCategoria(id: number) {
  return apiClient.delete<{ message: string }>(`/categorias/${id}`);
}
