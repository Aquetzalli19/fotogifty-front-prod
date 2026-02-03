"use client";

import React from "react";
import { useRouter } from "next/navigation";
import LandingButton from "../common/LandingButton";
import { LandingSectionComplete } from "@/interfaces/landing-content";

interface singleProductImageProps {
  image: string;
  title: string;
  data?: LandingSectionComplete | null;
}

const SingleProductImage = ({ image, title, data }: singleProductImageProps) => {
  const router = useRouter();
  const section = data?.section;

  const botonTexto = section?.botonTexto || "Ver productos";
  const botonColor = section?.botonColor || "#E04F8B";
  const botonEnlace = section?.botonEnlace || "/user";

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the button (it has its own link)
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    router.push(botonEnlace);
  };

  return (
    <section
      style={{ backgroundImage: `url(${image})`, backgroundPosition: "center" }}
      className="bg-cover flex flex-col w-full h-80 lg:h-180 justify-center items-center cursor-pointer group"
      onClick={handleClick}
    >
      <div className="flex flex-col bg-gray-900/20 group-hover:bg-gray-900/40 transition-colors duration-300 w-full h-full justify-center items-center content-center gap-5">
        <h1 className="text-shadow-lg text-neutral-50 text-4xl lg:text-6xl lg:w-180 text-center group-hover:scale-105 transition-transform duration-300">
          {title}
        </h1>
        <LandingButton text={botonTexto} color={botonColor} href={botonEnlace} />
      </div>
    </section>
  );
};

export default SingleProductImage;
