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
    <div className="w-full max-w-full flex flex-col-reverse lg:flex-row px-4 sm:px-8 lg:px-16 py-10 lg:py-15 justify-center items-center gap-8 lg:gap-12 overflow-hidden box-border">
      <Link href={href} className="group w-full sm:w-auto flex justify-center">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4 content-center items-center max-w-[280px] sm:max-w-[340px] lg:max-w-[480px] xl:max-w-[550px]">
          {images.map((el, index) => {
            return (
              <div key={index} className="relative overflow-hidden rounded-xl aspect-square">
                <Image
                  alt={`${title} - imagen ${index + 1}`}
                  src={el}
                  width={345}
                  height={345}
                  unoptimized
                  className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 rounded-xl" />
              </div>
            );
          })}
        </div>
      </Link>
      <div className="flex flex-col w-full lg:flex-1 gap-6 lg:gap-8 justify-center items-center lg:items-start px-2 sm:px-4 lg:px-0 max-w-full overflow-hidden">
        <div className="flex flex-col gap-3 lg:gap-6 text-center lg:text-left w-full">
          <h1 className="font-normal text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-primary break-words">
            {title}
          </h1>
          <div className="text-base sm:text-lg lg:text-xl xl:text-2xl font-light break-words">
            {subtitle}
          </div>
        </div>
        <LandingButton text="Ver productos" href={href} color={buttonColor} />

        {options && (
          <div className="text-base sm:text-lg lg:text-xl xl:text-2xl font-extralight text-center lg:text-left w-full">
            <p>Tamaños Disponibles:</p>

            <ul className="list-disc pl-5 lg:pl-8">
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
