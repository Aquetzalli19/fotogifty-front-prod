"use client";

import React from "react";
import { useScroll, useTransform, motion } from "framer-motion";

import { useRef } from "react";
import Image from "next/image";
import { LandingSectionComplete } from "@/interfaces/landing-content";

interface LegendProps {
  data?: LandingSectionComplete | null;
}

const Legend = ({ data }: LegendProps) => {
  const container = useRef<HTMLDivElement>(null);
  const section = data?.section;

  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0vh", "50vh"]);

  const textoPrimario = section?.textoPrimario || "Imprime tus recuerdos";
  const textoSecundario = section?.textoSecundario || "¡Regala sus mejores momentos!";
  const imagenFondo = section?.imagenFondoUrl || "/slide3.jpg";

  // Build gradient from CMS colors or use defaults
  const gradienteInicio = section?.colorGradienteInicio || "rgba(251, 191, 36, 0)";
  const gradienteMedio = section?.colorGradienteMedio || "rgba(56, 189, 248, 0.5)";
  const gradienteFin = section?.colorGradienteFin || "rgba(236, 72, 153, 0.5)";

  const gradientStyle = {
    background: `linear-gradient(50deg, ${gradienteInicio}, ${gradienteMedio} 25%, ${gradienteFin})`,
  };

  return (
    <div
      ref={container}
      className=" w-full h-80 lg:h-150 overflow-hidden relative"
    >
      <div
        className="absolute top-0 h-80 lg:h-150 w-full z-10 text-primary-foreground text-4xl lg:text-8xl font-medium text-center content-center"
        style={gradientStyle}
      >
        <p>
          {textoPrimario} <br /> {textoSecundario}
        </p>
      </div>
      <motion.div style={{ y }} className="relative h-150">
        <Image
          src={imagenFondo}
          fill
          alt="image"
          unoptimized
          style={{ objectFit: "cover" }}
          className=" bg-repeat"
        />
      </motion.div>
    </div>
  );
};

export default Legend;
