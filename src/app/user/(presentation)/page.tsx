"use client";

import Header from "@/components/user/main/Header";
import ProductSection from "@/components/user/main/ProductCatalogue/ProductSection";
import { ProductSections } from "@/interfaces/product-card";
import React, { useEffect, useState } from "react";
import { obtenerTodosPaquetes, agruparPaquetesPorCategoria } from "@/services/packages";

export default function UserPage() {
  const [productData, setProductData] = useState<ProductSections[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log('🔍 Obteniendo paquetes desde la API...');

        const response = await obtenerTodosPaquetes();
        console.log('📦 Respuesta de la API:', response);

        if (response.success && response.data) {
          const products = agruparPaquetesPorCategoria(response.data);

          console.log('=== DEBUG USER PAGE ===');
          console.log('Total categorías:', products.length);
          console.log('Categorías:', products.map(p => p.productName));
          console.log('Total paquetes:', products.reduce((acc, cat) => acc + cat.packages.length, 0));
          console.log('Datos completos:', products);

          setProductData(products);
        } else {
          console.warn('⚠️ No se pudieron obtener productos:', response);
          setError(response.message || 'No se pudieron cargar los productos');
        }
      } catch (err) {
        console.error('❌ Error al obtener productos:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar productos');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="w-full">
        <Header />
        <div className="w-full flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-xl text-muted-foreground">Cargando productos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <Header />
        <div className="w-full flex items-center justify-center p-12">
          <div className="text-center">
            <p className="text-2xl text-destructive mb-2">Error al cargar productos</p>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
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
}
