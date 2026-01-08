import LandingButton from "@/components/common/LandingButton";
import Image from "next/image";
import React, { JSX } from "react";

interface DualImageCardProps {
  title: string;
  subtitle: JSX.Element;
  options?: string[];
  image: string;
}

const DualImageCard = ({
  title,
  subtitle,
  options,
  image,
}: DualImageCardProps) => {
  return (
    <div className="flex w-full gap-4 lg:gap-0 flex-col lg:flex-row lg:h-190 px-10 py-4">
      <Image
        src={image}
        alt=""
        width={302}
        height={592}
        className=" w-full lg:w-1/4 object-cover rounded-md"
      />
      <div className="flex flex-col w-full lg:w-2/4 justify-center items-center gap-10 lg:px-14">
        <h1 className=" font-normal text-7xl justify-start">{title}</h1>
        {subtitle}

        {options && (
          <div className="text-2xl font-extralight justify-start">
            <p>Tamaños Disponibles:</p>

            <ul className=" list-disc pl-10">
              {options.map((el, index) => {
                return <li key={index}>{el}</li>;
              })}
            </ul>
          </div>
        )}

        <LandingButton text="Ordenar" color="#E04F8B" href="/login" />
      </div>
      <Image
        src={image}
        alt=""
        width={302}
        height={592}
        className=" w-full lg:w-1/4 object-cover rounded-md"
      />
    </div>
  );
};

export default DualImageCard;
