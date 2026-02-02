import LandingButton from "@/components/common/LandingButton";
import Image from "next/image";
import Link from "next/link";
import React, { JSX } from "react";

interface CollageImageCardProps {
  title: string;
  subtitle: JSX.Element;
  options?: string[];
  images: [string, string, string, string];
  buttonColor?: string;
  href?: string;
}

const CollageImageCard = ({
  title,
  subtitle,
  options,
  images,
  buttonColor = "#E04F8B",
  href = "/user",
}: CollageImageCardProps) => {
  return (
    <div className="w-full flex flex-col-reverse lg:flex-row lg:px-22 py-15 justify-center gap-12">
      <Link href={href} className="group">
        <div className="grid grid-cols-2 grid-rows-2 gap-4 content-center items-center px-10 lg:p-4 w-full lg:w-400">
          {images.map((el, index) => {
            return (
              <div key={index} className="relative overflow-hidden rounded-xl">
                <Image
                  alt={`${title} - imagen ${index + 1}`}
                  src={el}
                  width={345}
                  height={345}
                  className="h-40 w-40 lg:h-80 lg:w-80 object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 rounded-xl" />
              </div>
            );
          })}
        </div>
      </Link>
      <div className="flex flex-col w-full gap-10 justify-center items-center px-10 lg:px-0">
        <div className="flex flex-col gap-8 text-center lg:text-left w-full">
          <h1 className="font-normal text-6xl justify-start text-primary">
            {title}
          </h1>
          {subtitle}
        </div>
        <LandingButton text="Ver productos" href={href} color={buttonColor} />

        {options && (
          <div className="text-3xl font-extralight text-center lg:text-left justify-start w-full">
            <p>Tamaños Disponibles:</p>

            <ul className="list-disc pl-10">
              {options.map((el, index) => {
                return <li key={index}>{el}</li>;
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollageImageCard;
