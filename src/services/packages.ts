import { apiClient } from '@/lib/api-client';
import { getEditorType } from '@/lib/category-utils';

/**
 * Servicio para la gestión de paquetes (productos)
 * Basado en la API real documentada en Swagger
 */

/**
 * Interfaz para un paquete según la API real
 */
export interface Paquete {
  id: number;
  nombre: string;
  categoria_id: number;
  categoria_nombre?: string; // Incluido cuando se obtienen todos los paquetes
  descripcion: string;
  cantidad_fotos: number;
  precio: number;
  estado: boolean;
  resolucion_foto: number;
  ancho_foto: number;
  alto_foto: number;
}

/**
 * Datos para crear un nuevo paquete
 */
export interface CrearPaqueteDTO {
  nombre: string;
  categoria_id: number;
  descripcion: string;
  cantidad_fotos: number;
  precio: number;
  estado: boolean;
  resolucion_foto: number;
  ancho_foto: number;
  alto_foto: number;
}

/**
 * Datos para actualizar un paquete existente
 */
export interface ActualizarPaqueteDTO {
  nombre?: string;
  categoria_id?: number;
  descripcion?: string;
  cantidad_fotos?: number;
  precio?: number;
  estado?: boolean;
  resolucion_foto?: number;
  ancho_foto?: number;
  alto_foto?: number;
}

/**
 * Obtiene todos los paquetes
 * @returns Lista de paquetes
 */
export async function obtenerTodosPaquetes() {
  return apiClient.get<Paquete[]>('/paquetes');
}

/**
 * Obtiene un paquete por su ID
 * @param id - ID del paquete
 * @returns Datos del paquete
 */
export async function obtenerPaquetePorId(id: number) {
  return apiClient.get<Paquete>(`/paquetes/${id}`);
}

/**
 * Obtiene paquetes por categoría
 * @param categoriaId - ID de la categoría
 * @returns Lista de paquetes de esa categoría
 */
export async function obtenerPaquetesPorCategoria(categoriaId: number) {
  return apiClient.get<Paquete[]>(`/paquetes/categoria/${categoriaId}`);
}

/**
 * Crea un nuevo paquete
 * @param paquete - Datos del paquete
 * @returns Paquete creado
 */
export async function crearPaquete(paquete: CrearPaqueteDTO) {
  return apiClient.post<Paquete>('/paquetes', paquete);
}

/**
 * Actualiza un paquete existente
 * @param id - ID del paquete
 * @param paquete - Datos a actualizar
 * @returns Paquete actualizado
 */
export async function actualizarPaquete(id: number, paquete: ActualizarPaqueteDTO) {
  return apiClient.put<Paquete>(`/paquetes/${id}`, paquete);
}

/**
 * Elimina un paquete (cambiar estado a inactivo)
 * @param id - ID del paquete
 * @returns Confirmación de eliminación
 */
export async function eliminarPaquete(id: number) {
  return apiClient.delete<{ message: string }>(`/paquetes/${id}`);
}

/**
 * Agrupa paquetes por categoría y los transforma al formato ProductSections
 * Detecta automáticamente el tipo de editor basándose en el nombre de la categoría
 * @param paquetes - Lista de paquetes de la API
 * @returns Paquetes agrupados por categoría en formato ProductSections con editorType
 */
export function agruparPaquetesPorCategoria(paquetes: Paquete[]): import('@/interfaces/product-card').ProductSections[] {

  // Crear un Map para agrupar por categoría
  const categoriesMap = new Map<string, Paquete[]>();

  // Filtrar solo paquetes activos y agrupar por categoría
  paquetes
    .filter(paquete => paquete.estado === true)
    .forEach(paquete => {
      const categoryName = paquete.categoria_nombre || `Categoría ${paquete.categoria_id}`;

      if (!categoriesMap.has(categoryName)) {
        categoriesMap.set(categoryName, []);
      }

      categoriesMap.get(categoryName)!.push(paquete);
    });

  // Transformar a ProductSections
  return Array.from(categoriesMap.entries()).map(([categoryName, packages]) => {
    // Determinar el tipo de editor basado en el nombre de la categoría
    const editorType = getEditorType(categoryName);

    return {
      productName: categoryName,
      editorType, // Tipo de editor para toda la categoría
      packages: packages.map(paquete => ({
        id: paquete.id,
        itemImage: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1Ymz-9xSwPgIeQq-1wYvupFkYwjUyyvY-0Q&s", // Placeholder - puedes agregar campo de imagen en el futuro
        name: paquete.nombre,
        itemDescription: paquete.descripcion || '',
        itemPrice: paquete.precio,
        numOfRequiredImages: paquete.cantidad_fotos,
        photoResolution: paquete.resolucion_foto,
        photoWidth: paquete.ancho_foto,
        photoHeight: paquete.alto_foto,
        editorType, // Cada paquete también tiene el tipo de editor
      }))
    };
  });
}
