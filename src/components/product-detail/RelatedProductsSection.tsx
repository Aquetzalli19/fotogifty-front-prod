"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ShopItem } from "@/interfaces/product-card";

function RelatedProductCard({
  product,
  categoryName,
}: {
  product: ShopItem;
  categoryName: string;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <Link href={`/user/product/${product.id}`}>
      <Card className="group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <div className="relative aspect-square bg-muted overflow-hidden">
          {!imageError ? (
            <Image
              src={product.itemImage}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">{categoryName}</p>
          <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h4>
          <p className="text-lg font-bold text-primary mt-1">
            ${product.itemPrice.toFixed(2)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

interface OtherProduct extends ShopItem {
  categoryName: string;
}

interface RelatedProductsSectionProps {
  relatedProducts: ShopItem[];
  otherProducts: OtherProduct[];
  categoryName: string;
}

export default function RelatedProductsSection({
  relatedProducts,
  otherProducts,
  categoryName,
}: RelatedProductsSectionProps) {
  if (relatedProducts.length === 0 && otherProducts.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 pb-8">
      {relatedProducts.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Más en {categoryName}</h2>
            <Link
              href="/user"
              className="text-sm text-primary hover:underline flex items-center"
            >
              Ver todos
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((relatedProduct) => (
              <RelatedProductCard
                key={relatedProduct.id}
                product={relatedProduct}
                categoryName={categoryName}
              />
            ))}
          </div>
        </motion.section>
      )}

      {otherProducts.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              También te puede interesar
            </h2>
            <Link
              href="/user"
              className="text-sm text-primary hover:underline flex items-center"
            >
              Ver catálogo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {otherProducts.map((otherProduct) => (
              <RelatedProductCard
                key={otherProduct.id}
                product={otherProduct}
                categoryName={otherProduct.categoryName}
              />
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}
