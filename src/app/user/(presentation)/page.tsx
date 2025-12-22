import Header from "@/components/user/main/Header";
import ProductSection from "@/components/user/main/ProductCatalogue/ProductSection";
import { ProductSections } from "@/interfaces/product-card";
import React from "react";
import { obtenerTodosPaquetes, agruparPaquetesPorCategoria } from "@/services/packages";

// Forzar renderizado dinámico para que las peticiones a la API funcionen
export const dynamic = 'force-dynamic';

/**
 * Obtiene todos los productos dinámicamente desde la API.
 * Todas las categorías (incluyendo Calendarios y Polaroids) son dinámicas.
 */
async function getProductData(): Promise<ProductSections[]> {
  try {
    // Obtener todos los paquetes desde la API
    const response = await obtenerTodosPaquetes();

    if (response.success && response.data) {
      // Transformar los paquetes de la API a ProductSections agrupados por categoría
      const products = agruparPaquetesPorCategoria(response.data);
      console.log('Productos obtenidos de la API:', products.length, 'categorías');
      return products;
    } else {
      console.warn('No se pudieron obtener productos de la API');
      return [];
    }
  } catch (error) {
    console.error("Error fetching product data:", error);
    return [];
  }
}

const page = async () => {
  const productData = await getProductData();

  console.log('=== DEBUG USER PAGE ===');
  console.log('Total categorías:', productData.length);
  console.log('Categorías:', productData.map(p => p.productName));
  console.log('Total paquetes:', productData.reduce((acc, cat) => acc + cat.packages.length, 0));

  return (
    <div className=" w-full">
      <Header />
      <div className="w-full flex flex-col">
        {productData.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-2xl text-muted-foreground">
              No se encontraron productos
            </p>
          </div>
        )}
        {productData.map((el) => (
          <ProductSection key={el.productName} item={el} />
        ))}
      </div>
    </div>
  );
};

export default page;
