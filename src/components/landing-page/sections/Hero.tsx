"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { LandingSectionComplete } from "@/interfaces/landing-content";

interface heroProps {
  slides: string[];
  data?: LandingSectionComplete | null;
}

const Hero = ({ slides, data }: heroProps) => {
  const section = data?.section;
  const carouselConfig = section?.configuracionExtra;

  const autoplayEnabled = carouselConfig?.autoplay ?? true;
  const autoplayDelay = carouselConfig?.autoplaySpeed ?? 3000;
  const loopEnabled = carouselConfig?.infinite ?? true;

  const [emblaRef] = useEmblaCarousel(
    {
      loop: loopEnabled,
      duration: carouselConfig?.transitionSpeed ?? 3000,
    },
    autoplayEnabled ? [Autoplay({ delay: autoplayDelay, stopOnInteraction: false })] : []
  );

  const titulo = section?.titulo || "Imprime y recibe tus fotos";
  const subtitulo = section?.subtitulo || "en pocos clics";
  const botonTexto = section?.botonTexto || "Ver productos";
  const botonEnlace = section?.botonEnlace || "/user";
  const botonColor = section?.botonColor;
  const colorPrimario = section?.colorPrimario || "#E04F8B";

  return (
    <section className="w-full h-[60vh] md:h-[70vh] lg:h-screen relative">
      <div className="absolute z-20 flex flex-col items-center text-center w-full h-full justify-center gap-4 md:gap-8 lg:gap-12 bg-gray-900/20 px-4">
        <h1 className="text-white font-medium text-2xl sm:text-3xl md:text-5xl lg:text-7xl xl:text-8xl leading-tight">
          {titulo} <br />
          <span style={{ color: colorPrimario }}>{subtitulo}</span>
        </h1>
        <Link href={botonEnlace}>
          <Button
            className="px-6 py-3 md:px-8 md:py-4 lg:px-10 lg:py-5 rounded-xl w-fit h-fit cursor-pointer transition-colors"
            style={botonColor ? { backgroundColor: botonColor, color: "white" } : undefined}
          >
            <span className="font-bold text-lg md:text-2xl lg:text-3xl">{botonTexto}</span>
          </Button>
        </Link>
      </div>
      <div className="embla overflow-hidden h-[60vh] md:h-[70vh] lg:h-screen" ref={emblaRef}>
        <div className="embla__container flex h-full">
          {slides.map((el, index) => (
            <div key={index} className="embla__slide flex-[0_0_100%] min-w-0 relative h-full">
              <Image
                src={el}
                alt={`Slide ${index + 1}`}
                fill
                unoptimized
                className="object-cover"
                priority={index === 0}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
