import React from "react";
import SingleImageCard from "../cards/SingleImageCard";
import CollageImageCard from "../cards/CollageImageCard";
import { LandingSectionComplete } from "@/interfaces/landing-content";

interface PolaroidsProps {
  bannerData?: LandingSectionComplete | null;
  singleData?: LandingSectionComplete | null;
  collageData?: LandingSectionComplete | null;
}

const Polaroids = ({ bannerData, singleData, collageData }: PolaroidsProps) => {
  // Banner section data
  const bannerSection = bannerData?.section;
  const bannerDescripcion = bannerSection?.descripcion || "Cada fotografía es impresa en";
  const bannerTextoPrimario = bannerSection?.textoPrimario || "papel lustre profesional";
  const bannerTextoSecundario = bannerSection?.textoSecundario || ", que realza los colores y los detalles con un acabado elegante y duradero.";
  const bannerColor = bannerSection?.colorPrimario || "#F5A524";

  // Single section data
  const singleSection = singleData?.section;
  const singleTitulo = singleSection?.titulo || "Imprime tus recuerdos,";
  const singleSubtitulo = singleSection?.subtitulo || "Pack 50 fotos polaroid";
  const singleDescripcion = singleSection?.descripcion || "consérvalos para siempre.";
  const singleImagen = singleSection?.imagenPrincipalUrl || "/slide3.jpg";
  const singleBotonColor = singleSection?.botonColor || "#47BEE5";

  // Collage section data
  const collageSection = collageData?.section;
  const collageSlides = collageData?.slides || [];
  const collageOptions = collageData?.options || [];
  const collageTitulo = collageSection?.titulo || "Polaroid Prints";
  const collageSubtitulo = collageSection?.subtitulo || "Perfectas para decorar tus espacios, crear murales, álbumes creativos o regalar recuerdos con un estilo único y atemporal.";

  // Get images from slides or use defaults
  const collageImages = collageSlides.filter(s => s.activo).map(s => s.imagenUrl);
  const collageImagesTuple: [string, string, string, string] = collageImages.length >= 4
    ? [collageImages[0], collageImages[1], collageImages[2], collageImages[3]]
    : ["/slide3.jpg", "/slide3.jpg", "/slide3.jpg", "/slide3.jpg"];

  const collageOptionsTextos = collageOptions.filter(o => o.activo).map(o => o.texto);

  return (
    <section id="polaroids">
      {/* Banner */}
      {bannerData?.section.activo !== false && (
        <div
          className="w-full text-xl lg:text-3xl text-center pr-12 pl-12 p-2 mt-6 text-secondary-foreground"
          style={{ backgroundColor: bannerColor }}
        >
          <p className="text-white">
            {bannerDescripcion}{" "}
            <span className="font-bold">{bannerTextoPrimario}</span>
            {bannerTextoSecundario.startsWith(",") ? bannerTextoSecundario : ` ${bannerTextoSecundario}`}
          </p>
        </div>
      )}

      {/* Single Image Card */}
      {singleData?.section.activo !== false && (
        <SingleImageCard
          title={singleTitulo}
          subtitle={
            <p className="font-normal text-primary">
              <span className="text-muted-foreground font-extralight italic text-sm sm:text-base lg:text-lg">
                {singleSubtitulo}
              </span>
              <br />
              <span className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl">
                {singleDescripcion}
              </span>
            </p>
          }
          buttonColor={singleBotonColor}
          image={singleImagen}
        />
      )}

      {/* Collage */}
      {collageData?.section.activo !== false && (
        <CollageImageCard
          title={collageTitulo}
          subtitle={
            <p className="font-light w-full">
              <span className="italic">
                {collageSubtitulo}
              </span>
            </p>
          }
          images={collageImagesTuple}
          options={collageOptionsTextos.length > 0 ? collageOptionsTextos : [
            "Pack 50 Prints 4x6",
            "Pack 50 Prints 4x6",
            "Pack 50 Prints 4x6",
          ]}
        />
      )}
    </section>
  );
};

export default Polaroids;
