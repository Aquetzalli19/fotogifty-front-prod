import React from "react";

interface StepperProps {
  steps: number;
  currentStep: number;
  title: string;
}

const Stepper = ({ steps, currentStep, title }: StepperProps) => {
  return (
    <div className=" flex h-fit flex-col gap-3 justify-center items-center py-4 select-none">
      <h3 className=" text-xl">{title}</h3>

      <div className=" flex flex-row">
        {Array.from({ length: steps }).map((_, index) => (
          <div
            key={index}
            className="  flex flex-row group justify-center content-center h-6 items-center"
          >
            <div className="w-3 h-0.5 bg-neutral-950 group-first:hidden flex"></div>

            <div
              className={`border border-neutral-950 w-6 h-6 text-lg justify-center text-center flex items-center ${
                index + 1 == currentStep ? "bg-neutral-950 text-zinc-50" : ""
              }`}
            >
              {index + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stepper;
