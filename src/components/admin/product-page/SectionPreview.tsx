"use client";

import {
  ProductPageSectionComplete,
  ProductPageSectionKey,
} from "@/interfaces/product-page-content";
import ProductImageGallery from "@/components/product-detail/ProductImageGallery";
import WhyChooseSection from "@/components/product-detail/WhyChooseSection";
import PaperTypesSection from "@/components/product-detail/PaperTypesSection";
import PrintServicesSection from "@/components/product-detail/PrintServicesSection";
import ProductTypesShowcase from "@/components/product-detail/ProductTypesShowcase";
import SizesAndOptionsTable from "@/components/product-detail/SizesAndOptionsTable";

interface SectionPreviewProps {
  sectionKey: ProductPageSectionKey;
  data: ProductPageSectionComplete | null;
}

/**
 * Renders a live preview of a single product-page section using the exact
 * same components that the public product detail page uses. The `data` prop
 * is the buffered editor state, so changes show up as the user types.
 */
export function SectionPreview({ sectionKey, data }: SectionPreviewProps) {
  switch (sectionKey) {
    case "gallery":
      return <ProductImageGallery data={data} />;
    case "why_choose":
      return <WhyChooseSection data={data} />;
    case "paper_types":
      return <PaperTypesSection data={data} />;
    case "print_services":
      return <PrintServicesSection data={data} />;
    case "product_types":
      return <ProductTypesShowcase data={data} />;
    case "sizes_table":
      return <SizesAndOptionsTable data={data} />;
    default:
      return null;
  }
}
