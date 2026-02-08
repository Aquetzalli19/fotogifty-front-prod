import LandingButton from "@/components/common/LandingButton";
import Image from "next/image";
import Link from "next/link";
import React, { JSX } from "react";

interface DualImageCardProps {
  title: string;
  subtitle: JSX.Element;
  options?: string[];
  image: string;
  buttonColor?: string;
  href?: string;
}

const DualImageCard = ({
  title,
  subtitle,
  options,
  image,
  buttonColor = "#E04F8B",
  href = "/user",
}: DualImageCardProps) => {
  return (
    <div className="flex w-full gap-4 lg:gap-0 flex-col lg:flex-row lg:h-190 px-10 py-4">
      <Link href={href} className="group w-full lg:w-1/4">
        <div className="relative overflow-hidden rounded-md h-full">
          <Image
            src={image}
            alt={title}
            width={302}
            height={592}
            unoptimized
            className="w-full h-full object-cover rounded-md transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
        </div>
      </Link>
      <div className="flex flex-col w-full lg:w-2/4 justify-center items-center gap-10 lg:px-14">
        <h1 className="font-normal text-7xl justify-start">{title}</h1>
        {subtitle}

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

        <LandingButton text="Ver productos" color={buttonColor} href={href} />
      </div>
      <Link href={href} className="group w-full lg:w-1/4">
        <div className="relative overflow-hidden rounded-md h-full">
          <Image
            src={image}
            alt={title}
            width={302}
            height={592}
            unoptimized
            className="w-full h-full object-cover rounded-md transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
        </div>
      </Link>
    </div>
  );
};

export default DualImageCard;
