"use client";

import React from "react";
import Image from "next/image";
import { ShopItem, ProductSections } from "@/interfaces/product-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Plus, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";

interface ProductWithCategory extends ShopItem {
  categoryName: string;
}

interface ProductRecommendationsProps {
  productSections: ProductSections[];
  cartItemIds: number[];
  maxRecommendations?: number;
}

export default function ProductRecommendations({
  productSections,
  cartItemIds,
  maxRecommendations = 4,
}: ProductRecommendationsProps) {
  const { addItem } = useCartStore();

  // Aplanar todos los productos con su categoría
  const allProductsWithCategory: ProductWithCategory[] = productSections.flatMap(
    (section) =>
      section.packages.map((product) => ({
        ...product,
        categoryName: section.productName,
      }))
  );

  // Filtrar productos que NO están en el carrito
  const availableProducts = allProductsWithCategory.filter(
    (product) => !cartItemIds.includes(product.id)
  );

  // Tomar los primeros N productos (puedes implementar lógica más sofisticada)
  const recommendations = availableProducts.slice(0, maxRecommendations);

  const handleAddToCart = (product: ProductWithCategory) => {
    // Pasar el producto completo al cart store con su categoría
    addItem(product.categoryName, product);
  };

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-8">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">
          También te puede interesar
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {recommendations.map((product) => (
          <Card
            key={product.id}
            className="group hover:shadow-lg transition-shadow duration-300 overflow-hidden"
          >
            <CardContent className="p-4">
              {/* Imagen del producto */}
              <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={product.itemImage}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Información del producto */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-primary uppercase tracking-wide">
                  {product.categoryName}
                </p>
                <h3 className="text-base font-semibold text-foreground line-clamp-2 min-h-[3rem]">
                  {product.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                  {product.itemDescription}
                </p>
              </div>

              {/* Precio */}
              <div className="mt-4">
                <p className="text-2xl font-bold text-foreground font-poppins">
                  $ {product.itemPrice.toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    MXN
                  </span>
                </p>
              </div>
            </CardContent>

            <CardFooter className="p-4 pt-0">
              <Button
                onClick={() => handleAddToCart(product)}
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar al carrito
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {availableProducts.length > maxRecommendations && (
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            ¡Y {availableProducts.length - maxRecommendations} productos más disponibles!
          </p>
        </div>
      )}
    </div>
  );
}
