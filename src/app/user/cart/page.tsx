"use client";

import React, { useState, useEffect } from "react";
import Stepper from "@/components/user/stepper/Stepper";
import Image from "next/image";
import Link from "next/link";

import { ShopItem, ProductSections } from "@/interfaces/product-card";
import { CartItem as CartItemType } from "@/interfaces/cart-item";
import { Address } from "@/types/Address";
import { useCartStore } from "@/stores/cart-store";
import { useCartStepStore } from "@/stores/cart-step-store";
import { useAuthStore } from "@/stores/auth-store";
import {
  useCustomizationStore,
  CalendarCustomization,
  PolaroidCustomization,
  StandardCustomization
} from "@/stores/customization-store";
import CartItemComponent from "@/components/user/stepper/CartItem";
import ProductRecommendations from "@/components/user/cart/ProductRecommendations";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Plus, CheckCircle2, Edit, AlertCircle, ImageIcon, Calendar, Grid3X3, MapPin, Loader2, CreditCard, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { obtenerTodosPaquetes, agruparPaquetesPorCategoria } from "@/services/packages";
import { addressService } from "@/services/addressService";
import { crearSesionCheckout, CheckoutItem } from "@/services/checkout";
import { config } from "@/lib/config";

const CartPage = () => {
  const router = useRouter();
  const { currentStep, setCurrentStep } = useCartStepStore();
  const { user, isAuthenticated } = useAuthStore();

  const [isClient, setIsClient] = useState(false);
  const [products, setProducts] = useState<ProductSections[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [hasOrphanItems, setHasOrphanItems] = useState(false);

  // Estados para direcciones y checkout
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Estado para método de entrega
  const [deliveryMethod, setDeliveryMethod] = useState<'envio_domicilio' | 'recogida_tienda'>('envio_domicilio');

  const { items, getTotals, clearCart, removeItem } = useCartStore();
  const { getCustomization, getInstanceProgress, clearAll: clearCustomizations, removeAllForCartItem } = useCustomizationStore();

  // Función para limpiar todo (carrito + personalizaciones)
  const handleClearAll = () => {
    clearCart();
    clearCustomizations();
    window.location.reload();
  };

  // Verificar si todas las personalizaciones están completas para avanzar al paso 3
  const areAllCustomizationsComplete = (): boolean => {
    if (isLoadingProducts || items.length === 0) return false;

    for (const cartItem of items) {
      const itemDetails = findShopItemById(cartItem.id);
      if (!itemDetails) continue;

      const requiredImages = itemDetails.numOfRequiredImages;

      // Verificar cada instancia del item
      for (let i = 0; i < cartItem.quantity; i++) {
        const { current } = getInstanceProgress(cartItem.id, i);
        if (current < requiredImages) {
          return false;
        }
      }
    }
    return true;
  };

  // Marcar que estamos en el cliente después del montaje
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Cargar productos de la API
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const response = await obtenerTodosPaquetes();
        if (response.success && response.data) {
          const productSections = agruparPaquetesPorCategoria(response.data);
          setProducts(productSections);
        }
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  // Detectar items huérfanos (items en el carrito que ya no existen en la API)
  useEffect(() => {
    if (!isLoadingProducts && products.length > 0 && items.length > 0) {
      const orphanItemsExist = items.some((item) => {
        const itemDetails = findShopItemById(item.id);
        return itemDetails === null;
      });
      setHasOrphanItems(orphanItemsExist);
    } else {
      setHasOrphanItems(false);
    }
  }, [isLoadingProducts, products, items]);

  // Cargar direcciones cuando entramos al paso 3
  useEffect(() => {
    const loadAddresses = async () => {
      if (currentStep === 3 && isAuthenticated && user?.id) {
        setIsLoadingAddresses(true);
        try {
          const userAddresses = await addressService.getAll(user.id);
          setAddresses(userAddresses);
          // Seleccionar la dirección predeterminada si existe
          const defaultAddress = userAddresses.find((addr) => addr.predeterminada);
          if (defaultAddress?.id) {
            setSelectedAddressId(defaultAddress.id);
          } else if (userAddresses.length > 0 && userAddresses[0].id) {
            setSelectedAddressId(userAddresses[0].id);
          }
        } catch (error) {
          console.error("Error loading addresses:", error);
        } finally {
          setIsLoadingAddresses(false);
        }
      }
    };

    loadAddresses();
  }, [currentStep, isAuthenticated, user?.id]);

  // Función para buscar un producto por ID en los productos cargados
  const findShopItemById = (itemId: number): ShopItem | null => {
    for (const productSection of products) {
      const foundPackage = productSection.packages.find(
        (pkg) => pkg.id === itemId
      );
      if (foundPackage) {
        return foundPackage;
      }
    }
    return null;
  };

  // Función para limpiar items huérfanos
  const cleanOrphanItems = () => {
    items.forEach((item) => {
      const itemDetails = findShopItemById(item.id);
      if (!itemDetails) {
        removeItem(item.id);
        removeAllForCartItem(item.id); // También limpiar sus personalizaciones
      }
    });
    setHasOrphanItems(false);
  };

  const expandedItems = items.flatMap((cartItem) => {
    const itemDetails = findShopItemById(cartItem.id);
    if (!itemDetails) return [];

    return Array(cartItem.quantity)
      .fill(null)
      .map(() => ({
        ...cartItem,
        ...itemDetails,
      }));
  });

  const { subtotal, iva, total } = getTotals();

  const onAddImage = (
    cartItem: CartItemType,
    itemDetails: ShopItem,
    instanceIndex: number
  ) => {
    // Usar el editorType del cartItem si está disponible, sino extraer de nombre
    const category = cartItem.productCategory || itemDetails.name.split(" ")[0];
    const width = itemDetails.photoWidth;
    const height = itemDetails.photoHeight;
    const resolution = itemDetails.photoResolution;
    const quantity = itemDetails.numOfRequiredImages;

    // Asegurar que cuando regrese del editor, vuelva al paso 2
    setCurrentStep(2);

    router.push(
      `/user/editor?category=${encodeURIComponent(category)}&width=${width}&height=${height}&resolution=${resolution}&quantity=${quantity}&cartItemId=${cartItem.id}&instanceIndex=${instanceIndex}`
    );
  };

  // Función para procesar el checkout
  const handleCheckout = async () => {
    if (!isAuthenticated || !user) {
      setCheckoutError("Debes iniciar sesión para continuar");
      return;
    }

    // Validar dirección solo si es envío a domicilio
    if (deliveryMethod === 'envio_domicilio' && !selectedAddressId) {
      setCheckoutError("Selecciona una dirección de envío");
      return;
    }

    setIsProcessingCheckout(true);
    setCheckoutError(null);

    try {
      // Preparar los items para el checkout
      const checkoutItems: CheckoutItem[] = items.map((cartItem) => {
        const itemDetails = findShopItemById(cartItem.id);
        return {
          id_paquete: cartItem.id,
          nombre_paquete: itemDetails?.name || "Producto",
          categoria_paquete: cartItem.productCategory || "",
          precio_unitario: itemDetails?.itemPrice || 0,
          cantidad: cartItem.quantity,
          num_fotos_requeridas: (itemDetails?.numOfRequiredImages || 1) * cartItem.quantity,
        };
      });

      const response = await crearSesionCheckout({
        id_usuario: user.id,
        id_direccion: deliveryMethod === 'envio_domicilio' ? (selectedAddressId ?? undefined) : undefined,
        metodo_entrega: deliveryMethod,
        nombre_cliente: user.nombre || user.email,
        email_cliente: user.email,
        telefono_cliente: user.telefono,
        items: checkoutItems,
        subtotal,
        iva,
        total,
        success_url: `${window.location.origin}/user/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/user/cart`,
      });

      if (response.success && response.data?.url) {
        // Redirigir a Stripe Checkout
        window.location.href = response.data.url;
      } else {
        setCheckoutError("Error al crear la sesión de pago");
      }
    } catch (error) {
      console.error("Error en checkout:", error);
      setCheckoutError(error instanceof Error ? error.message : "Error al procesar el pago");
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  // Obtener la dirección seleccionada
  const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId);

  return (
    <div className=" space-y-4">
      <header className=" bg-background w-full h-22 py-1 px-2">
        <Link href={"/user/"} className=" w-56 h-20 inline-block">
          <Image src={"/navBarLogo.png"} alt="" width={220} height={80} />
        </Link>
      </header>

      {/* Advertencia de items huérfanos */}
      {hasOrphanItems && (
        <div className="w-full bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">
                Tu carrito contiene productos que ya no están disponibles.
              </p>
            </div>
            <Button
              onClick={cleanOrphanItems}
              variant="outline"
              size="sm"
              className="bg-white"
            >
              Limpiar carrito
            </Button>
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div className=" w-full items-center flex flex-col justify-center md:gap-8 md:px-12 px-2 gap-4">
          <Stepper currentStep={1} steps={4} title="Mi Carrito" />
          {/* cards de los productos */}
          <div className="flex flex-col gap-4 items-center w-full">
            {isLoadingProducts ? (
              <p>Cargando productos...</p>
            ) : items.length === 0 ? (
              <div className="flex flex-col gap-4 items-center">
                <p>Tu carrito está vacío.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                >
                  Limpiar todo (carrito e imágenes)
                </Button>
              </div>
            ) : (
              items.map((cartItem) => {
                const itemDetails = findShopItemById(cartItem.id);
                if (!itemDetails) return null;
                return (
                  <CartItemComponent
                    key={cartItem.id}
                    id={cartItem.id}
                    quantity={cartItem.quantity}
                    productName={cartItem.productCategory}
                    packageName={itemDetails.name}
                    image={itemDetails.itemImage}
                    price={itemDetails.itemPrice}
                    description={itemDetails.itemDescription}
                    showQuantityControls={true}
                  />
                );
              })
            )}
          </div>
          <Separator />
          {/* resumen de orden */}
          {items.length > 0 && (
            <div className=" flex flex-col md:w-1/2">
              <div className=" w-full flex flex-col text-lg gap-1 text-gray-600 font-light md:px-12 items-center">
                {expandedItems.map((items, index) => {
                  return (
                    <p
                      key={index}
                      className=" flex flex-row w-full justify-between gap-3 hover:bg-muted p-1"
                    >
                      {`${items.productCategory}: ${items.name}`}{" "}
                      <span className=" font-poppins">
                        $ {items.itemPrice.toFixed(2)}
                      </span>{" "}
                    </p>
                  );
                })}
                <p className="flex flex-row w-full justify-between hover:bg-muted font-semibold text-gray-400">
                  Subtotal:{" "}
                  {isClient ? (
                    <span className=" font-poppins">$ {subtotal.toFixed(2)}</span>
                  ) : (
                    <span className=" font-poppins">$ 0.00</span>
                  )}
                </p>
              </div>

              <Separator />
              <div className="md:px-12">
                <p className=" w-full flex justify-between text-lg">
                  IVA:{" "}
                  {isClient ? (
                    <span className=" font-poppins">$ {iva.toFixed(2)}</span>
                  ) : (
                    <span className=" font-poppins">$ 0.00</span>
                  )}
                </p>
                <p className=" w-full flex justify-between text-lg font-semibold">
                  Total:{" "}
                  {isClient ? (
                    <span className=" font-poppins">$ {total.toFixed(2)}</span>
                  ) : (
                    <span className=" font-poppins">$ 0.00</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Sección de recomendaciones */}
          {!isLoadingProducts && items.length > 0 && (
            <div className="w-full max-w-7xl px-4">
              <ProductRecommendations
                productSections={products}
                cartItemIds={items.map((item) => item.id)}
                maxRecommendations={4}
              />
            </div>
          )}
        </div>
      )}

      {currentStep === 2 && (
        <div className="w-full items-center flex flex-col justify-center gap-8 px-4">
          <Stepper currentStep={2} steps={4} title="Elegir fotos" />
          <div className="space-y-6 p-4 min-h-140 w-full">
            {isLoadingProducts ? (
              <p>Cargando productos...</p>
            ) : items.length === 0 ? (
              <p>No hay items en el carrito.</p>
            ) : (
              items.flatMap((cartItem) => {
                const itemDetails = findShopItemById(cartItem.id);
                if (!itemDetails) return [];

                // Create an array of cards for each quantity of the item
                return Array.from({ length: cartItem.quantity }, (_, index) => {
                  const customization = getCustomization(cartItem.id, index);
                  const { current: currentImagesAdded } = getInstanceProgress(
                    cartItem.id,
                    index
                  );
                  const requiredImages = itemDetails.numOfRequiredImages;
                  const progress =
                    requiredImages > 0
                      ? Math.min(100, (currentImagesAdded / requiredImages) * 100)
                      : 0;
                  const isComplete = currentImagesAdded >= requiredImages;

                  // Renderizar thumbnails según el tipo de editor
                  const renderThumbnails = () => {
                    if (!customization) {
                      return (
                        <div className="flex items-center justify-center w-full h-32 bg-muted rounded-lg border-2 border-dashed border-muted-foreground/30">
                          <div className="text-center text-muted-foreground">
                            <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">Sin imágenes aún</p>
                          </div>
                        </div>
                      );
                    }

                    // Calendario: mostrar grid de 12 meses
                    if (customization.editorType === "calendar") {
                      const calendarData = customization.data as CalendarCustomization;
                      const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

                      return (
                        <div className="w-full">
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Calendario - 12 meses</span>
                          </div>
                          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                            {calendarData.months.map((monthData, monthIndex) => (
                              <div
                                key={monthIndex}
                                className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                                  monthData.imageSrc
                                    ? "border-green-500"
                                    : "border-muted-foreground/30 border-dashed"
                                }`}
                              >
                                {monthData.imageSrc ? (
                                  <img
                                    src={monthData.imageSrc}
                                    alt={months[monthIndex]}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-0.5">
                                  {months[monthIndex]}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    // Polaroid: mostrar grid de polaroids guardadas
                    if (customization.editorType === "polaroid") {
                      const polaroidData = customization.data as PolaroidCustomization;
                      const emptySlots = Math.max(0, polaroidData.maxPolaroids - polaroidData.polaroids.length);

                      return (
                        <div className="w-full">
                          <div className="flex items-center gap-2 mb-3">
                            <Grid3X3 className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">
                              Polaroids - {polaroidData.polaroids.length} de {polaroidData.maxPolaroids}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                            {polaroidData.polaroids.map((polaroid, pIndex) => (
                              <div
                                key={polaroid.id}
                                className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-green-500 bg-white shadow-sm"
                              >
                                {polaroid.thumbnailDataUrl ? (
                                  <img
                                    src={polaroid.thumbnailDataUrl}
                                    alt={`Polaroid ${pIndex + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <img
                                    src={polaroid.imageSrc}
                                    alt={`Polaroid ${pIndex + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                                <div className="absolute top-1 right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                  {pIndex + 1}
                                </div>
                              </div>
                            ))}
                            {/* Slots vacíos */}
                            {Array.from({ length: emptySlots }).map((_, emptyIndex) => (
                              <div
                                key={`empty-${emptyIndex}`}
                                className="aspect-[3/4] rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted flex items-center justify-center"
                              >
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    // Standard: mostrar grid de imágenes (nuevo formato con array)
                    if (customization.editorType === "standard") {
                      const standardData = customization.data as StandardCustomization;
                      const images = standardData.images || [];
                      const maxImages = standardData.maxImages || requiredImages;
                      const emptySlots = Math.max(0, maxImages - images.length);

                      return (
                        <div className="w-full">
                          <div className="flex items-center gap-2 mb-3">
                            <ImageIcon className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">
                              Fotos - {images.length} de {maxImages}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                            {images.map((img, imgIndex) => (
                              <div
                                key={img.id}
                                className="relative aspect-square rounded-lg overflow-hidden border-2 border-green-500 shadow-sm"
                              >
                                <img
                                  src={img.thumbnailDataUrl || img.imageSrc}
                                  alt={`Foto ${imgIndex + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-1 right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                  {imgIndex + 1}
                                </div>
                              </div>
                            ))}
                            {/* Slots vacíos */}
                            {Array.from({ length: emptySlots }).map((_, emptyIndex) => (
                              <div
                                key={`empty-${emptyIndex}`}
                                className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted flex items-center justify-center"
                              >
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return null;
                  };

                  return (
                    <Card
                      key={`${cartItem.id}-${index}`}
                      className={`p-4 transition-all ${
                        isComplete ? "border-green-500 border-2" : ""
                      }`}
                    >
                      <CardTitle className="text-xl flex items-center justify-between mb-4">
                        <span className="flex items-center gap-2">
                          {itemDetails.name} #{index + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          {isComplete && (
                            <span className="text-sm text-green-600 font-normal">Completo</span>
                          )}
                          {isComplete && (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                          )}
                        </div>
                      </CardTitle>

                      <CardContent className="space-y-4 pt-0">
                        {/* Thumbnails de las imágenes */}
                        {renderThumbnails()}

                        {/* Botón de editar */}
                        <Button
                          variant={customization ? "secondary" : "default"}
                          className="w-full h-12"
                          onClick={() => {
                            onAddImage(cartItem, itemDetails, index);
                          }}
                        >
                          {customization ? (
                            <>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar imágenes
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Agregar imágenes
                            </>
                          )}
                        </Button>
                      </CardContent>

                      <CardFooter className="w-full flex flex-col gap-2 pt-4">
                        <div className="w-full flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Progreso</span>
                          <span className="text-sm font-medium">
                            {currentImagesAdded} / {requiredImages} imágenes
                          </span>
                        </div>
                        <Progress value={progress} className="w-full h-2" />
                      </CardFooter>
                    </Card>
                  );
                });
              })
            )}
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="w-full items-center flex flex-col justify-center gap-8 px-4 md:px-12">
          <Stepper currentStep={3} steps={4} title="Proceder al pago" />

          <div className="flex flex-col md:flex-row w-full gap-8">
            {/* Columna izquierda: Resumen del pedido */}
            <div className="w-full md:w-1/2 flex flex-col gap-4">
              <h2 className="text-xl font-semibold">Resumen del Pedido</h2>

              {isLoadingProducts ? (
                <p>Cargando productos...</p>
              ) : items.length === 0 ? (
                <p>No hay productos en tu carrito.</p>
              ) : (
                items.map((cartItem) => {
                  const itemDetails = findShopItemById(cartItem.id);
                  if (!itemDetails) return null;
                  return (
                    <CartItemComponent
                      key={cartItem.id}
                      id={cartItem.id}
                      quantity={cartItem.quantity}
                      productName={cartItem.productCategory}
                      packageName={itemDetails.name}
                      image={itemDetails.itemImage}
                      price={itemDetails.itemPrice}
                      description={itemDetails.itemDescription}
                      showQuantityControls={false}
                    />
                  );
                })
              )}

              {/* Totales */}
              <div className="mt-6 p-4 bg-muted rounded-md">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-poppins">$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA:</span>
                    <span className="font-poppins">$ {iva.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="font-poppins">$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha: Dirección y Pago */}
            <div className="w-full md:w-1/2 flex flex-col gap-6">
              {/* Verificar autenticación */}
              {!isAuthenticated ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Inicia sesión para continuar</h3>
                  <p className="text-muted-foreground mb-4">
                    Necesitas una cuenta para procesar tu pedido
                  </p>
                  <Button onClick={() => router.push("/login")}>
                    Iniciar Sesión
                  </Button>
                </div>
              ) : (
                <>
                  {/* Selector de Método de Entrega */}
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Método de Entrega</h2>

                    <RadioGroup
                      value={deliveryMethod}
                      onValueChange={(value) => setDeliveryMethod(value as 'envio_domicilio' | 'recogida_tienda')}
                      className="space-y-3"
                    >
                      {/* Opción: Envío a domicilio */}
                      <div
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          deliveryMethod === 'envio_domicilio'
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-primary/50'
                        }`}
                        onClick={() => setDeliveryMethod('envio_domicilio')}
                      >
                        <div className="flex items-start gap-3">
                          <RadioGroupItem value="envio_domicilio" id="envio_domicilio" className="mt-0.5" />
                          <div className="flex-1">
                            <Label htmlFor="envio_domicilio" className="font-semibold cursor-pointer text-base">
                              Envío a domicilio
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Tu pedido será enviado a la dirección que selecciones
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Opción: Recoger en tienda */}
                      <div
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          deliveryMethod === 'recogida_tienda'
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-primary/50'
                        }`}
                        onClick={() => setDeliveryMethod('recogida_tienda')}
                      >
                        <div className="flex items-start gap-3">
                          <RadioGroupItem value="recogida_tienda" id="recogida_tienda" className="mt-0.5" />
                          <div className="flex-1">
                            <Label htmlFor="recogida_tienda" className="font-semibold cursor-pointer text-base">
                              Recoger en tienda
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Recoge tu pedido en nuestra tienda física
                            </p>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Selector de Dirección - Solo si es envío a domicilio */}
                  {deliveryMethod === 'envio_domicilio' && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Dirección de Envío
                      </h2>

                    {isLoadingAddresses ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="ml-2">Cargando direcciones...</span>
                      </div>
                    ) : addresses.length === 0 ? (
                      <div className="bg-muted rounded-lg p-6 text-center">
                        <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">
                          No tienes direcciones guardadas
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => router.push("/user/profile")}
                        >
                          Agregar Dirección
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {addresses.map((address) => (
                          <div
                            key={address.id}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              selectedAddressId === address.id
                                ? "border-primary bg-primary/5"
                                : "border-muted hover:border-primary/50"
                            }`}
                            onClick={() => setSelectedAddressId(address.id!)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold">{address.alias}</span>
                                  {address.predeterminada && (
                                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                                      Predeterminada
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {address.direccion}
                                  {address.numero_casa && ` #${address.numero_casa}`}
                                  {address.numero_departamento && `, Depto. ${address.numero_departamento}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {address.ciudad}, {address.estado}, {address.codigo_postal}
                                </p>
                                <p className="text-sm text-muted-foreground">{address.pais}</p>
                              </div>
                              <div className="flex items-center">
                                {selectedAddressId === address.id && (
                                  <CheckCircle2 className="h-6 w-6 text-primary" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        <Button
                          variant="ghost"
                          className="w-full"
                          onClick={() => router.push("/user/profile")}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar nueva dirección
                        </Button>
                      </div>
                    )}
                    </div>
                  )}

                  {/* Información de Tienda - Solo si es recogida en tienda */}
                  {deliveryMethod === 'recogida_tienda' && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-6 border-2 border-blue-200 dark:border-blue-800">
                      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        Ubicación de la Tienda
                      </h2>

                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold text-lg">{config.storeInfo.nombre}</p>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm text-muted-foreground">Dirección</p>
                            <p className="font-medium">{config.storeInfo.direccion}</p>
                            <p className="text-sm text-muted-foreground">
                              {config.storeInfo.ciudad}, {config.storeInfo.estado}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              C.P. {config.storeInfo.codigo_postal}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Phone className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm text-muted-foreground">Teléfono</p>
                            <p className="font-medium">{config.storeInfo.telefono}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm text-muted-foreground">Horario</p>
                            <p className="font-medium">{config.storeInfo.horario}</p>
                          </div>
                        </div>

                        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-md p-3 mt-4">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Importante:</strong> Te notificaremos por email cuando tu pedido esté listo para recoger.
                            No olvides traer una identificación oficial al recoger tu pedido.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Botón de Pago */}
                  <div className="mt-4">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Pago Seguro
                    </h2>

                    {checkoutError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        {checkoutError}
                      </div>
                    )}

                    <div className="bg-muted/50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-muted-foreground text-center">
                        Serás redirigido a Stripe para completar tu pago de forma segura
                      </p>
                    </div>

                    <Button
                      className="w-full h-14 text-lg font-semibold"
                      onClick={handleCheckout}
                      disabled={
                        isProcessingCheckout ||
                        (deliveryMethod === 'envio_domicilio' && !selectedAddressId) ||
                        items.length === 0
                      }
                    >
                      {isProcessingCheckout ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-5 w-5" />
                          Pagar $ {total.toFixed(2)} MXN
                        </>
                      )}
                    </Button>

                    {/* Mensaje dinámico según método de entrega */}
                    {deliveryMethod === 'envio_domicilio' && selectedAddress && (
                      <p className="text-xs text-muted-foreground text-center mt-3">
                        Envío a: {selectedAddress.alias} - {selectedAddress.ciudad}
                      </p>
                    )}

                    {deliveryMethod === 'recogida_tienda' && (
                      <p className="text-xs text-muted-foreground text-center mt-3">
                        Recoger en: {config.storeInfo.nombre}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-row w-full justify-around h-20 sticky bottom-0 bg-background py-4">
        <Button
          className="text-xl px-4 py-6"
          onClick={() => {
            if (currentStep === 1) {
              router.back();
            } else {
              setCurrentStep(currentStep - 1);
            }
          }}
        >
          Anterior
        </Button>

        {currentStep < 3 && (
          <div className="flex flex-col items-center gap-1">
            <Button
              variant={"secondary"}
              className="text-xl px-4 py-6"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={currentStep === 2 && !areAllCustomizationsComplete()}
            >
              Siguiente
            </Button>
            {currentStep === 2 && !areAllCustomizationsComplete() && (
              <span className="text-xs text-muted-foreground">
                Completa todas las imágenes para continuar
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
