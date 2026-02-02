import React from "react";
import DualImageCard from "../cards/DualImageCard";
import { LandingSectionComplete } from "@/interfaces/landing-content";

interface PrintsProps {
  data?: LandingSectionComplete | null;
}

const Prints = ({ data }: PrintsProps) => {
  const section = data?.section;
  const options = data?.options || [];

  const titulo = section?.titulo || "Prints";
  const subtitulo = section?.subtitulo || "Perfectas para enmarcar, regalar o conservar en álbumes.";
  const descripcion = section?.descripcion || "Nuestras photo prints transforman tus recuerdos digitales en piezas tangibles que perduran en el tiempo.";
  const imagen = section?.imagenPrincipalUrl || "/slide1.jpg";
  const colorPrimario = section?.colorPrimario || "#E04F8B";

  const optionsTextos = options.filter(o => o.activo).map(o => o.texto);

  return (
    <section id="prints">
      <DualImageCard
        image={imagen}
        title={titulo}
        subtitle={
          <p className=" text-center text-2xl italic lg:px-12">
            {subtitulo} <br />{" "}
            <br />{" "}
            <span style={{ color: colorPrimario }}>
              {descripcion}
            </span>
          </p>
        }
        options={optionsTextos.length > 0 ? optionsTextos : [
          "Pack 50 Prints 4x6",
          "Pack 50 Prints 4x6",
          "Pack 50 Prints 4x6",
        ]}
      />
    </section>
  );
};

export default Prints;
