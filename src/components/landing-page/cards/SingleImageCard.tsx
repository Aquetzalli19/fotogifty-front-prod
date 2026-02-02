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
    <div className="w-full flex flex-col lg:flex-row p-4 lg:px-38 lg:py-15 justify-center gap-12">
      <div className="flex flex-col w-fit min-w-1/2 gap-10 justify-center">
        <div className="flex flex-col">
          <h1 className="font-normal text-6xl justify-start">{title}</h1>
          {subtitle}
        </div>
        <LandingButton text="Ver productos" href={href} color={buttonColor} />

        {options && (
          <div className="text-2xl font-extralight justify-start">
            <p>Tamaños Disponibles:</p>

            <ul className="list-disc pl-10">
              {options.map((el, index) => {
                return <li key={index}>{el}</li>;
              })}
            </ul>
          </div>
        )}
      </div>
      <Link href={href} className="group">
        <div className="relative overflow-hidden rounded-xl">
          <Image
            alt={title}
            src={image}
            width={593}
            height={508}
            className="lg:h-120 h-auto w-fill lg:max-w-150 lg:w-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 px-6 py-3 rounded-full">
              Ver productos
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default SingleImageCard;
