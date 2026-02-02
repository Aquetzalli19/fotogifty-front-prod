"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShoppingCart,
  Zap,
  Camera,
  Ruler,
  Layers,
  Calendar,
  Image as ImageIcon,
  Sparkles,
  Check,
  ChevronRight,
  Star,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { obtenerTodosPaquetes, agruparPaquetesPorCategoria } from "@/services/packages";
import { ShopItem, ProductSections } from "@/interfaces/product-card";
import { useCartStore } from "@/stores/cart-store";
import { EditorType } from "@/lib/category-utils";

// Helper to calculate physical dimensions from pixels and DPI
function calculatePhysicalSize(pixels: number, dpi: number): string {
  const inches = pixels / dpi;
  const cm = inches * 2.54;
  return `${cm.toFixed(1)} cm`;
}

// Helper to get editor type display info
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

// Product Detail Skeleton
function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Back button skeleton */}
        <Skeleton className="h-10 w-32 mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image skeleton */}
          <Skeleton className="aspect-square rounded-2xl" />

          {/* Info skeleton */}
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

// Related Product Card
function RelatedProductCard({
  product,
  categoryName,
}: {
  product: ShopItem;
  categoryName: string;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <Link href={`/user/product/${product.id}`}>
      <Card className="group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <div className="relative aspect-square bg-muted overflow-hidden">
          {!imageError ? (
            <Image
              src={product.itemImage}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">{categoryName}</p>
          <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h4>
          <p className="text-lg font-bold text-primary mt-1">
            ${product.itemPrice.toFixed(2)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

// Spec Card Component
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow"
    >
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
    </motion.div>
  );
}

// Feature List Item
function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
      </div>
      <span className="text-sm text-muted-foreground">{children}</span>
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ShopItem | null>(null);
  const [categoryName, setCategoryName] = useState<string>("");
  const [allProducts, setAllProducts] = useState<ProductSections[]>([]);
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const addItem = useCartStore((state) => state.addItem);

  // Load product data
  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const response = await obtenerTodosPaquetes();

        if (response.success && response.data) {
          const grouped = agruparPaquetesPorCategoria(response.data);
          setAllProducts(grouped);

          // Find the specific product
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

  // Get related products (same category, excluding current)
  const relatedProducts = useMemo(() => {
    if (!categoryName || !product) return [];
    const section = allProducts.find((s) => s.productName === categoryName);
    if (!section) return [];
    return section.packages.filter((p) => p.id !== product.id).slice(0, 4);
  }, [allProducts, categoryName, product]);

  // Get other categories products
  const otherProducts = useMemo(() => {
    if (!categoryName) return [];
    return allProducts
      .filter((s) => s.productName !== categoryName)
      .flatMap((s) => s.packages.map((p) => ({ ...p, categoryName: s.productName })))
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
    return <ProductDetailSkeleton />;
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

  const editorInfo = getEditorTypeInfo(product.editorType);
  const EditorIcon = editorInfo.icon;

  const physicalWidth = calculatePhysicalSize(product.photoWidth, product.photoResolution);
  const physicalHeight = calculatePhysicalSize(product.photoHeight, product.photoResolution);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
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
              {/* Main Image */}
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

                {/* Editor Type Badge */}
                <div className="absolute top-4 left-4">
                  <Badge
                    className={`${editorInfo.color} text-white px-3 py-1.5 text-sm font-medium shadow-lg`}
                  >
                    <EditorIcon className="h-4 w-4 mr-1.5" />
                    {editorInfo.label}
                  </Badge>
                </div>

                {/* Photo count badge */}
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

              {/* Mini specs below image (desktop) */}
              <div className="hidden lg:flex justify-center gap-8 mt-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  <span>{physicalWidth} × {physicalHeight}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  <span>{product.photoResolution} DPI</span>
                </div>
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
            {/* Category Badge */}
            <Badge variant="outline" className="text-sm">
              {categoryName}
            </Badge>

            {/* Product Name */}
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-primary">
                ${product.itemPrice.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">
                IVA incluido
              </span>
            </div>

            {/* Rating placeholder (for visual appeal) */}
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= 4
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">(4.0)</span>
            </div>

            <Separator />

            {/* Tabs for Description and Specs */}
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="description">Descripción</TabsTrigger>
                <TabsTrigger value="specs">Especificaciones</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-4 space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  {product.itemDescription}
                </p>

                <div className="space-y-2 pt-4">
                  <h4 className="font-semibold text-sm">Características:</h4>
                  <div className="grid gap-2">
                    <FeatureItem>Impresión de alta calidad</FeatureItem>
                    <FeatureItem>
                      Editor {editorInfo.label.toLowerCase()} incluido
                    </FeatureItem>
                    <FeatureItem>Resolución profesional de {product.photoResolution} DPI</FeatureItem>
                    <FeatureItem>Personaliza {product.numOfRequiredImages} foto{product.numOfRequiredImages > 1 ? "s" : ""}</FeatureItem>
                    <FeatureItem>Envío a todo México</FeatureItem>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="specs" className="mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <SpecCard
                    icon={Camera}
                    label="Fotos requeridas"
                    value={`${product.numOfRequiredImages} foto${product.numOfRequiredImages > 1 ? "s" : ""}`}
                  />
                  <SpecCard
                    icon={Layers}
                    label="Resolución"
                    value={`${product.photoResolution} DPI`}
                    subValue="Calidad profesional"
                  />
                  <SpecCard
                    icon={Ruler}
                    label="Dimensiones"
                    value={`${physicalWidth} × ${physicalHeight}`}
                    subValue={`${product.photoWidth} × ${product.photoHeight} px`}
                  />
                  <SpecCard
                    icon={EditorIcon}
                    label="Tipo de editor"
                    value={editorInfo.label}
                    subValue={editorInfo.description}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            {/* Quantity selector */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Cantidad:</span>
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="h-10 w-10 rounded-r-none"
                >
                  -
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-10 w-10 rounded-l-none"
                >
                  +
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">
                Total: <span className="font-semibold text-foreground">${(product.itemPrice * quantity).toFixed(2)}</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                size="lg"
                className="flex-1 h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                onClick={handleBuyNow}
              >
                <Zap className="mr-2 h-5 w-5" />
                Comprar ahora
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 h-14 text-lg font-semibold"
                onClick={handleAddToCart}
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

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                Más en {categoryName}
              </h2>
              <Link
                href="/user"
                className="text-sm text-primary hover:underline flex items-center"
              >
                Ver todos
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((relatedProduct) => (
                <RelatedProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  categoryName={categoryName}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* Other Products Section */}
        {otherProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">También te puede interesar</h2>
              <Link
                href="/user"
                className="text-sm text-primary hover:underline flex items-center"
              >
                Ver catálogo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {otherProducts.map((otherProduct) => (
                <RelatedProductCard
                  key={otherProduct.id}
                  product={otherProduct}
                  categoryName={otherProduct.categoryName}
                />
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
