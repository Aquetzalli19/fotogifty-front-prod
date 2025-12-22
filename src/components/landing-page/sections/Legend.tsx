"use client";

import React from "react";
import { useScroll, useTransform, motion } from "framer-motion";

import { useRef } from "react";
import Image from "next/image";

const Legend = () => {
  const container = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: container,

    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0vh", "50vh"]);

  return (
    <div
      ref={container}
      className=" w-full h-80 lg:h-150 overflow-hidden relative"
    >
      <div className=" bg-linear-50 from-amber-300/0 via-sky-400/50 via 25% to-pink-500/50 absolute top-0 h-80 lg:h-150 w-full z-10 text-primary-foreground text-4xl lg:text-8xl font-medium text-center content-center">
        <p>
          Imprime tus recuerdos <br /> ¡Regala sus mejores momentos!
        </p>
      </div>
      <motion.div style={{ y }} className="relative h-150">
        <Image
          src={"/slide3.jpg"}
          fill
          alt="image"
          style={{ objectFit: "cover" }}
          className=" bg-repeat"
        />
      </motion.div>
    </div>
  );
};

export default Legend;
