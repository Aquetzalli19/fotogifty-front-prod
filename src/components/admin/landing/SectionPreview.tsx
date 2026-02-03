"use client";

import { useState, useEffect } from "react";
import { LandingSectionDTO, LandingSlide, LandingOption, SectionKey, SECTION_METADATA, CarouselConfig } from "@/interfaces/landing-content";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SectionPreviewProps {
  sectionKey: SectionKey;
  values: LandingSectionDTO;
  slides: LandingSlide[];
  options: LandingOption[];
}

export function SectionPreview({
  sectionKey,
  values,
  slides,
  options,
}: SectionPreviewProps) {
  const metadata = SECTION_METADATA[sectionKey];

  // Render different previews based on section type
  switch (sectionKey) {
    case "hero":
      return <HeroPreview values={values} slides={slides} />;
    case "extensions":
      return <ExtensionsPreview values={values} options={options} />;
    case "product_slider":
      return <ProductSliderPreview values={values} slides={slides} />;
    case "legend":
      return <LegendPreview values={values} />;
    case "calendars":
      return <CalendarsPreview values={values} slides={slides} options={options} />;
    case "single_product":
      return <SingleProductPreview values={values} />;
    case "prints":
      return <PrintsPreview values={values} options={options} />;
    case "polaroids_banner":
      return <PolaroidsBannerPreview values={values} />;
    case "polaroids_single":
      return <PolaroidsSinglePreview values={values} />;
    case "polaroids_collage":
      return <PolaroidsCollagePreview values={values} slides={slides} options={options} />;
    case "platform_showcase":
      return <PlatformShowcasePreview values={values} />;
    default:
      return (
        <div className="p-8 text-center text-muted-foreground">
          Vista previa no disponible para esta sección
        </div>
      );
  }
}

// Hero Preview with Carousel
function HeroPreview({ values, slides }: { values: LandingSectionDTO; slides: LandingSlide[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const activeSlides = slides.filter((s) => s.activo);

  // Get carousel config from values
  const config = values.configuracionExtra as CarouselConfig | null;
  const autoplay = config?.autoplay ?? true;
  const autoplaySpeed = config?.autoplaySpeed ?? 5000;
  const transitionSpeed = config?.transitionSpeed ?? 500;

  // Auto-advance slides
  useEffect(() => {
    if (!autoplay || activeSlides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, autoplaySpeed);

    return () => clearInterval(interval);
  }, [autoplay, autoplaySpeed, activeSlides.length]);

  // Reset index if slides change
  useEffect(() => {
    if (currentIndex >= activeSlides.length) {
      setCurrentIndex(0);
    }
  }, [activeSlides.length, currentIndex]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  };

  return (
    <div className="relative h-64 w-full bg-gray-800 overflow-hidden rounded-lg">
      {/* Slides Container */}
      <div className="absolute inset-0">
        {activeSlides.map((slide, index) => (
          <div
            key={slide.id}
            className="absolute inset-0 transition-opacity"
            style={{
              opacity: index === currentIndex ? 1 : 0,
              transitionDuration: `${transitionSpeed}ms`,
            }}
          >
            <Image
              src={slide.imagenUrl}
              alt={slide.titulo || `Slide ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      {/* Overlay with content */}
      <div className="absolute inset-0 bg-gray-900/30 flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-white font-medium text-xl md:text-2xl leading-tight">
          {values.titulo || "Título del Hero"}
          <br />
          <span style={{ color: values.colorPrimario || "#E04F8B" }}>
            {values.subtitulo || "Subtítulo"}
          </span>
        </h1>
        <Button
          className="mt-4"
          style={{
            backgroundColor: values.botonColor || "#F5A524",
            color: "white",
          }}
        >
          {values.botonTexto || "Botón"}
        </Button>
      </div>

      {/* Navigation Arrows */}
      {activeSlides.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 transition-colors z-10"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 transition-colors z-10"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {activeSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? "bg-white" : "bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Ir a slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide info */}
      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-10">
        {activeSlides.length > 0 ? `${currentIndex + 1}/${activeSlides.length}` : "Sin slides"}
      </div>
    </div>
  );
}

// Extensions Preview
function ExtensionsPreview({ values, options }: { values: LandingSectionDTO; options: LandingOption[] }) {
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 bg-background rounded-lg">
      <div className="flex-1 space-y-4">
        <h2 className="text-2xl font-normal">{values.titulo || "Título"}</h2>
        <p style={{ color: values.colorPrimario || "#E04F8B" }} className="text-lg">
          {values.subtitulo || "Subtítulo"}
        </p>
        <Button style={{ backgroundColor: values.botonColor || "#E04F8B" }}>
          Ordenar
        </Button>
        {options.length > 0 && (
          <div className="text-sm">
            <p>Tamaños Disponibles:</p>
            <ul className="list-disc pl-5">
              {options.slice(0, 3).map((opt) => (
                <li key={opt.id}>{opt.texto}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="relative w-full md:w-1/2 h-40 rounded-lg overflow-hidden bg-muted">
        {values.imagenPrincipalUrl && (
          <Image
            src={values.imagenPrincipalUrl}
            alt="Extension"
            fill
            className="object-cover"
          />
        )}
      </div>
    </div>
  );
}

// Product Slider Preview
function ProductSliderPreview({ values, slides }: { values: LandingSectionDTO; slides: LandingSlide[] }) {
  return (
    <div className="space-y-4 p-4 bg-background rounded-lg">
      <p className="text-center text-lg">
        {values.textoPrimario && (
          <span style={{ color: values.colorPrimario || "#E04F8B" }} className="font-bold">
            {values.textoPrimario}
          </span>
        )}
        {values.textoSecundario}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {slides.slice(0, 4).map((slide) => (
          <div key={slide.id} className="flex-shrink-0 w-32">
            <div className="relative h-24 rounded overflow-hidden bg-muted">
              <Image src={slide.imagenUrl} alt={slide.titulo || ""} fill className="object-cover" />
            </div>
            <p className="text-xs font-medium mt-1 truncate">{slide.titulo}</p>
            <p className="text-xs text-muted-foreground truncate">{slide.descripcion}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Legend Preview
function LegendPreview({ values }: { values: LandingSectionDTO }) {
  const gradientStyle = values.colorGradienteInicio
    ? {
        background: `linear-gradient(to right, ${values.colorGradienteInicio}, ${values.colorGradienteMedio || "transparent"}, ${values.colorGradienteFin || "transparent"})`,
      }
    : { background: "linear-gradient(to right, rgba(252,211,77,0), rgba(56,189,248,0.5), rgba(236,72,153,0.5))" };

  return (
    <div className="relative h-40 w-full overflow-hidden rounded-lg">
      {values.imagenFondoUrl && (
        <Image
          src={values.imagenFondoUrl}
          alt="Legend background"
          fill
          className="object-cover"
        />
      )}
      <div className="absolute inset-0 flex items-center justify-center" style={gradientStyle}>
        <p className="text-white text-xl md:text-2xl font-medium text-center px-4">
          {values.textoPrimario || "Texto primario"}
          <br />
          {values.textoSecundario || "Texto secundario"}
        </p>
      </div>
    </div>
  );
}

// Calendars Preview
function CalendarsPreview({ values, slides, options }: { values: LandingSectionDTO; slides: LandingSlide[]; options: LandingOption[] }) {
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 bg-background rounded-lg">
      <div className="grid grid-cols-2 gap-2 w-full md:w-1/2">
        {slides.slice(0, 4).map((slide) => (
          <div key={slide.id} className="relative h-20 rounded overflow-hidden bg-muted">
            <Image src={slide.imagenUrl} alt="" fill className="object-cover" />
          </div>
        ))}
      </div>
      <div className="flex-1 space-y-2">
        <h2 className="text-xl font-normal" style={{ color: values.colorPrimario || "#E04F8B" }}>
          {values.titulo || "Título"}
        </h2>
        <p className="text-sm">
          {values.subtitulo && (
            <span style={{ color: values.colorSecundario || "#F5A524" }}>
              {values.subtitulo}
            </span>
          )}
        </p>
        <p className="text-sm italic text-muted-foreground">{values.descripcion}</p>
        {options.length > 0 && (
          <ul className="text-xs list-disc pl-4">
            {options.slice(0, 3).map((opt) => (
              <li key={opt.id}>{opt.texto}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Single Product Preview
function SingleProductPreview({ values }: { values: LandingSectionDTO }) {
  return (
    <div
      className="relative h-40 w-full flex flex-col items-center justify-center rounded-lg overflow-hidden"
      style={{
        backgroundImage: values.imagenFondoUrl ? `url(${values.imagenFondoUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: values.imagenFondoUrl ? undefined : "#374151",
      }}
    >
      <div className="absolute inset-0 bg-gray-900/20" />
      <div className="relative z-10 text-center">
        <h1 className="text-white text-xl font-medium">{values.titulo || "Título del producto"}</h1>
        <Button className="mt-3" style={{ backgroundColor: values.botonColor || "#E04F8B" }}>
          {values.botonTexto || "Ordenar"}
        </Button>
      </div>
    </div>
  );
}

// Prints Preview
function PrintsPreview({ values, options }: { values: LandingSectionDTO; options: LandingOption[] }) {
  return (
    <div className="flex gap-4 p-4 bg-background rounded-lg">
      <div className="relative w-24 h-32 rounded overflow-hidden bg-muted shrink-0">
        {values.imagenPrincipalUrl && (
          <Image src={values.imagenPrincipalUrl} alt="" fill className="object-cover" />
        )}
      </div>
      <div className="flex-1 space-y-2 text-center">
        <h2 className="text-xl">{values.titulo || "Título"}</h2>
        <p className="text-sm italic">{values.subtitulo}</p>
        <p className="text-sm" style={{ color: values.colorPrimario || "#E04F8B" }}>
          {values.descripcion}
        </p>
        {options.length > 0 && (
          <ul className="text-xs list-disc pl-4 text-left">
            {options.slice(0, 3).map((opt) => (
              <li key={opt.id}>{opt.texto}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="relative w-24 h-32 rounded overflow-hidden bg-muted shrink-0">
        {values.imagenPrincipalUrl && (
          <Image src={values.imagenPrincipalUrl} alt="" fill className="object-cover" />
        )}
      </div>
    </div>
  );
}

// Polaroids Banner Preview
function PolaroidsBannerPreview({ values }: { values: LandingSectionDTO }) {
  return (
    <div
      className="p-4 text-center rounded-lg"
      style={{ backgroundColor: values.colorPrimario || "#F5A524" }}
    >
      <p className="text-white text-lg">
        <span className="font-bold">{values.textoPrimario}</span>
        {values.textoSecundario}
      </p>
    </div>
  );
}

// Polaroids Single Preview
function PolaroidsSinglePreview({ values }: { values: LandingSectionDTO }) {
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 bg-background rounded-lg">
      <div className="flex-1 space-y-2">
        <h2 className="text-2xl">{values.titulo || "Título"}</h2>
        <p className="text-xl" style={{ color: values.colorPrimario || "#E04F8B" }}>
          <span className="text-sm italic text-muted-foreground">{values.subtitulo}</span>
          <br />
          {values.descripcion}
        </p>
        <Button style={{ backgroundColor: values.botonColor || "#47BEE5" }}>Ordenar</Button>
      </div>
      <div className="relative w-full md:w-1/2 h-40 rounded-lg overflow-hidden bg-muted">
        {values.imagenPrincipalUrl && (
          <Image src={values.imagenPrincipalUrl} alt="" fill className="object-cover" />
        )}
      </div>
    </div>
  );
}

// Polaroids Collage Preview
function PolaroidsCollagePreview({ values, slides, options }: { values: LandingSectionDTO; slides: LandingSlide[]; options: LandingOption[] }) {
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 bg-background rounded-lg">
      <div className="grid grid-cols-2 gap-2 w-full md:w-1/2">
        {slides.slice(0, 4).map((slide) => (
          <div key={slide.id} className="relative h-20 rounded overflow-hidden bg-muted">
            <Image src={slide.imagenUrl} alt="" fill className="object-cover" />
          </div>
        ))}
      </div>
      <div className="flex-1 space-y-2">
        <h2 className="text-xl" style={{ color: values.colorPrimario || "#E04F8B" }}>
          {values.titulo || "Título"}
        </h2>
        <p className="text-sm italic">{values.subtitulo}</p>
        <Button style={{ backgroundColor: values.botonColor || "#E04F8B" }}>Ordenar</Button>
        {options.length > 0 && (
          <ul className="text-xs list-disc pl-4">
            {options.slice(0, 3).map((opt) => (
              <li key={opt.id}>{opt.texto}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Platform Showcase Preview
function PlatformShowcasePreview({ values }: { values: LandingSectionDTO }) {
  const gradientStyle = values.colorGradienteInicio
    ? {
        background: `linear-gradient(to right, ${values.colorGradienteInicio}, ${values.colorGradienteMedio || "transparent"}, ${values.colorGradienteFin || "transparent"})`,
      }
    : { background: "linear-gradient(to right, rgba(8,145,178,0.7), rgba(252,211,77,0.7), rgba(236,72,153,0.7))" };

  return (
    <div className="space-y-0 rounded-lg overflow-hidden">
      <div className="p-3 text-center" style={{ backgroundColor: values.colorPrimario || "#E04F8B" }}>
        <p className="text-white text-lg font-medium">{values.textoPrimario}</p>
      </div>
      <div className="relative h-32" style={gradientStyle}>
        {values.imagenPrincipalUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src={values.imagenPrincipalUrl}
              alt="Platform"
              width={150}
              height={100}
              className="object-contain"
            />
          </div>
        )}
      </div>
      <div className="p-3 text-center bg-background">
        <p className="text-lg font-medium" style={{ color: values.colorPrimario || "#E04F8B" }}>
          {values.textoSecundario}
        </p>
      </div>
    </div>
  );
}
