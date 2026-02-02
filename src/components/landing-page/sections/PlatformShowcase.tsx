import Image from "next/image";
import React from "react";
import { LandingSectionComplete } from "@/interfaces/landing-content";

interface PlatformShowcaseProps {
  data?: LandingSectionComplete | null;
}

const PlatformShowcase = ({ data }: PlatformShowcaseProps) => {
  const section = data?.section;

  const textoPrimario = section?.textoPrimario || "Edita, envía y recibe tu pedido.";
  const textoSecundario = section?.textoSecundario || "Todo desde la comodidad de tu casa.";
  const imagen = section?.imagenPrincipalUrl || "/MainUser.png";
  const colorPrimario = section?.colorPrimario || "#E04F8B";

  // Build gradient from CMS colors or use defaults
  const gradienteInicio = section?.colorGradienteInicio || "rgba(8, 145, 178, 0.7)";
  const gradienteMedio = section?.colorGradienteMedio || "rgba(252, 211, 77, 0.7)";
  const gradienteFin = section?.colorGradienteFin || "rgba(236, 72, 153, 0.7)";

  const gradientStyle = {
    background: `linear-gradient(to right, ${gradienteInicio}, ${gradienteMedio}, ${gradienteFin})`,
  };

  return (
    <section>
      <div className="py-7" style={{ backgroundColor: colorPrimario }}>
        <p className=" text-4xl lg:text-6xl text-center text-neutral-50 font-medium">
          {textoPrimario}
        </p>
      </div>
      <div
        className="lg:h-screen w-full bg-center"
        style={{ backgroundImage: `url(${imagen})` }}
      >
        <div
          className="flex flex-row w-full h-full content-center justify-center"
          style={gradientStyle}
        >
          <Image
            alt=""
            src={imagen}
            width={910}
            height={708}
            className=" object-cover"
          />
        </div>
      </div>
      <div className="py-7">
        <p className="text-4xl lg:text-6xl text-center font-medium" style={{ color: colorPrimario }}>
          {textoSecundario}
        </p>
      </div>
    </section>
  );
};

export default PlatformShowcase;
