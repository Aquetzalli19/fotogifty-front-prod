"use client";

import { productSlides } from "@/interfaces/product-slider";
import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface ProductSlidesProps {
  slides: productSlides[];
  href?: string;
  autoplaySpeed?: number;
  transitionSpeed?: number;
}

/**
 * Carrusel infinito:
 * - Clonar slides: [copia A, reales, copia B]
 * - Empezar en índice = slides.length (primer slide real)
 * - Al llegar al límite, saltar sin animación al equivalente del bloque real
 * - Breakpoints: móvil=1, md=2, lg=3 slides visibles
 */
const ProductSlides = ({
  slides,
  href = "/user",
  autoplaySpeed = 3,
  transitionSpeed = 0.5,
}: ProductSlidesProps) => {
  const n = slides.length;
  const cloned = [...slides, ...slides, ...slides];

  // Número de slides visibles según breakpoint (empieza en 1 para SSR)
  const [slidesToShow, setSlidesToShow] = useState(1);
  // Índice actual dentro del array clonado — empezamos en el bloque real (índice n)
  const [currentIndex, setCurrentIndex] = useState(n);
  // Flag para activar/desactivar la transición CSS
  const [transitioning, setTransitioning] = useState(true);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Detectar breakpoint en el cliente
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setSlidesToShow(w >= 1024 ? 3 : w >= 768 ? 2 : 1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Reiniciar el timer cada vez que el usuario interactúa
  const restartTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
    }, autoplaySpeed * 1000);
  }, [autoplaySpeed]);

  // Iniciar auto-avance
  useEffect(() => {
    restartTimer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [restartTimer]);

  // Al terminar la transición: detectar si llegamos al borde y saltar sin animación
  const handleTransitionEnd = useCallback(() => {
    if (currentIndex >= n * 2) {
      // Estamos en la copia B → saltar al bloque real equivalente
      setTransitioning(false);
      setCurrentIndex((prev) => prev - n);
    } else if (currentIndex < n) {
      // Estamos en la copia A → saltar al bloque real equivalente
      setTransitioning(false);
      setCurrentIndex((prev) => prev + n);
    }
  }, [currentIndex, n]);

  // Volver a habilitar transición dos frames después del salto (evita flash)
  useEffect(() => {
    if (!transitioning) {
      const raf1 = requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransitioning(true));
      });
      return () => cancelAnimationFrame(raf1);
    }
  }, [transitioning]);

  // Navegar a un slide real por índice
  const goTo = useCallback(
    (realIndex: number) => {
      setTransitioning(true);
      setCurrentIndex(n + realIndex);
      restartTimer();
    },
    [n, restartTimer]
  );

  // Índice real para los dots (0-based, dentro de slides originales)
  const realIndex = ((currentIndex - n) % n + n) % n;

  const slideWidthPct = 100 / slidesToShow;
  const translateX = currentIndex * slideWidthPct;

  return (
    <div className="w-full mt-10 select-none">
      {/* Pista del carrusel */}
      <div className="relative overflow-hidden px-2 sm:px-4">
        {/* Slides */}
        <div
          className="flex"
          style={{
            transform: `translateX(-${translateX}%)`,
            transition: transitioning ? `transform ${transitionSpeed * 1000}ms ease-out` : "none",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {cloned.map((el, index) => (
            <div
              key={index}
              className="shrink-0 px-2"
              style={{ width: `${slideWidthPct}%` }}
              aria-hidden={
                index < n || index >= n * 2 ? true : undefined
              }
            >
              <Link href={href} className="group block">
                <div className="flex flex-col items-center h-[420px] sm:h-[440px] lg:h-[460px] py-6 px-4 bg-neutral-300/10 dark:bg-neutral-300/20 rounded-xl shadow-[0px_4px_6.70px_2px_rgba(0,0,0,0.15)] text-center transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 cursor-pointer overflow-hidden">
                  {/* Imagen */}
                  <div className="relative overflow-hidden rounded-2xl shrink-0 w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64">
                    <Image
                      alt={el.title}
                      src={el.image}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  </div>

                  {/* Texto */}
                  <div className="mt-4 gap-2 flex flex-col items-center px-2">
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-medium text-primary group-hover:text-primary/80 transition-colors line-clamp-1">
                      {el.title}
                    </h3>
                    <p className="text-sm sm:text-base lg:text-xl text-neutral-700 dark:text-zinc-200 font-light line-clamp-2">
                      {el.description}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

      </div>

      {/* Dots de navegación */}
      <div className="flex justify-center items-center gap-2 mt-6">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            aria-label={`Ir a slide ${index + 1}`}
            aria-current={index === realIndex ? "true" : undefined}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === realIndex
                ? "bg-primary w-8"
                : "bg-neutral-400 dark:bg-neutral-600 w-2 hover:bg-neutral-500 dark:hover:bg-neutral-500"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductSlides;
