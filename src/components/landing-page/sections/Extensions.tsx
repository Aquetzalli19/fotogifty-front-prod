import React from "react";
import SingleImageCard from "../cards/SingleImageCard";
import { LandingSectionComplete } from "@/interfaces/landing-content";

interface ExtensionsProps {
  data?: LandingSectionComplete | null;
}

const Extensions = ({ data }: ExtensionsProps) => {
  const section = data?.section;
  const options = data?.options || [];

  const titulo = section?.titulo || "Ampliaciones";
  const subtitulo = section?.subtitulo || "Perfectas para enmarcar, regalar o conservar en álbumes.";
  const imagen = section?.imagenPrincipalUrl || "/slide3.jpg";
  const botonColor = section?.botonColor || "#E04F8B";
  const optionsTextos = options.filter(o => o.activo).map(o => o.texto);

  return (
    <section id="extensions">
      <SingleImageCard
        title={titulo}
        subtitle={
          <p className="text-4xl font-normal text-primary">
            {subtitulo}
          </p>
        }
        buttonColor={botonColor}
        image={imagen}
        options={optionsTextos.length > 0 ? optionsTextos : [
          "Pack 50 Prints 4x6",
          "Pack 50 Prints 4x6",
          "Pack 50 Prints 4x6",
        ]}
      />
    </section>
  );
};

export default Extensions;
