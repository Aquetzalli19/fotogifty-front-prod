import LandingButton from "@/components/common/LandingButton";
import Image from "next/image";
import React, { JSX } from "react";

interface CollageImageCardProps {
  title: string;
  subtitle: JSX.Element;
  options?: string[];
  images: [string, string, string, string];
}

const CollageImageCard = ({
  title,
  subtitle,
  options,
  images,
}: CollageImageCardProps) => {
  return (
    <div className=" w-full flex flex-col-reverse lg:flex-row lg:px-22 py-15 justify-center gap-12">
      <div className="grid grid-cols-2 grid-rows-2 gap-4 content-center items-center px-10 lg:p-4 w-full lg:w-400">
        {images.map((el, index) => {
          return (
            <Image
              key={index}
              alt=""
              src={el}
              width={345}
              height={345}
              className=" h-40 w-40 lg:h-80 lg:w-80 object-cover rounded-xl"
            />
          );
        })}
      </div>
      <div className=" flex flex-col w-full gap-10 justify-center items-center px-10 lg:px-0">
        <div className=" flex flex-col gap-8 text-center lg:text-left w-full">
          <h1 className=" font-normal text-6xl justify-start text-primary">
            {title}
          </h1>
          {subtitle}
        </div>
        <LandingButton text="Ordenar" href="#" color="#E04F8B" />

        {options && (
          <div className="text-3xl font-extralight text-center lg:text-left justify-start w-full">
            <p>Tamaños Disponibles:</p>

            <ul className=" list-disc pl-10">
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
