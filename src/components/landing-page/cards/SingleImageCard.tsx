import LandingButton from "@/components/common/LandingButton";
import Image from "next/image";
import Link from "next/link";
import React, { JSX } from "react";

interface SingleImageCardProps {
  title: string;
  subtitle: JSX.Element;
  options?: string[];
  image: string;
  buttonColor: string;
  href?: string;
}

const SingleImageCard = ({
  title,
  subtitle,
  options,
  image,
  buttonColor,
  href = "/user",
}: SingleImageCardProps) => {
  return (
    <div className="w-full flex flex-col lg:flex-row px-4 sm:px-8 lg:px-16 xl:px-24 py-8 lg:py-12 justify-center items-center gap-8 lg:gap-12 overflow-hidden">
      <div className="flex flex-col w-full lg:w-1/2 gap-6 lg:gap-10 justify-center items-center lg:items-start text-center lg:text-left">
        <div className="flex flex-col gap-2">
          <h1 className="font-normal text-3xl sm:text-4xl lg:text-5xl xl:text-6xl">{title}</h1>
          <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl">
            {subtitle}
          </div>
        </div>
        <LandingButton text="Ver productos" href={href} color={buttonColor} />

        {options && (
          <div className="text-lg sm:text-xl lg:text-2xl font-extralight">
            <p>Tamaños Disponibles:</p>

            <ul className="list-disc pl-6 lg:pl-10">
              {options.map((el, index) => {
                return <li key={index}>{el}</li>;
              })}
            </ul>
          </div>
        )}
      </div>
      <Link href={href} className="group flex-shrink-0">
        <div className="relative overflow-hidden rounded-xl">
          <Image
            alt={title}
            src={image}
            width={593}
            height={508}
            unoptimized
            className="h-64 sm:h-80 lg:h-96 xl:h-[480px] w-auto max-w-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg lg:text-xl font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 px-4 lg:px-6 py-2 lg:py-3 rounded-full">
              Ver productos
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default SingleImageCard;
