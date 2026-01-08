"use client";

import { useState } from "react";
import Image from "next/image";
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
import { ImageIcon } from "lucide-react";

type ProductPackage = ShopItem & {
  productName: string;
};

export function ProductCard({ item }: { item: ProductPackage }) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = (productName: string, selectedItem: ShopItem) => {
    addItem(productName, selectedItem);
  };

  const handleBuyNow = (productName: string, selectedItem: ShopItem) => {
    addItem(productName, selectedItem);
    router.push("/user/cart");
  };

  return (
    <Card className="max-w-86 min-w-86 gap-2 border-none shadow-2xl rounded-sm">
      <CardHeader>
        <div className="relative w-full h-40 bg-muted">
          {!imageError ? (
            <Image
              src={item.itemImage}
              alt={item.name}
              width={272}
              height={124}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
            </div>
          )}
        </div>
        <CardTitle className=" text-primary w-full text-center font-normal text-lg">
          {item.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <CardDescription>
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
          onClick={() => handleAddToCart(item.productName, item)}
        >
          Añadir al carrito
        </Button>
        <Button
          variant={"secondary"}
          className="text-lg p-5"
          onClick={() => handleBuyNow(item.productName, item)}
        >
          Compra ahora
        </Button>
      </CardFooter>
    </Card>
  );
}
