import React from "react";
import CollageImageCard from "../cards/CollageImageCard";

const Calendar = () => {
  return (
    <section id="calendars">
      <CollageImageCard
        title="Calendarios"
        subtitle={
          <p className="text-3xl font-light lg:pr-24">
            Perfectas para{" "}
            <span className=" text-secondary">
              enmarcar, regalar o conservar en álbumes
            </span>
            .
            <br />
            <br />
            <span className=" italic">
              Nuestras photo prints transforman tus recuerdos digitales en
              piezas tangibles que perduran en el tiempo.
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

export default Calendar;
