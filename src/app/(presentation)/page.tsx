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

      {/* Sección de contacto */}
      <div className="px-4 md:px-10 py-12 md:py-16 w-full">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Título */}
          <div className="font-light text-primary text-4xl md:text-5xl lg:text-6xl lg:w-1/2 flex items-center justify-center lg:justify-start">
            <p>¡Contáctanos!</p>
          </div>

          {/* Información de contacto */}
          <div className="lg:w-1/2 flex flex-col gap-6">
            {/* Mapa responsivo */}
            <div className="w-full aspect-square max-w-md mx-auto lg:mx-0 rounded-lg overflow-hidden">
              <iframe
                className="w-full h-full"
                src="https://maps.google.com/maps?width=600&amp;height=600&amp;hl=en&amp;q=1%20Grafton%20Street,%20Dublin,%20Ireland+(FotoGifty)&amp;t=&amp;z=14&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
              />
            </div>

            {/* Dirección y horarios */}
            <div className="text-center lg:text-left">
              <p className="text-base md:text-lg">
                Calle # C.P. 76000 <br />
                Horarios: lunes a viernes 00:00 - 00:00
              </p>
            </div>

            {/* Redes sociales */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-row text-base md:text-lg gap-3 text-primary items-center">
                <Mail color="#E04F8B" size={22} strokeWidth={1.5} />
                <p>example@correo.com</p>
              </div>
              <div className="flex flex-row text-base md:text-lg gap-3 text-primary items-center">
                <Instagram color="#E04F8B" size={22} strokeWidth={1.5} />
                <p>Instagram</p>
              </div>
              <div className="flex flex-row text-base md:text-lg gap-3 text-primary items-center">
                <Facebook color="#E04F8B" size={22} strokeWidth={1.5} />
                <p>Facebook</p>
              </div>
              <div className="flex flex-row text-base md:text-lg gap-3 text-primary items-center">
                <X color="#E04F8B" size={22} strokeWidth={1.5} />
                <p>Twitter</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
