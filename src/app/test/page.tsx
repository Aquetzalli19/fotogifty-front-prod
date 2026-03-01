import ProductSection from "@/components/user/main/ProductCatalogue/ProductSection";
import { ProductSections } from "@/interfaces/product-card";

import React from "react";

const page = () => {
  const item: ProductSections = {
    productName: "Calendario",
    packages: [
      {
        id: 1,
        name: "Pack 50 6x8",
        itemDescription:
          "Impresas en papel lustre profesional con revelado tradicional.",
        itemPrice: 10.0,
        itemImage: "/slide1.jpg",
        numOfRequiredImages: 1,
        photoResolution: 300,
        photoWidth: 6,
        photoHeight: 8,
      },
      {
        id: 2,
        name: "Pack 50 6x8",
        itemDescription:
          "Impresas en papel lustre profesional con revelado tradicional.",
        itemPrice: 10.0,
        itemImage: "/slide1.jpg",
        numOfRequiredImages: 1,
        photoResolution: 300,
        photoWidth: 6,
        photoHeight: 8,
      },
      {
        id: 3,
        name: "Pack 50 6x8",
        itemDescription:
          "Impresas en papel lustre profesional con revelado tradicional.",
        itemPrice: 10.0,
        itemImage: "/slide1.jpg",
        numOfRequiredImages: 1,
        photoResolution: 300,
        photoWidth: 6,
        photoHeight: 8,
      },
      {
        id: 4,
        name: "Pack 50 6x8",
        itemDescription:
          "Impresas en papel lustre profesional con revelado tradicional.",
        itemPrice: 10.0,
        itemImage: "/slide1.jpg",
        numOfRequiredImages: 1,
        photoResolution: 300,
        photoWidth: 6,
        photoHeight: 8,
      },
      {
        id: 5,
        name: "Pack 50 6x8",
        itemDescription:
          "Impresas en papel lustre profesional con revelado tradicional.",
        itemPrice: 10.0,
        itemImage: "/slide1.jpg",
        numOfRequiredImages: 1,
        photoResolution: 300,
        photoWidth: 6,
        photoHeight: 8,
      },
      {
        id: 6,
        name: "Pack 50 6x8",
        itemDescription:
          "Impresas en papel lustre profesional con revelado tradicional.",
        itemPrice: 10.0,
        itemImage: "/slide1.jpg",
        numOfRequiredImages: 1,
        photoResolution: 300,
        photoWidth: 6,
        photoHeight: 8,
      },
    ],
  };
  return (
    <div>
      <ProductSection item={item} />

      {/* <OrderCard order={order} /> */}
    </div>
  );
};

export default page;
