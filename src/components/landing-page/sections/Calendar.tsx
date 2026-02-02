import React from "react";
import CollageImageCard from "../cards/CollageImageCard";
import { LandingSectionComplete } from "@/interfaces/landing-content";

interface CalendarProps {
  data?: LandingSectionComplete | null;
}

const Calendar = ({ data }: CalendarProps) => {
  const section = data?.section;
  const slides = data?.slides || [];
  const options = data?.options || [];

  const titulo = section?.titulo || "Calendarios";
  const subtitulo = section?.subtitulo || "Perfectas para enmarcar, regalar o conservar en álbumes.";
  const descripcion = section?.descripcion || "Nuestras photo prints transforman tus recuerdos digitales en piezas tangibles que perduran en el tiempo.";
  const colorSecundario = section?.colorSecundario || "#F5A524";

  // Get images from slides or use defaults
  const images = slides.filter(s => s.activo).map(s => s.imagenUrl);
  const collageImages: [string, string, string, string] = images.length >= 4
    ? [images[0], images[1], images[2], images[3]]
    : ["/slide3.jpg", "/slide3.jpg", "/slide3.jpg", "/slide3.jpg"];

  const optionsTextos = options.filter(o => o.activo).map(o => o.texto);

  return (
    <section id="calendars">
      <CollageImageCard
        title={titulo}
        subtitle={
          <p className="text-3xl font-light lg:pr-24">
            Perfectas para{" "}
            <span style={{ color: colorSecundario }}>
              {subtitulo.replace("Perfectas para ", "").replace(".", "")}
            </span>
            .
            <br />
            <br />
            <span className=" italic">
              {descripcion}
            </span>
          </p>
        }
        images={collageImages}
        options={optionsTextos.length > 0 ? optionsTextos : [
          "Pack 50 Prints 4x6",
          "Pack 50 Prints 4x6",
          "Pack 50 Prints 4x6",
        ]}
      />
    </section>
  );
};

export default Calendar;
