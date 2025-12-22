import React from "react";
import LandingButton from "../common/LandingButton";

interface singleProductImageProps {
  image: string;
  title: string;
}

const SingleProductImage = ({ image, title }: singleProductImageProps) => {
  return (
    <section
      style={{ backgroundImage: `url(${image})`, backgroundPosition: "center" }}
      className=" bg-cover flex flex-col w-full h-80 lg:h-180 justify-center items-center"
    >
      <div className="flex flex-col bg-gray-900/20 w-full h-full justify-center items-center content-center gap-5">
        <h1 className=" text-shadow-lg text-neutral-50 text-4xl lg:text-6xl lg:w-180 text-center">
          {title}
        </h1>
        <LandingButton text="Ordenar" color="#E04F8B" href="#" />
      </div>
    </section>
  );
};

export default SingleProductImage;
