import React from "react";
import ProductSlides from "../ProductSlides";
import { productSlides } from "@/interfaces/product-slider";

const ProductSlider = () => {
  const productSlider: productSlides[] = [
    {
      title: "Pack 50 5x7",
      description:
        "Impresas en papel lustre profesional con revelado tradicional.",
      image: "/product-slider/slide1.jpg",
    },
    {
      title: "Pack 50 5x7",
      description:
        "Impresas en papel lustre profesional con revelado tradicional.",
      image: "/product-slider/slide1.jpg",
    },
    {
      title: "Pack 50 5x7",
      description:
        "Impresas en papel lustre profesional con revelado tradicional.",
      image: "/product-slider/slide1.jpg",
    },
    {
      title: "Pack 50 5x7",
      description:
        "Impresas en papel lustre profesional con revelado tradicional.",
      image: "/product-slider/slide1.jpg",
    },
  ];
  return (
    <section className=" w-full mb-10">
      <div className="w-full text-3xl text-center pr-12 pl-12 p-2 mt-6">
        <p>
          Cada fotografía es impresa en{" "}
          <span className=" text-primary font-bold">
            papel lustre profesional
          </span>{" "}
          , que realza los colores y los detalles con un{" "}
          <span className=" text-primary font-bold">
            acabado elegante y duradero
          </span>
          .
        </p>
      </div>
      <ProductSlides slides={productSlider} />
    </section>
  );
};

export default ProductSlider;
