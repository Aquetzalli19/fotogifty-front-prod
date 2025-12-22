import React from "react";
import SingleImageCard from "../cards/SingleImageCard";
import CollageImageCard from "../cards/CollageImageCard";

const Polaroids = () => {
  return (
    <section id="polaroids">
      <div className="w-full text-xl lg:text-3xl text-center pr-12 pl-12 p-2 mt-6 text-secondary-foreground bg-secondary">
        <p>
          Cada fotografía es impresa en{" "}
          <span className="font-bold">papel lustre profesional</span> , que
          realza los colores y los detalles con un{" "}
          <span className=" font-bold">acabado elegante y duradero</span>.
        </p>
      </div>
      <SingleImageCard
        title="Imprime tus recuerdos,"
        subtitle={
          <p className="text-6xl font-normal text-primary">
            <span className="text-zinc-800 dark:text-neutral-50 text-3xl font-extralight italic">
              Pack 50 fotos polaroid
            </span>
            <br />
            consérvalos para <br /> siempre.
          </p>
        }
        buttonColor="#47BEE5"
        image="/slide3.jpg"
      />
      <CollageImageCard
        title="Polaroid Prints"
        subtitle={
          <p className="text-3xl font-light lg:pr-24 w-full">
            <span className=" italic">
              Perfectas para decorar tus espacios, crear murales, álbumes
              creativos o regalar recuerdos con un estilo único y atemporal.
            </span>
          </p>
        }
        images={["/slide3.jpg", "/slide3.jpg", "/slide3.jpg", "/slide3.jpg"]}
        options={[
          "Pack 50 Prints 4x6",
          "Pack 50 Prints 4x6",
          "Pack 50 Prints 4x6",
        ]}
      />
    </section>
  );
};

export default Polaroids;
