import Image from "next/image";
import React from "react";

const PlatformShowcase = () => {
  return (
    <section>
      <div className=" bg-primary py-7">
        <p className=" text-4xl lg:text-6xl text-center text-neutral-50 font-medium">
          Edita, envía y recibe tu pedido.{" "}
        </p>
      </div>
      <div className="bg-[url(/MainUser.png)] lg:h-screen w-full bg-center">
        <div className=" flex flex-row bg-gradient-to-r from-cyan-600/70 via-amber-300/70 to-pink-500/70 w-full h-full content-center justify-center">
          <Image
            alt=""
            src={"/MainUser.png"}
            width={910}
            height={708}
            className=" object-cover"
          />
        </div>
      </div>
      <div className="py-7">
        <p className=" text-4xl lg:text-6xl text-center text-primary font-medium">
          Todo desde la comodidad de tu casa.
        </p>
      </div>
    </section>
  );
};

export default PlatformShowcase;
