import { OrderCard } from "@/components/user/backlog/OrderCard";
import ProductSection from "@/components/user/main/ProductCatalogue/ProductSection";
import { UserOrder } from "@/interfaces/order-summary";
import { ProductSections } from "@/interfaces/product-card";

import React from "react";

const page = () => {
  const order: UserOrder = {
    dateOfOrder: "2024-09-20T10:00:00",
    orderItems: [
      { productName: "Polaroid", package: "50 fotos 11x14", itemPrice: 150.0 },
      {
        productName: "Ampliaciones",
        package: "10 fotos 8x24",
        itemPrice: 250.5,
      },
      { productName: "Prints", package: "100 fotos 4x6", itemPrice: 120.0 },
    ],
    status: "Entregado",
    images: ["url-a-imagen1.jpg", "url-a-imagen2.jpg"],
  };
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
      },
      {
        id: 2,
        name: "Pack 50 6x8",
        itemDescription:
          "Impresas en papel lustre profesional con revelado tradicional.",
        itemPrice: 10.0,
        itemImage: "/slide1.jpg",
      },
      {
        id: 3,
        name: "Pack 50 6x8",
        itemDescription:
          "Impresas en papel lustre profesional con revelado tradicional.",
        itemPrice: 10.0,
        itemImage: "/slide1.jpg",
      },
      {
        id: 4,
        name: "Pack 50 6x8",
        itemDescription:
          "Impresas en papel lustre profesional con revelado tradicional.",
        itemPrice: 10.0,
        itemImage: "/slide1.jpg",
      },
      {
        id: 5,
        name: "Pack 50 6x8",
        itemDescription:
          "Impresas en papel lustre profesional con revelado tradicional.",
        itemPrice: 10.0,
        itemImage: "/slide1.jpg",
      },
      {
        id: 6,
        name: "Pack 50 6x8",
        itemDescription:
          "Impresas en papel lustre profesional con revelado tradicional.",
        itemPrice: 10.0,
        itemImage: "/slide1.jpg",
      },
    ],
  };
  return (
    <div>
      <ProductSection item={item} />

      <OrderCard order={order} />
    </div>
  );
};

export default page;
