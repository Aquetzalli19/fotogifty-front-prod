"use client";

import { productSlides } from "@/interfaces/product-slider";
import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface productSlidesProps {
  slides: productSlides[];
  href?: string;
}

const ProductSlides = ({ slides, href = "/user" }: productSlidesProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: "start",
      loop: true,
      skipSnaps: false,
      breakpoints: {
        "(min-width: 768px)": { slidesToScroll: 1 },
        "(min-width: 1280px)": { slidesToScroll: 1 },
      },
    },
    [Autoplay({ delay: 2000, stopOnInteraction: false })]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="w-full mt-10">
      <div className="embla overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex">
          {slides.map((el, index) => (
            <div
              key={index}
              className="embla__slide flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0 px-2 md:px-3"
            >
              <Link href={href} className="group block">
                <div className="flex flex-col items-center h-[400px] md:h-[420px] lg:h-[460px] py-6 px-4 bg-neutral-300/10 dark:bg-neutral-300/20 rounded-xl shadow-[0px_4px_6.70px_2px_rgba(0,0,0,0.15)] text-center transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 cursor-pointer overflow-hidden">
                  <div className="relative overflow-hidden rounded-2xl shrink-0 w-52 h-52 lg:w-64 lg:h-64">
                    <Image
                      alt={el.title}
                      src={el.image}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  </div>

                  <div className="mt-4 gap-2 flex flex-col items-center px-2">
                    <h3 className="text-xl md:text-2xl lg:text-3xl font-medium text-primary group-hover:text-primary/80 transition-colors line-clamp-1">
                      {el.title}
                    </h3>
                    <p className="text-sm md:text-base lg:text-xl text-neutral-700 dark:text-zinc-200 font-light line-clamp-2">
                      {el.description}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === selectedIndex
                ? "bg-primary w-8"
                : "bg-neutral-400 dark:bg-neutral-600"
            }`}
            aria-label={`Ir a slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductSlides;
