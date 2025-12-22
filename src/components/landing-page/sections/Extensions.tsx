import React from "react";
import SingleImageCard from "../cards/SingleImageCard";

const Extensions = () => {
  return (
    <section id="extensions">
      {" "}
      <SingleImageCard
        title="Ampliaciones"
        subtitle={
          <p className="text-4xl font-normal text-primary">
            Perfectas para enmarcar, regalar o conservar en álbumes.
          </p>
        }
        buttonColor="#E04F8B"
        image="/slide3.jpg"
        options={[
          "Pack 50 Prints 4x6",
          "Pack 50 Prints 4x6",
          "Pack 50 Prints 4x6",
        ]}
      />
    </section>
  );
};

export default Extensions;
