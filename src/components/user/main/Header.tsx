"use client";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { useAuthStore } from "@/stores/auth-store";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const Header = () => {
  const items = useCartStore((state) => state.items);
  const { user } = useAuthStore();
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const total = items.reduce((acc, item) => acc + item.quantity, 0);
    setTotalItems(total);
  }, [items]);

  return (
    <header className=" w-full h-20 sticky top-0 flex flex-row justify-between items-center z-20 bg-background py-2 px-6 pl-16 md:pl-20">
      <p className=" md:text-5xl text-2xl">
        ¡Hola, <span className=" text-secondary">{user?.nombre || "Usuario"}</span>!
      </p>
      <Link href={"/user/cart"} className=" h-fit md:w-44">
        <Button className="text-xl w-full justify-center gap-3 h-fit flex flex-row">
          <ShoppingCart className="hidden md:flex" /> <p>Mi carrito</p>{" "}
          <div className=" rounded-full w-6 h-6 bg-background text-primary font-poppins text-sm justify-center flex items-center text-center">
            {totalItems}
          </div>
        </Button>
      </Link>
    </header>
  );
};

export default Header;
