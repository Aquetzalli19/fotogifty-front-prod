import React from "react";
import ProductSlides from "../ProductSlides";
import { productSlides } from "@/interfaces/product-slider";
import { LandingSectionComplete } from "@/interfaces/landing-content";

interface ProductSliderProps {
  data?: LandingSectionComplete | null;
}

const ProductSlider = ({ data }: ProductSliderProps) => {
  const section = data?.section;
  const slides = data?.slides || [];

  const textoPrimario = section?.textoPrimario || "papel lustre profesional";
  const textoSecundario = section?.textoSecundario || ", que realza los colores y los detalles con un acabado elegante y duradero.";

  // Map slides from CMS to productSlides format
  const productSlider: productSlides[] = slides.filter(s => s.activo).length > 0
    ? slides.filter(s => s.activo).map(s => ({
        title: s.titulo || "Pack 50 5x7",
        description: s.descripcion || "Impresas en papel lustre profesional con revelado tradicional.",
        image: s.imagenUrl,
      }))
    : [
        {
          title: "Pack 50 5x7",
          description: "Impresas en papel lustre profesional con revelado tradicional.",
          image: "/product-slider/slide1.jpg",
        },
        {
          title: "Pack 50 5x7",
          description: "Impresas en papel lustre profesional con revelado tradicional.",
          image: "/product-slider/slide1.jpg",
        },
        {
          title: "Pack 50 5x7",
          description: "Impresas en papel lustre profesional con revelado tradicional.",
          image: "/product-slider/slide1.jpg",
        },
        {
          title: "Pack 50 5x7",
          description: "Impresas en papel lustre profesional con revelado tradicional.",
          image: "/product-slider/slide1.jpg",
        },
      ];

  return (
    <section className=" w-full mb-10">
      <div className="w-full text-3xl text-center pr-12 pl-12 p-2 mt-6">
        <p>
          Cada fotografía es impresa en{" "}
          <span className=" text-primary font-bold">
            {textoPrimario}
          </span>{" "}
          {textoSecundario.startsWith(",") ? textoSecundario : `, ${textoSecundario}`}
        </p>
      </div>
      <ProductSlides slides={productSlider} />
    </section>
  );
};

export default ProductSlider;
