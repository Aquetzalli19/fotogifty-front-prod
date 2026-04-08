"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShoppingCart,
  Camera,
  Ruler,
  Layers,
  Calendar,
  Image as ImageIcon,
  Sparkles,
  Check,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ShopItem } from "@/interfaces/product-card";
import { EditorType } from "@/lib/category-utils";
import { FEATURED_SIZES } from "./product-detail-data";

/**
 * Returns a formatted dimensions string. The backend may store photoWidth/photoHeight
 * either in pixels (e.g. 1181 for a 10cm print at 300 DPI) or already in centimeters
 * (e.g. 10). When the pixel→cm conversion rounds to zero we assume the stored values
 * are already in cm and display them directly.
 */
function formatDimensions(
  width: number,
  height: number,
  dpi: number
): { main: string; sub: string | null } {
  const cmWidth = (width / dpi) * 2.54;
  const cmHeight = (height / dpi) * 2.54;

  // Values that round to 0.0 cm are clearly not valid pixel counts —
  // treat the stored values as centimeters instead.
  if (cmWidth < 0.1 || cmHeight < 0.1) {
    return {
      main: `${width.toFixed(1)} cm × ${height.toFixed(1)} cm`,
      sub: null,
    };
  }

  return {
    main: `${cmWidth.toFixed(1)} cm × ${cmHeight.toFixed(1)} cm`,
    sub: `${width} × ${height} px`,
  };
}

function getEditorTypeInfo(editorType?: EditorType) {
  switch (editorType) {
    case "calendar":
      return {
        label: "Calendario",
        icon: Calendar,
        color: "bg-blue-500",
        description: "Editor de calendario con 12 meses personalizables",
      };
    case "polaroid":
      return {
        label: "Polaroid",
        icon: Sparkles,
        color: "bg-pink-500",
        description: "Estilo polaroid con marco blanco clásico",
      };
    default:
      return {
        label: "Estándar",
        icon: ImageIcon,
        color: "bg-primary",
        description: "Editor de fotos con ajustes completos",
      };
  }
}

function SpecCard({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="bg-card rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-semibold">{value}</p>
          {subValue && (
            <p className="text-xs text-muted-foreground">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductHeroSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-32 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-6">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-14 flex-1" />
              <Skeleton className="h-14 flex-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProductHeroProps {
  product: ShopItem;
  categoryName: string;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onBuyNow: () => void;
  onAddToCart: () => void;
}

export default function ProductHero({
  product,
  categoryName,
  quantity,
  onQuantityChange,
  onBuyNow,
  onAddToCart,
}: ProductHeroProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  const editorInfo = getEditorTypeInfo(product.editorType);
  const EditorIcon = editorInfo.icon;
  const hasPhotoSpecs = product.photoWidth > 0 && product.photoHeight > 0 && product.photoResolution > 0;
  const dimensions = hasPhotoSpecs
    ? formatDimensions(product.photoWidth, product.photoHeight, product.photoResolution)
    : null;

  return (
    <section>
      {/* Breadcrumb */}
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/user" className="hover:text-primary transition-colors">
              Catálogo
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/user" className="hover:text-primary transition-colors">
              {categoryName}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 hover:bg-primary/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="sticky top-24">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-2xl">
                {!imageError ? (
                  <Image
                    src={product.itemImage}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-24 w-24 text-muted-foreground/50" />
                  </div>
                )}

                <div className="absolute top-4 left-4">
                  <Badge
                    className={`${editorInfo.color} text-white px-3 py-1.5 text-sm font-medium shadow-lg`}
                  >
                    <EditorIcon className="h-4 w-4 mr-1.5" />
                    {editorInfo.label}
                  </Badge>
                </div>

                <div className="absolute bottom-4 right-4">
                  <Badge
                    variant="secondary"
                    className="bg-black/70 text-white px-3 py-1.5 backdrop-blur-sm"
                  >
                    <Camera className="h-4 w-4 mr-1.5" />
                    {product.numOfRequiredImages} foto
                    {product.numOfRequiredImages > 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>

              {/* Thumbnails decorativos */}
              <div className="hidden lg:grid grid-cols-4 gap-3 mt-4">
                {["/slide1.jpg", "/slide2.jpg", "/slide3.jpg", "/slide4.jpg"].map((src, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-lg overflow-hidden bg-muted border-2 border-transparent hover:border-primary transition-colors cursor-pointer"
                  >
                    <Image
                      src={src}
                      alt={`Vista ${i + 1}`}
                      fill
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>

            </div>
          </motion.div>

          {/* Product Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <Badge variant="outline" className="text-sm">
              {categoryName}
            </Badge>

            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-primary">
                ${product.itemPrice.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">
                IVA incluido
              </span>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              {product.itemDescription}
            </p>

            <Separator />

            {/* Sizes list */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">
                Tamaños disponibles
              </h3>
              <div className="grid gap-2">
                {FEATURED_SIZES.map((size) => (
                  <div key={size} className="flex items-center gap-2">
                    <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {size}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Specs grid */}
            <div className="grid grid-cols-2 gap-3">
              <SpecCard
                icon={Camera}
                label="Fotos requeridas"
                value={`${product.numOfRequiredImages} foto${product.numOfRequiredImages > 1 ? "s" : ""}`}
              />
              {hasPhotoSpecs && (
                <SpecCard
                  icon={Layers}
                  label="Resolución"
                  value={`${product.photoResolution} DPI`}
                  subValue="Calidad profesional"
                />
              )}
              {dimensions && (
                <SpecCard
                  icon={Ruler}
                  label="Dimensiones"
                  value={dimensions.main}
                  subValue={dimensions.sub ?? undefined}
                />
              )}
              <SpecCard
                icon={EditorIcon}
                label="Tipo de editor"
                value={editorInfo.label}
                subValue={editorInfo.description}
              />
            </div>

            <Separator />

            {/* Quantity selector */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Cantidad:</span>
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="h-10 w-10 rounded-r-none"
                >
                  -
                </Button>
                <span className="w-12 text-center font-medium">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onQuantityChange(quantity + 1)}
                  className="h-10 w-10 rounded-l-none"
                >
                  +
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">
                Total:{" "}
                <span className="font-semibold text-foreground">
                  ${(product.itemPrice * quantity).toFixed(2)}
                </span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                size="lg"
                className="flex-1 h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                onClick={onBuyNow}
              >
                <Zap className="mr-2 h-5 w-5" />
                Crear Tus Impresiones
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 h-14 text-lg font-semibold"
                onClick={onAddToCart}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Añadir al carrito
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 pt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Check className="h-4 w-4 text-green-500" />
                Pago seguro
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-4 w-4 text-green-500" />
                Envío rápido
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-4 w-4 text-green-500" />
                Garantía de calidad
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
