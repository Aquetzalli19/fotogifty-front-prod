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
  imagen_url?: string; // URL de la imagen del paquete en S3
  template_url?: string; // URL del template PNG personalizado en S3
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
 * Crea un nuevo paquete con imagen
 * @param paquete - Datos del paquete
 * @param imagen - Archivo de imagen (opcional)
 * @returns Paquete creado con imagen_url
 */
export async function crearPaqueteConImagen(paquete: CrearPaqueteDTO, imagen?: File) {
  const formData = new FormData();

  // Agregar imagen si existe
  if (imagen) {
    formData.append('imagen', imagen);
  }

  // Agregar todos los campos del paquete
  formData.append('nombre', paquete.nombre);
  formData.append('cantidad_fotos', paquete.cantidad_fotos.toString());
  formData.append('precio', paquete.precio.toString());
  formData.append('estado', paquete.estado.toString());
  formData.append('categoria_id', paquete.categoria_id.toString());
  formData.append('descripcion', paquete.descripcion);
  formData.append('resolucion_foto', paquete.resolucion_foto.toString());
  formData.append('ancho_foto', paquete.ancho_foto.toString());
  formData.append('alto_foto', paquete.alto_foto.toString());

  // Usar fetch directo en lugar de apiClient para enviar FormData
  const response = await fetch('/api/paquetes', {
    method: 'POST',
    body: formData,
    // NO incluir Content-Type - el navegador lo establece automáticamente con boundary
  });

  if (!response.ok) {
    throw new Error('Error al crear paquete con imagen');
  }

  const result = await response.json();
  return result;
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
 * Actualiza un paquete existente con imagen
 * @param id - ID del paquete
 * @param paquete - Datos a actualizar
 * @param imagen - Archivo de imagen (opcional) - si se provee, actualiza la imagen
 * @returns Paquete actualizado con imagen_url
 */
export async function actualizarPaqueteConImagen(id: number, paquete: ActualizarPaqueteDTO, imagen?: File) {
  const formData = new FormData();

  // Agregar imagen si existe
  if (imagen) {
    formData.append('imagen', imagen);
  }

  // Agregar todos los campos del paquete que estén definidos
  if (paquete.nombre !== undefined) formData.append('nombre', paquete.nombre);
  if (paquete.cantidad_fotos !== undefined) formData.append('cantidad_fotos', paquete.cantidad_fotos.toString());
  if (paquete.precio !== undefined) formData.append('precio', paquete.precio.toString());
  if (paquete.estado !== undefined) formData.append('estado', paquete.estado.toString());
  if (paquete.categoria_id !== undefined) formData.append('categoria_id', paquete.categoria_id.toString());
  if (paquete.descripcion !== undefined) formData.append('descripcion', paquete.descripcion);
  if (paquete.resolucion_foto !== undefined) formData.append('resolucion_foto', paquete.resolucion_foto.toString());
  if (paquete.ancho_foto !== undefined) formData.append('ancho_foto', paquete.ancho_foto.toString());
  if (paquete.alto_foto !== undefined) formData.append('alto_foto', paquete.alto_foto.toString());

  // Usar fetch directo en lugar de apiClient para enviar FormData
  const response = await fetch(`/api/paquetes/${id}`, {
    method: 'PUT',
    body: formData,
    // NO incluir Content-Type - el navegador lo establece automáticamente con boundary
  });

  if (!response.ok) {
    throw new Error('Error al actualizar paquete con imagen');
  }

  const result = await response.json();
  return result;
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
        itemImage: paquete.imagen_url || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1Ymz-9xSwPgIeQq-1wYvupFkYwjUyyvY-0Q&s", // Usa imagen_url si existe, si no usa placeholder
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
