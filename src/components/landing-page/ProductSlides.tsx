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
    className: "center",
    centerMode: true,
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
          slidesToShow: 3,
          slidesToScroll: 1,
          autoplay: true,
          autoplaySpeed: 2000,
          infinite: true,
          dots: true,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          initialSlide: 2,
          autoplay: true,
          autoplaySpeed: 2000,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          autoplay: true,
          autoplaySpeed: 2000,
        },
      },
    ],
  };
  return (
    <div className="w-full mt-10">
      <div className="slider-container">
        <Slider {...settings}>
          {slides.map((el, index) => {
            return (
              <div key={index}>
                <Link href={href} className="group block">
                  <div className="flex flex-col justify-center items-center w-78 h-100 py-8 lg:px-14 pt-4 pb-2 lg:w-92 lg:h-122 bg-neutral-300/10 dark:bg-neutral-300/20 rounded-xs shadow-[0px_4px_6.70px_2px_rgba(0,0,0,0.15)] m-6 text-center transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 cursor-pointer">
                    <div className="relative overflow-hidden rounded-lg mb-5">
                      <Image
                        alt={el.title}
                        src={el.image}
                        width={280}
                        height={280}
                        className="w-50 h-50 lg:w-68 lg:h-66 object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </div>

                    <div className="gap-4 flex flex-col">
                      <h3 className="text-3xl font-medium text-primary group-hover:text-primary/80 transition-colors">
                        {el.title}
                      </h3>
                      <p className="text-wrap text-xl text-neutral-700 dark:text-zinc-200 font-light">
                        {el.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </Slider>
      </div>
    </div>
  );
};

export default ProductSlides;
