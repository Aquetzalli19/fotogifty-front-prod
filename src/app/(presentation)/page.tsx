"use client";

import Hero from "@/components/landing-page/sections/Hero";
import Legend from "@/components/landing-page/sections/Legend";
import ProductSlider from "@/components/landing-page/sections/ProductSlider";
import React, { useEffect } from "react";
import Lenis from "lenis";
import SingleProductImage from "@/components/landing-page/SingleProductImage";
import Extensions from "@/components/landing-page/sections/Extensions";
import Polaroids from "@/components/landing-page/sections/Polaroids";
import Prints from "@/components/landing-page/sections/Prints";
import Calendar from "@/components/landing-page/sections/Calendar";
import PlatformShowcase from "@/components/landing-page/sections/PlatformShowcase";
import StoreLocationMap from "@/components/landing-page/StoreLocationMap";
import { Facebook, Instagram, Mail, X } from "lucide-react";

const Page = () => {
  const slides = ["/slide1.jpg", "/slide2.jpg", "/slide3.jpg", "/slide4.jpg"];
  useEffect(() => {
    const lenis = new Lenis();

    function raf(time: number) {
      lenis.raf(time);

      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
  }, []);

  return (
    <div className="w-full">
      <Hero slides={slides} />
      <Extensions />
      <ProductSlider />
      <Legend />
      <Calendar />
      <SingleProductImage
        image="./SingleProduct.jpg"
        title="Pack de 100 fotografías tamaño 4x6"
      />
      <Prints />
      <Polaroids />
      <PlatformShowcase />

      {/* Ubicación de la tienda */}
      <StoreLocationMap />
    </div>
  );
};

export default Page;
