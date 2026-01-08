import { Paquete } from "@/services/packages";
import { itemPackages } from "@/interfaces/admi-items";

/**
 * Mapea un paquete de la API al formato del frontend
 */
export function mapPaqueteToItemPackage(paquete: Paquete, categoriaNombre?: string): itemPackages {
  return {
    id: paquete.id,
    packageName: paquete.nombre,
    productClasification: categoriaNombre || `Categoría ${paquete.categoria_id}`,
    description: paquete.descripcion,
    photoQuantity: paquete.cantidad_fotos,
    packagePrice: paquete.precio,
    itemStatus: paquete.estado,
    photoResolution: paquete.resolucion_foto,
    photoWidth: paquete.ancho_foto,
    photoHeight: paquete.alto_foto,
    imagen_url: paquete.imagen_url, // Incluir la URL de la imagen
  };
}

/**
 * Mapea un array de paquetes de la API al formato del frontend
 */
export function mapPaquetesToItemPackages(paquetes: Paquete[], categorias?: Map<number, string>): itemPackages[] {
  return paquetes.map((paquete) => {
    const categoriaNombre = categorias?.get(paquete.categoria_id);
    return mapPaqueteToItemPackage(paquete, categoriaNombre);
  });
}
