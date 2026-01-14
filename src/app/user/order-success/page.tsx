"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Package,
  Upload,
  ArrowRight,
} from "lucide-react";

import { verificarSesion, subirImagenesPedido, imageURLtoBlob, ItemPedidoCreado } from "@/services/checkout";
import { useCartStore } from "@/stores/cart-store";
import { useCartStepStore } from "@/stores/cart-step-store";
import {
  useCustomizationStore,
  CalendarCustomization,
  PolaroidCustomization,
  StandardCustomization,
  SavedStandardImage,
} from "@/stores/customization-store";

type PageStatus = "loading" | "uploading" | "success" | "error";

interface OrderDetails {
  id: number;
  estado: string;
  total: number;
  items_pedido?: ItemPedidoCreado[];
}

const MAX_RETRIES = 5;

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");

  const { items, clearCart } = useCartStore();
  const { resetStep } = useCartStepStore();
  const { customizations, clearAll: clearCustomizations } = useCustomizationStore();

  const [status, setStatus] = useState<PageStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  // Flag para prevenir ejecuciones duplicadas (React Strict Mode monta 2 veces)
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    // Prevenir ejecución duplicada
    if (hasExecutedRef.current) {
      console.log("⚠️ Ejecución duplicada prevenida (React Strict Mode)");
      return;
    }

    if (!sessionId) {
      setStatus("error");
      setError("No se encontró la sesión de pago");
      return;
    }

    // Marcar como ejecutado
    hasExecutedRef.current = true;
    verifyAndUpload();
  }, [sessionId]);

  const verifyAndUpload = async (currentRetry = 0) => {
    const RETRY_DELAY = 2000; // 2 segundos

    try {
      // 1. Verificar la sesión de pago
      setStatus("loading");
      setRetryCount(currentRetry);
      const response = await verificarSesion(sessionId!);

      if (!response.success || response.data?.status !== "complete") {
        setStatus("error");
        setError("El pago no se completó correctamente");
        return;
      }

      // Si el pedido aún no existe, puede ser que el webhook no haya terminado
      if (!response.data.pedido) {
        if (currentRetry < MAX_RETRIES) {
          console.log(`Pedido no encontrado, reintentando... (${currentRetry + 1}/${MAX_RETRIES})`);
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          return verifyAndUpload(currentRetry + 1);
        }
        setStatus("error");
        setError("El pedido está siendo procesado. Por favor revisa tu correo electrónico en unos minutos.");
        return;
      }

      setOrder(response.data.pedido);

      const itemsPedido = response.data.pedido.items_pedido || [];
      console.log("=== DEBUG: Respuesta del pedido ===");
      console.log("Pedido completo:", JSON.stringify(response.data.pedido, null, 2));
      console.log("Items del pedido:", JSON.stringify(itemsPedido, null, 2));
      console.log("Customizations guardadas:", customizations);

      // 2. Agrupar imágenes por item del pedido
      // Estructura: { itemPedidoId: { cartItemId, imageURLs[] } }
      interface ImageGroup {
        itemPedidoId: number;
        cartItemId: number;
        imageURLs: string[];
      }

      const imageGroups: ImageGroup[] = [];
      let totalImageCount = 0;

      // Para cada item del pedido, buscar las customizations correspondientes
      for (const itemPedido of itemsPedido) {
        // Verificar que el item tenga ID
        if (!itemPedido.id) {
          console.warn("Item del pedido sin ID:", itemPedido);
          continue;
        }

        // Buscar customizations que correspondan a este paquete
        const relatedCustomizations = customizations.filter(
          (c) => c.cartItemId === itemPedido.id_paquete
        );

        console.log(`Item ${itemPedido.id} (paquete ${itemPedido.id_paquete}): ${relatedCustomizations.length} customizations encontradas`);

        const imageURLs: string[] = [];

        for (const customization of relatedCustomizations) {
          if (customization.editorType === "standard") {
            const data = customization.data as StandardCustomization;

            console.log("🖼️ Generando imágenes renderizadas estándar...");

            if (data.images && Array.isArray(data.images)) {
              // IMPORTANTE: Deduplicar imágenes por ID para evitar subir duplicados
              const uniqueImages = data.images.filter((img, index, self) =>
                index === self.findIndex((t) => t.id === img.id)
              );

              console.log(`📊 Total de imágenes: ${data.images.length}, Únicas: ${uniqueImages.length}`);

              for (const img of uniqueImages) {
                try {
                  // Importar función de renderizado dinámicamente
                  const { renderStandardImage } = await import('@/lib/standard-render-utils');

                  // Generar imagen renderizada con todas las transformaciones
                  const renderedImage = await renderStandardImage(img);

                  if (renderedImage) {
                    imageURLs.push(renderedImage);
                    console.log(`✅ Imagen estándar ${img.id} renderizada`);
                  } else {
                    // Fallback: usar imagen original si falla el renderizado
                    console.warn(`⚠️ Fallo al renderizar imagen ${img.id}, usando original`);
                    imageURLs.push(img.imageSrc);
                  }
                } catch (error) {
                  console.error(`Error renderizando imagen ${img.id}:`, error);
                  // Fallback: usar imagen original
                  imageURLs.push(img.imageSrc);
                }
              }
            }
          } else if (customization.editorType === "calendar") {
            const data = customization.data as CalendarCustomization;

            console.log("📅 Generando imágenes renderizadas de calendario...");

            for (const month of data.months) {
              if (month.imageSrc) {
                // IMPORTANTE: Solo generar área recortada para impresión
                // (la versión con template solo se usa para preview en el editor)

                try {
                  // Importar dinámicamente la función de renderizado
                  const { renderCroppedPhoto } = await import('@/lib/calendar-render-utils');

                  // Área recortada (sin template) - PARA IMPRESIÓN
                  const croppedImage = await renderCroppedPhoto(month);
                  if (croppedImage) {
                    imageURLs.push(croppedImage);
                    console.log(`✂️ Área recortada generada para mes ${month.month}`);
                  }
                } catch (error) {
                  console.error(`Error generando imagen del mes ${month.month}:`, error);
                  // Fallback: subir imagen original si falla el renderizado
                  imageURLs.push(month.imageSrc);
                }
              }
            }
          } else if (customization.editorType === "polaroid") {
            const data = customization.data as PolaroidCustomization;

            console.log("📸 Generando imágenes renderizadas de polaroid...");

            for (const polaroid of data.polaroids) {
              // Detectar si es polaroid doble
              if (polaroid.isDouble && polaroid.imageSrc && polaroid.imageSrc2 && polaroid.transformations2) {
                // ===== POLAROID DOBLE (SOLO ÁREAS RECORTADAS) =====
                try {
                  const { renderDoublePolaroidCropped } = await import('@/lib/polaroid-render-utils');

                  // Generar solo las áreas de foto (sin marcos) para impresión
                  const renderedImage = await renderDoublePolaroidCropped({
                    imageSrc1: polaroid.imageSrc,
                    transformations1: polaroid.transformations,
                    imageSrc2: polaroid.imageSrc2,
                    transformations2: polaroid.transformations2,
                  });

                  if (renderedImage) {
                    imageURLs.push(renderedImage);
                    console.log(`✅ Áreas recortadas polaroid doble ${polaroid.id} renderizadas`);
                  } else {
                    // Fallback: usar imagen original si falla el renderizado
                    console.warn(`⚠️ Fallo al renderizar áreas recortadas polaroid doble ${polaroid.id}, usando original`);
                    imageURLs.push(polaroid.imageSrc);
                  }
                } catch (error) {
                  console.error(`Error renderizando áreas recortadas polaroid doble ${polaroid.id}:`, error);
                  // Fallback: usar imagen original
                  imageURLs.push(polaroid.imageSrc);
                }
              } else if (polaroid.imageSrc) {
                // ===== POLAROID SIMPLE (SOLO ÁREA RECORTADA) =====
                try {
                  const { renderPolaroidCropped } = await import('@/lib/polaroid-render-utils');

                  // Generar solo el área de foto (sin marco) para impresión
                  const renderedImage = await renderPolaroidCropped(polaroid);

                  if (renderedImage) {
                    imageURLs.push(renderedImage);
                    console.log(`✅ Área recortada polaroid ${polaroid.id} renderizada`);
                  } else {
                    // Fallback: usar imagen original si falla el renderizado
                    console.warn(`⚠️ Fallo al renderizar área recortada polaroid ${polaroid.id}, usando original`);
                    imageURLs.push(polaroid.imageSrc);
                  }
                } catch (error) {
                  console.error(`Error renderizando área recortada polaroid ${polaroid.id}:`, error);
                  // Fallback: usar imagen original
                  imageURLs.push(polaroid.imageSrc);
                }
              }
            }
          }
        }

        if (imageURLs.length > 0) {
          imageGroups.push({
            itemPedidoId: itemPedido.id,
            cartItemId: itemPedido.id_paquete,
            imageURLs,
          });
          totalImageCount += imageURLs.length;
        }
      }

      setTotalImages(totalImageCount);
      console.log(`Total de imágenes a subir: ${totalImageCount}`);

      // 3. Subir imágenes por cada item del pedido
      if (imageGroups.length > 0) {
        setStatus("uploading");
        let uploadedSoFar = 0;

        for (const group of imageGroups) {
          console.log(`Procesando item ${group.itemPedidoId}: ${group.imageURLs.length} imágenes`);

          // Convertir URLs a Blobs
          const blobs: Blob[] = [];
          for (const url of group.imageURLs) {
            try {
              console.log(`🔄 Convirtiendo imagen a blob (tamaño data URL: ${(url.length / 1024).toFixed(2)} KB)...`);
              const blob = await imageURLtoBlob(url);
              console.log(`✅ Blob creado: ${(blob.size / 1024 / 1024).toFixed(2)} MB, tipo: ${blob.type}`);
              blobs.push(blob);
            } catch (err) {
              console.error("❌ Error converting image:", err);
            }
          }

          if (blobs.length > 0) {
            try {
              // Subir en lotes de 3
              const batchSize = 3;
              for (let i = 0; i < blobs.length; i += batchSize) {
                const batch = blobs.slice(i, i + batchSize);
                console.log(`Subiendo lote para item ${group.itemPedidoId}: ${batch.length} imágenes`);

                await subirImagenesPedido(
                  response.data.pedido.id,
                  group.itemPedidoId,
                  batch
                );

                uploadedSoFar += batch.length;
                setUploadedCount(uploadedSoFar);
                setUploadProgress(Math.round((uploadedSoFar / totalImageCount) * 100));
              }
            } catch (uploadErr) {
              console.error(`Error subiendo imágenes del item ${group.itemPedidoId}:`, uploadErr);
              throw new Error(`Error al subir imágenes: ${uploadErr instanceof Error ? uploadErr.message : 'Error desconocido'}`);
            }
          }
        }
      } else if (customizations.length > 0) {
        console.warn("Hay customizations pero no se pudieron asociar a items del pedido");
      }

      // 5. Limpiar el carrito, personalizaciones y resetear el paso
      clearCart();
      clearCustomizations();
      resetStep(); // Volver al paso 1 del carrito

      setStatus("success");
    } catch (err) {
      console.error("Error en el proceso:", err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Error al procesar el pedido");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background w-full h-22 py-1 px-2 border-b">
        <Link href="/user/" className="w-56 h-20 inline-block">
          <Image src="/navBarLogo.png" alt="FotoGifty" width={220} height={80} />
        </Link>
      </header>

      <div className="container max-w-2xl mx-auto py-12 px-4">
        {/* Estado: Cargando */}
        {status === "loading" && (
          <Card className="p-8">
            <CardContent className="flex flex-col items-center justify-center gap-6">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">
                  {retryCount > 0 ? "Procesando tu pedido..." : "Verificando tu pago..."}
                </h1>
                <p className="text-muted-foreground">
                  {retryCount > 0
                    ? `Confirmando con el servidor (${retryCount}/${MAX_RETRIES})...`
                    : "Por favor espera mientras confirmamos tu transacción"}
                </p>
              </div>
              {retryCount > 0 && (
                <Progress value={(retryCount / MAX_RETRIES) * 100} className="w-full h-2" />
              )}
            </CardContent>
          </Card>
        )}

        {/* Estado: Subiendo imágenes */}
        {status === "uploading" && (
          <Card className="p-8">
            <CardContent className="flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <Upload className="h-16 w-16 text-primary" />
                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  {uploadedCount}
                </div>
              </div>
              <div className="text-center w-full">
                <h1 className="text-2xl font-bold mb-2">Subiendo tus imágenes...</h1>
                <p className="text-muted-foreground mb-4">
                  {uploadedCount} de {totalImages} imágenes subidas
                </p>
                <Progress value={uploadProgress} className="w-full h-3" />
                <p className="text-sm text-muted-foreground mt-2">
                  No cierres esta ventana
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estado: Éxito */}
        {status === "success" && order && (
          <Card className="p-8">
            <CardContent className="flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
                </div>
              </div>

              <div className="text-center">
                <h1 className="text-3xl font-bold text-green-600 mb-2">
                  ¡Pago Exitoso!
                </h1>
                <p className="text-muted-foreground text-lg">
                  Tu pedido ha sido procesado correctamente
                </p>
              </div>

              <div className="bg-muted rounded-lg p-6 w-full">
                <div className="flex items-center gap-4 mb-4">
                  <Package className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold">Pedido #{order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      Estado: {order.estado}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total pagado:</span>
                    <span className="text-xl font-bold font-poppins">
                      $ {order.total.toFixed(2)} MXN
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
                <p className="text-sm text-blue-800 text-center">
                  Recibirás un correo electrónico con los detalles de tu pedido y
                  el seguimiento del envío.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/user/backlog")}
                >
                  Ver mis pedidos
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => router.push("/user")}
                >
                  Seguir comprando
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estado: Error */}
        {status === "error" && (
          <Card className="p-8">
            <CardContent className="flex flex-col items-center justify-center gap-6">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-16 w-16 text-red-600" />
              </div>

              <div className="text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-2">
                  Hubo un problema
                </h1>
                <p className="text-muted-foreground">
                  {error || "No pudimos procesar tu pedido"}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/user/cart")}
                >
                  Volver al carrito
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => verifyAndUpload()}
                >
                  Reintentar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
