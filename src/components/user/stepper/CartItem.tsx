"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart-store";
import { Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import React from "react";

interface CartItemProps {
  id: number;
  image: string;
  productName: string;
  packageName: string;
  description: string;
  quantity: number;
  price: number;
  showQuantityControls?: boolean; // Optional prop to show/hide quantity controls
}

const CartItem = ({ ...item }: CartItemProps) => {
  const { increaseQuantity, decreaseQuantity, removeItem } = useCartStore();

  const totalPrice = (item.price * item.quantity).toFixed(2);

  return (
    <Card className="flex flex-col sm:flex-row p-4 sm:p-6 w-full max-w-2xl h-auto min-h-[180px] items-center font-raleway">
      <Image
        src={item.image}
        width={100}
        height={100}
        alt=""
        className="object-cover w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-0 sm:mr-4 self-start"
      />

      <div className="w-full flex flex-col gap-2">
        <CardHeader className="w-full p-0 sm:p-0">
          <div className="flex flex-col sm:flex-row w-full justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <CardTitle className="text-base sm:text-lg break-words">{`${item.productName}: ${item.packageName}`}</CardTitle>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3 sm:gap-6 w-full sm:w-auto justify-between sm:justify-normal">
              {item.showQuantityControls !== false ? (
                <div className="flex flex-row bg-secondary/30 min-w-24 sm:min-w-28 h-8 text-secondary border border-secondary rounded-full justify-around items-center content-center">
                  <Button
                    variant={"outline"}
                    onClick={() => decreaseQuantity(item.id)}
                    className="border-0 bg-transparent text-secondary shadow-none cursor-pointer hover:bg-transparent hover:text-secondary w-8 h-8 p-0 aspect-square"
                  >
                    <Minus size={16} />
                  </Button>

                  <span className="text-center font-poppins w-8">
                    {item.quantity}
                  </span>
                  <Button
                    variant={"outline"}
                    onClick={() => increaseQuantity(item.id)}
                    className="border-0 bg-transparent text-secondary shadow-none cursor-pointer hover:bg-transparent hover:text-secondary w-8 h-8 p-0 aspect-square"
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              ) : (
                <div className="text-center font-poppins min-w-24">
                  Cantidad: {item.quantity}
                </div>
              )}

              <Button
                onClick={() => removeItem(item.id)}
                className="h-8 w-full sm:w-auto px-3 py-1 text-xs sm:text-sm"
              >
                <X size={16} className="mr-1" /> Eliminar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2 p-0 sm:p-0 mt-2">
          <CardDescription className="break-words">{`Descripción: ${item.description}`}</CardDescription>
          <Separator className="border-1 border-border hidden sm:block" />
          <div className="w-full justify-end flex font-poppins font-semibold mt-2 sm:mt-0">
            <p className="text-base sm:text-lg">{`$ ${totalPrice}`}</p>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default CartItem;
