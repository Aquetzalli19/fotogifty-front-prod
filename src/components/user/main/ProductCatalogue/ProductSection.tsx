import { Separator } from "@/components/ui/separator";
import type { ProductSections } from "@/interfaces/product-card";
import React from "react";
import { ProductCard } from "./ProductCard";

const ProductSection = ({ item }: { item: ProductSections }) => {
  return (
    <div className="px-12 py-4 h-fit">
      <h1 className=" text-primary text-4xl">{item.productName}</h1>
      <Separator className="my-4" />

      <div className="flex flex-row overflow-x-scroll w-full gap-2 h-fit p-2">
        {item.packages.map((el, index) => {
          return (
            <ProductCard
              key={index}
              item={{ ...el, productName: item.productName }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ProductSection;
