"use client";

import Hero from "@/components/landing-page/sections/Hero";
import Legend from "@/components/landing-page/sections/Legend";
import ProductSlider from "@/components/landing-page/sections/ProductSlider";
import React, { useEffect, useState } from "react";
import Lenis from "lenis";
import SingleProductImage from "@/components/landing-page/SingleProductImage";
import Extensions from "@/components/landing-page/sections/Extensions";
import Polaroids from "@/components/landing-page/sections/Polaroids";
import Prints from "@/components/landing-page/sections/Prints";
import Calendar from "@/components/landing-page/sections/Calendar";
import PlatformShowcase from "@/components/landing-page/sections/PlatformShowcase";
import StoreLocationMap from "@/components/landing-page/StoreLocationMap";
import { obtenerTodoContenidoLanding } from "@/services/landing-content";
import { LandingContent } from "@/interfaces/landing-content";
import { DEFAULT_LANDING_CONTENT } from "@/lib/landing-defaults";

const Page = () => {
  const [content, setContent] = useState<LandingContent>(DEFAULT_LANDING_CONTENT);
  const [isLoading, setIsLoading] = useState(true);

  // Load CMS content
  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await obtenerTodoContenidoLanding();
        if (response.success && response.data) {
          setContent(response.data);
        }
      } catch (error) {
        console.error("Error loading landing content:", error);
        // Keep using default content on error
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, []);

  // Setup Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis();

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
  }, []);

  // Extract section data with fallbacks
  const heroData = content.hero || DEFAULT_LANDING_CONTENT.hero;
  const extensionsData = content.extensions || DEFAULT_LANDING_CONTENT.extensions;
  const productSliderData = content.product_slider || DEFAULT_LANDING_CONTENT.product_slider;
  const legendData = content.legend || DEFAULT_LANDING_CONTENT.legend;
  const calendarsData = content.calendars || DEFAULT_LANDING_CONTENT.calendars;
  const singleProductData = content.single_product || DEFAULT_LANDING_CONTENT.single_product;
  const printsData = content.prints || DEFAULT_LANDING_CONTENT.prints;
  const polaroidsBannerData = content.polaroids_banner || DEFAULT_LANDING_CONTENT.polaroids_banner;
  const polaroidsSingleData = content.polaroids_single || DEFAULT_LANDING_CONTENT.polaroids_single;
  const polaroidsCollageData = content.polaroids_collage || DEFAULT_LANDING_CONTENT.polaroids_collage;
  const platformShowcaseData = content.platform_showcase || DEFAULT_LANDING_CONTENT.platform_showcase;

  // Get hero slides
  const heroSlides = heroData?.slides.map(s => s.imagenUrl) || ["/slide1.jpg", "/slide2.jpg", "/slide3.jpg", "/slide4.jpg"];

  return (
    <div className="w-full">
      {/* Hero Section */}
      {heroData?.section.activo && (
        <Hero
          slides={heroSlides}
          data={heroData}
        />
      )}

      {/* Extensions Section */}
      {extensionsData?.section.activo && (
        <Extensions data={extensionsData} />
      )}

      {/* Product Slider Section */}
      {productSliderData?.section.activo && (
        <ProductSlider data={productSliderData} />
      )}

      {/* Legend Section */}
      {legendData?.section.activo && (
        <Legend data={legendData} />
      )}

      {/* Calendar Section */}
      {calendarsData?.section.activo && (
        <Calendar data={calendarsData} />
      )}

      {/* Single Product Section */}
      {singleProductData?.section.activo && (
        <SingleProductImage
          image={singleProductData.section.imagenFondoUrl || "./SingleProduct.jpg"}
          title={singleProductData.section.titulo || "Pack de 100 fotografías tamaño 4x6"}
          data={singleProductData}
        />
      )}

      {/* Prints Section */}
      {printsData?.section.activo && (
        <Prints data={printsData} />
      )}

      {/* Polaroids Section */}
      {(polaroidsBannerData?.section.activo || polaroidsSingleData?.section.activo || polaroidsCollageData?.section.activo) && (
        <Polaroids
          bannerData={polaroidsBannerData}
          singleData={polaroidsSingleData}
          collageData={polaroidsCollageData}
        />
      )}

      {/* Platform Showcase Section */}
      {platformShowcaseData?.section.activo && (
        <PlatformShowcase data={platformShowcaseData} />
      )}

      {/* Store Location - Always visible (managed separately) */}
      <StoreLocationMap />
    </div>
  );
};

export default Page;
