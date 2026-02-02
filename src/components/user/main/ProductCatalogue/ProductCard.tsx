"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShopItem } from "@/interfaces/product-card";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart-store";
import { useRouter } from "next/navigation";
import { ImageIcon, Eye } from "lucide-react";

type ProductPackage = ShopItem & {
  productName: string;
};

export function ProductCard({ item }: { item: ProductPackage }) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = (e: React.MouseEvent, productName: string, selectedItem: ShopItem) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(productName, selectedItem);
  };

  const handleBuyNow = (e: React.MouseEvent, productName: string, selectedItem: ShopItem) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(productName, selectedItem);
    router.push("/user/cart");
  };

  return (
    <Link href={`/user/product/${item.id}`}>
      <Card className="max-w-86 min-w-86 gap-2 border-none shadow-2xl rounded-sm group cursor-pointer transition-all duration-300 hover:shadow-3xl hover:-translate-y-1">
        <CardHeader>
          <div className="relative w-full h-40 bg-muted overflow-hidden">
            {!imageError ? (
              <Image
                src={item.itemImage}
                alt={item.name}
                width={272}
                height={124}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
              </div>
            )}
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="bg-white/90 dark:bg-black/90 rounded-full p-3">
                <Eye className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
          <CardTitle className="text-primary w-full text-center font-normal text-lg group-hover:text-primary/80 transition-colors">
            {item.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <CardDescription className="line-clamp-2">
              {item.itemDescription}
            </CardDescription>
            <Separator className="my-4" />
            <p className="text-lg font-medium font-poppins w-full text-right">
              ${item.itemPrice.toFixed(2)}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 items-center">
          <Button
            className="text-lg p-5"
            onClick={(e) => handleAddToCart(e, item.productName, item)}
          >
            Añadir al carrito
          </Button>
          <Button
            variant={"secondary"}
            className="text-lg p-5"
            onClick={(e) => handleBuyNow(e, item.productName, item)}
          >
            Compra ahora
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
