"use client";

import React, { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface UserNavBarButtonProps {
  href: string;
  icon: ReactNode;
  title: string;
}

const UserNavBarButton = ({ href, icon, title }: UserNavBarButtonProps) => {
  const pathname = usePathname();
  const buttonVariant = pathname === href ? "outline" : "ghost";

  return (
    <Link href={href} className="w-full">
      <Button
        variant={buttonVariant}
        className="w-full flex flex-row justify-start items-center gap-2 text-lg font-regular py-6"
      >
        {icon}
        <p>{title}</p>
      </Button>
    </Link>
  );
};

export default UserNavBarButton;
