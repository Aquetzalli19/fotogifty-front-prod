import LandingButton from "@/components/common/LandingButton";
import Image from "next/image";
import React, { JSX } from "react";

interface SingleImageCardProps {
  title: string;
  subtitle: JSX.Element;
  options?: string[];
  image: string;
  buttonColor: string;
}

const SingleImageCard = ({
  title,
  subtitle,
  options,
  image,
  buttonColor,
}: SingleImageCardProps) => {
  return (
    <div className=" w-full flex flex-col lg:flex-row p-4 lg:px-38 lg:py-15 justify-center gap-12">
      <div className=" flex flex-col w-fit min-w-1/2 gap-10 justify-center">
        <div className=" flex flex-col">
          <h1 className=" font-normal text-6xl justify-start">{title}</h1>
          {subtitle}
        </div>
        <LandingButton text="Ordenar" href="/login" color={buttonColor} />

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
      </div>
      <div>
        <Image
          alt=""
          src={image}
          width={593}
          height={508}
          className=" lg:h-120 h-auto w-fill lg:max-w-150 lg:w-auto object-cover rounded-xl"
        />
      </div>
    </div>
  );
};

export default SingleImageCard;
