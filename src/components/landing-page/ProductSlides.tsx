"use client";

import { productSlides } from "@/interfaces/product-slider";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import Slider from "react-slick";

interface productSlidesProps {
  slides: productSlides[];
  href?: string;
}

const ProductSlides = ({ slides, href = "/user" }: productSlidesProps) => {
  const settings = {
    dots: true,
    arrows: false,
    infinite: true,
    speed: 2000,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };
  return (
    <div className="w-full mt-10 px-4">
      <div className="slider-container">
        <Slider {...settings}>
          {slides.map((el, index) => {
            return (
              <div key={index} className="px-3">
                <div className="flex justify-center">
                  <Link href={href} className="group block w-full max-w-[300px] sm:max-w-none">
                    <div className="flex flex-col items-center h-[380px] sm:h-[410px] lg:h-[450px] py-6 px-4 bg-neutral-300/10 dark:bg-neutral-300/20 rounded-xl shadow-[0px_4px_6.70px_2px_rgba(0,0,0,0.15)] text-center transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 cursor-pointer overflow-hidden">
                      <div className="relative overflow-hidden rounded-2xl shrink-0 w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64">
                        <Image
                          alt={el.title}
                          src={el.image}
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                      </div>

                      <div className="mt-5 gap-3 flex flex-col items-center px-2">
                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-medium text-primary group-hover:text-primary/80 transition-colors line-clamp-1">
                          {el.title}
                        </h3>
                        <p className="text-base sm:text-lg lg:text-xl text-neutral-700 dark:text-zinc-200 font-light line-clamp-2">
                          {el.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            );
          })}
        </Slider>
      </div>
    </div>
  );
};

export default ProductSlides;
