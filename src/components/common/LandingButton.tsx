import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";

interface landingButtonProps {
  text: string;
  color: string;
  href: string;
}

const LandingButton = ({ text, color, href }: landingButtonProps) => {
  return (
    <Link href={href}>
      <Button
        style={{ background: `${color}` }}
        className="font-medium rounded-2xl px-7 py-3 h-fit text-2xl min-w-20 w-fit hover:opacity-90 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        {text}
      </Button>
    </Link>
  );
};

export default LandingButton;
