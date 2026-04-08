"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { obtenerTodosPaquetes, agruparPaquetesPorCategoria } from "@/services/packages";
import { ShopItem, ProductSections } from "@/interfaces/product-card";
import { useCartStore } from "@/stores/cart-store";
import { obtenerTodoContenidoProductPage } from "@/services/product-page-content";
import { obtenerContenidoMergedPaquete } from "@/services/paquete-page-content";
import { ProductPageContent } from "@/interfaces/product-page-content";

import ProductHero, { ProductHeroSkeleton } from "@/components/product-detail/ProductHero";
import ProductImageGallery from "@/components/product-detail/ProductImageGallery";
import WhyChooseSection from "@/components/product-detail/WhyChooseSection";
import PaperTypesSection from "@/components/product-detail/PaperTypesSection";
import PrintServicesSection from "@/components/product-detail/PrintServicesSection";
import ProductTypesShowcase from "@/components/product-detail/ProductTypesShowcase";
import SizesAndOptionsTable from "@/components/product-detail/SizesAndOptionsTable";
import RelatedProductsSection from "@/components/product-detail/RelatedProductsSection";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ShopItem | null>(null);
  const [categoryName, setCategoryName] = useState<string>("");
  const [allProducts, setAllProducts] = useState<ProductSections[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [pageContent, setPageContent] = useState<ProductPageContent | null>(null);

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const response = await obtenerTodosPaquetes();

        if (response.success && response.data) {
          const grouped = agruparPaquetesPorCategoria(response.data);
          setAllProducts(grouped);

          for (const section of grouped) {
            const found = section.packages.find((p) => p.id === productId);
            if (found) {
              setProduct(found);
              setCategoryName(section.productName);
              break;
            }
          }
        }
      } catch (error) {
        console.error("Error loading product:", error);
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  // Load CMS content: try per-product merged first, then fall back to global
  useEffect(() => {
    async function loadPageContent() {
      if (!productId || isNaN(productId)) return;
      try {
        const mergedRes = await obtenerContenidoMergedPaquete(productId);
        if (mergedRes.success && mergedRes.data) {
          setPageContent(mergedRes.data);
          return;
        }
      } catch {
        // Fall through to global
      }
      try {
        const globalRes = await obtenerTodoContenidoProductPage();
        if (globalRes.success && globalRes.data) {
          setPageContent(globalRes.data);
        }
      } catch {
        // Silently fail — components fall back to static defaults
      }
    }
    loadPageContent();
  }, [productId]);

  const relatedProducts = useMemo(() => {
    if (!categoryName || !product) return [];
    const section = allProducts.find((s) => s.productName === categoryName);
    if (!section) return [];
    return section.packages.filter((p) => p.id !== product.id).slice(0, 4);
  }, [allProducts, categoryName, product]);

  const otherProducts = useMemo(() => {
    if (!categoryName) return [];
    return allProducts
      .filter((s) => s.productName !== categoryName)
      .flatMap((s) =>
        s.packages.map((p) => ({ ...p, categoryName: s.productName }))
      )
      .slice(0, 4);
  }, [allProducts, categoryName]);

  const handleAddToCart = () => {
    if (product && categoryName) {
      for (let i = 0; i < quantity; i++) {
        addItem(categoryName, product);
      }
      router.push("/user/cart");
    }
  };

  const handleBuyNow = () => {
    if (product && categoryName) {
      for (let i = 0; i < quantity; i++) {
        addItem(categoryName, product);
      }
      router.push("/user/cart");
    }
  };

  if (loading) {
    return <ProductHeroSkeleton />;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Package className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Producto no encontrado</h1>
        <p className="text-muted-foreground">
          El producto que buscas no existe o ha sido eliminado.
        </p>
        <Button onClick={() => router.push("/user")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al catálogo
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <ProductHero
        product={product}
        categoryName={categoryName}
        quantity={quantity}
        onQuantityChange={setQuantity}
        onBuyNow={handleBuyNow}
        onAddToCart={handleAddToCart}
      />

      {(!pageContent?.gallery || pageContent.gallery.section.activo) && (
        <ProductImageGallery data={pageContent?.gallery} />
      )}
      {(!pageContent?.why_choose || pageContent.why_choose.section.activo) && (
        <WhyChooseSection data={pageContent?.why_choose} />
      )}
      {(!pageContent?.paper_types || pageContent.paper_types.section.activo) && (
        <PaperTypesSection data={pageContent?.paper_types} />
      )}
      {(!pageContent?.print_services || pageContent.print_services.section.activo) && (
        <PrintServicesSection data={pageContent?.print_services} />
      )}
      {(!pageContent?.product_types || pageContent.product_types.section.activo) && (
        <ProductTypesShowcase data={pageContent?.product_types} />
      )}
      {(!pageContent?.sizes_table || pageContent.sizes_table.section.activo) && (
        <SizesAndOptionsTable data={pageContent?.sizes_table} />
      )}

      <RelatedProductsSection
        relatedProducts={relatedProducts}
        otherProducts={otherProducts}
        categoryName={categoryName}
      />
    </div>
  );
}
