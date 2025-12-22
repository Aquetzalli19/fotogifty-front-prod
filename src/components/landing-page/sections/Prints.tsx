import React from "react";
import DualImageCard from "../cards/DualImageCard";

const Prints = () => {
  return (
    <section id="prints">
      <DualImageCard
        image="/slide1.jpg"
        title="Prints"
        subtitle={
          <p className=" text-center text-2xl italic lg:px-12">
            Perfectas para enmarcar, regalar o conservar en álbumes. <br />{" "}
            <br />{" "}
            <span className=" text-primary">
              Nuestras photo prints transforman tus recuerdos digitales en
              piezas tangibles que perduran en el tiempo.
            </span>
          </p>
        }
        options={[
          "Pack 50 Prints 4x6",
          "Pack 50 Prints 4x6",
          "Pack 50 Prints 4x6",
        ]}
      />
    </section>
  );
};

export default Prints;
