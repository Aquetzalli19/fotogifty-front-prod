"use client";

import { ModeToggle } from "@/components/modeToggle";
import { navbarLinks } from "@/interfaces/navbar";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";

interface navBarProps {
  sections: navbarLinks[];
}

const NavBar = ({ sections }: navBarProps) => {
  const [opened, setOpened] = useState(false);

  // Cerrar menú cuando cambia el tamaño de pantalla a desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setOpened(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevenir scroll cuando el menú está abierto
  useEffect(() => {
    if (opened) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [opened]);

  const closeMenu = () => setOpened(false);

  return (
    <nav className="bg-background w-full z-50 sticky top-0 transition-all">
      {/* Header - siempre visible */}
      <div className="w-full flex flex-row justify-between items-center px-4 lg:px-6 h-16 lg:h-20 relative z-50 bg-background">
        <Link
          href={"/"}
          className="h-12 lg:h-14 w-auto"
          scroll={false}
        >
          <Image
            src={"/navBarLogo.png"}
            alt="logo"
            width={2200}
            height={573}
            className="h-full w-auto object-contain"
          />
        </Link>

        {/* Desktop navigation */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="flex flex-row text-foreground font-light text-base">
            {sections.map((el, index) => (
              <Link
                href={el.href}
                key={index}
                className="px-4 py-2 rounded-lg hover:bg-gray-200/70 dark:hover:bg-gray-200/20 transition-colors"
              >
                {el.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-row gap-3 text-primary-foreground text-sm font-medium ml-4">
            <Link
              className="bg-primary rounded-lg px-4 py-2 hover:bg-primary/80 transition-colors"
              href={"/login"}
            >
              Inicia sesión
            </Link>
            <Link
              className="bg-secondary rounded-lg px-4 py-2 hover:bg-secondary/80 transition-colors"
              href={"/signup"}
            >
              Regístrate
            </Link>
          </div>

          <ModeToggle />
        </div>

        {/* Mobile menu button */}
        <div className="flex flex-row gap-3 lg:hidden items-center">
          <ModeToggle />
          <button
            onClick={() => setOpened(!opened)}
            className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
            aria-label={opened ? "Cerrar menú" : "Abrir menú"}
          >
            {opened ? (
              <X width={24} height={24} strokeWidth={1.5} />
            ) : (
              <Menu width={24} height={24} strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {opened && (
        <div
          className="fixed inset-0 top-16 bg-black/50 z-40 lg:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Mobile menu panel */}
      <div
        className={`fixed top-16 left-0 right-0 bg-background z-40 lg:hidden transform transition-transform duration-300 ease-in-out ${
          opened ? "translate-y-0" : "-translate-y-full pointer-events-none"
        }`}
      >
        <div className="flex flex-col p-4 border-t border-border">
          {/* Navigation links */}
          <div className="flex flex-col">
            {sections.map((el, index) => (
              <Link
                href={el.href}
                key={index}
                onClick={closeMenu}
                className="py-3 px-4 text-foreground font-light text-lg rounded-lg hover:bg-gray-200/70 dark:hover:bg-gray-200/20 transition-colors"
              >
                {el.label}
              </Link>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border">
            <Link
              className="bg-primary text-primary-foreground text-center rounded-lg py-3 px-4 font-medium hover:bg-primary/80 transition-colors"
              href={"/login"}
              onClick={closeMenu}
            >
              Inicia sesión
            </Link>
            <Link
              className="bg-secondary text-secondary-foreground text-center rounded-lg py-3 px-4 font-medium hover:bg-secondary/80 transition-colors"
              href={"/signup"}
              onClick={closeMenu}
            >
              Regístrate
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
