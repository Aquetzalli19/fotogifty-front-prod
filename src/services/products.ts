import { apiClient } from '@/lib/api-client';
import { itemPackages } from '@/interfaces/admi-items';
import { ProductSections } from '@/interfaces/product-card';

/**
 * Servicio para la gestión de productos
 * Todas las funciones retornan Promises y manejan errores automáticamente
 */

/**
 * Obtiene todos los productos
 * @param status - Filtro opcional: 'active' | 'inactive' | 'all'
 * @returns Lista de productos
 */
export async function getAllProducts(status?: 'active' | 'inactive' | 'all') {
  const params = status ? { status } : undefined;
  return apiClient.get<itemPackages[]>('/products', { params });
}

/**
 * Obtiene un producto por su ID
 * @param id - ID del producto
 * @returns Datos del producto
 */
export async function getProductById(id: number) {
  return apiClient.get<itemPackages>(`/products/${id}`);
}

/**
 * Crea un nuevo producto
 * @param product - Datos del producto (sin ID)
 * @returns Producto creado con su ID
 */
export async function createProduct(product: Omit<itemPackages, 'id'>) {
  return apiClient.post<itemPackages>('/products', product);
}

/**
 * Actualiza un producto existente
 * @param id - ID del producto
 * @param product - Datos a actualizar (parciales)
 * @returns Producto actualizado
 */
export async function updateProduct(id: number, product: Partial<Omit<itemPackages, 'id'>>) {
  return apiClient.put<itemPackages>(`/products/${id}`, product);
}

/**
 * Cambia el estado de un producto (activo/inactivo)
 * @param id - ID del producto
 * @param itemStatus - Nuevo estado
 * @returns Producto con estado actualizado
 */
export async function updateProductStatus(id: number, itemStatus: boolean) {
  return apiClient.patch<{ id: number; itemStatus: boolean }>(`/products/${id}/status`, {
    itemStatus,
  });
}

/**
 * Elimina un producto
 * @param id - ID del producto
 * @returns Confirmación de eliminación
 */
export async function deleteProduct(id: number) {
  return apiClient.delete(`/products/${id}`);
}

/**
 * Obtiene productos agrupados por categoría (formato para catálogo de usuario)
 * Esta función puede necesitar adaptarse según cómo el backend devuelva los datos
 * @returns Productos agrupados por categoría
 */
export async function getProductsByCategory() {
  // Por ahora, obtenemos todos los productos y los agrupamos en el frontend
  // El backend podría implementar un endpoint específico para esto
  const response = await getAllProducts('active');

  if (!response.success || !response.data) {
    return { success: false, data: [] };
  }

  // Agrupar productos por clasificación
  const groupedProducts = response.data.reduce((acc, product) => {
    const category = product.productClasification;
    const existingCategory = acc.find((item) => item.productName === category);

    if (existingCategory) {
      existingCategory.packages.push({
        id: product.id,
        itemImage: '', // El backend debería proveer esto
        name: product.packageName,
        itemDescription: product.description,
        itemPrice: product.packagePrice,
        numOfRequiredImages: product.photoQuantity,
      });
    } else {
      acc.push({
        productName: category,
        packages: [
          {
            id: product.id,
            itemImage: '', // El backend debería proveer esto
            name: product.packageName,
            itemDescription: product.description,
            itemPrice: product.packagePrice,
            numOfRequiredImages: product.photoQuantity,
          },
        ],
      });
    }

    return acc;
  }, [] as ProductSections[]);

  return {
    success: true,
    data: groupedProducts,
  };
}
