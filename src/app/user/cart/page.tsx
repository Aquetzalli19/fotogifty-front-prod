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
import { useTermsAcceptance } from "@/hooks/useTermsAcceptance";
import TermsAcceptanceModal from "@/components/legal/TermsAcceptanceModal";
import { obtenerDocumentoLegalActivo } from "@/services/legal-documents";
import { LegalDocument } from "@/interfaces/legal-documents";
import StoreLocationInfo from "@/components/common/StoreLocationInfo";

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
  const { getCustomization, getInstanceProgress, getTotalCopiesUsed, clearAll: clearCustomizations, removeAllForCartItem } = useCustomizationStore();

  // Hook para verificar términos y condiciones
  const {
    needsAcceptance,
    termsStatus,
    showModal,
    setShowModal,
    acceptTerms,
    checkTermsStatus,
    isChecking: isCheckingTerms,
    isAccepting: isAcceptingTerms,
  } = useTermsAcceptance();

  // Estado local para documento de términos (fallback si el hook no lo provee)
  const [localTermsDocument, setLocalTermsDocument] = useState<LegalDocument | null>(null);

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
        // NUEVO: Usar getTotalCopiesUsed para validar que se alcanzó el límite del paquete
        const totalCopiesUsed = getTotalCopiesUsed(cartItem.id, i);

        // IMPORTANTE: Para calendarios, validar que los 12 meses estén completos
        const customization = getCustomization(cartItem.id, i);
        if (customization?.editorType === "calendar") {
          const calendarData = customization.data as CalendarCustomization;
          const completedMonths = calendarData?.months?.filter(m => m.imageSrc !== null).length || 0;
          if (completedMonths < 12) {
            return false;
          }
        } else {
          // Para Standard y Polaroid: validar que el total de copias alcance el total requerido del paquete
          if (totalCopiesUsed < requiredImages) {
            return false;
          }
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

    // ===== VALIDACIÓN DE TÉRMINOS (ACTUALIZADA) =====
    console.log('🔍 Verificando términos antes de checkout...');

    // Verificar términos ANTES de proceder con el checkout
    await checkTermsStatus();

    // Esperar un ciclo de renderizado para que el estado se actualice
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verificar si el hook detectó que se necesita aceptación
    if (needsAcceptance) {
      console.log('⚠️ Usuario necesita aceptar términos actualizados');
      setShowModal(true);
      setCheckoutError("Debes aceptar los nuevos términos y condiciones para continuar");
      return; // Detener checkout hasta que acepte términos
    }

    console.log('✅ Términos verificados, procediendo con checkout');
    // ===== FIN VALIDACIÓN DE TÉRMINOS =====

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
    } catch (error: unknown) {
      console.error("Error en checkout:", error);

      // ===== MANEJO DE ERROR DE TÉRMINOS (ACTUALIZADO) =====
      // Si el backend retorna error por términos no aceptados
      const errorObj = error as { status?: number; error?: string; message?: string; response?: { status?: number; data?: { error?: string; message?: string } } };
      const errorMessage = errorObj?.message || errorObj?.error || errorObj?.response?.data?.message || '';

      // Verificar si el error es por términos no aceptados (puede ser 400 o 403)
      if (
        errorMessage.toLowerCase().includes('términos') ||
        errorMessage.toLowerCase().includes('terminos') ||
        errorMessage.toLowerCase().includes('terms')
      ) {
        console.log('⚠️ Backend bloqueó checkout: términos no aceptados');
        console.log('🔍 Error message:', errorMessage);

        // Verificar el estado de términos para obtener la información completa
        try {
          await checkTermsStatus();
          console.log('📋 checkTermsStatus completado');
          console.log('🔴 needsAcceptance:', needsAcceptance);
          console.log('📄 termsStatus:', termsStatus);
        } catch (err) {
          console.error('❌ Error al verificar términos:', err);
        }

        // Si no tenemos el documento de términos en termsStatus, cargarlo manualmente
        if (!termsStatus?.termsDocument) {
          console.log('📄 Cargando documento de términos activo...');
          try {
            const response = await obtenerDocumentoLegalActivo('terms');
            if (response.success && response.data) {
              console.log('✅ Documento de términos cargado:', response.data);
              setLocalTermsDocument(response.data);
            } else {
              console.error('❌ No se pudo cargar documento de términos');
            }
          } catch (err) {
            console.error('❌ Error al cargar documento de términos:', err);
          }
        }

        // Mostrar modal bloqueante SIEMPRE que el backend rechace por términos
        console.log('🚨 Forzando apertura del modal');
        setShowModal(true);
        setCheckoutError("Debes aceptar los nuevos términos y condiciones para continuar");
        return;
      }
      // ===== FIN MANEJO DE ERROR =====

      setCheckoutError(error instanceof Error ? error.message : "Error al procesar el pago");
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  // Callback al aceptar términos desde el modal
  const handleAcceptTerms = async () => {
    try {
      await acceptTerms();
      setShowModal(false);
      console.log('✅ Términos aceptados, reintentando checkout...');

      // Reintentar checkout automáticamente después de aceptar
      await handleCheckout();
    } catch (error) {
      console.error('Error al aceptar términos:', error);
      setCheckoutError("Error al aceptar los términos. Por favor intenta nuevamente.");
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
        <div className="w-full bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 p-4 mb-4">
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
              <div className=" w-full flex flex-col text-lg gap-1 text-muted-foreground font-light md:px-12 items-center">
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
                <p className="flex flex-row w-full justify-between hover:bg-muted font-semibold text-muted-foreground/70">
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
                <p className=" w-full flex justify-between text-lg font-semibold">
                  Total:{" "}
                  {isClient ? (
                    <span className=" font-poppins">$ {total.toFixed(2)}</span>
                  ) : (
                    <span className=" font-poppins">$ 0.00</span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  * Precios incluyen IVA
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

                  // NUEVO: Usar getTotalCopiesUsed para calcular progreso con sistema de copias
                  const totalCopiesUsed = getTotalCopiesUsed(cartItem.id, index);
                  const requiredImages = itemDetails.numOfRequiredImages;

                  // Para calendarios, validar que los 12 meses estén completos
                  let isComplete = false;
                  let progress = 0;

                  if (customization?.editorType === "calendar") {
                    const calendarData = customization.data as CalendarCustomization;
                    const completedMonths = calendarData?.months?.filter(m => m.imageSrc !== null).length || 0;
                    isComplete = completedMonths === 12;
                    progress = Math.min(100, (completedMonths / 12) * 100);
                  } else {
                    // Para Standard y Polaroid: el progreso se basa en copias usadas
                    progress = requiredImages > 0 ? Math.min(100, (totalCopiesUsed / requiredImages) * 100) : 0;
                    isComplete = totalCopiesUsed >= requiredImages;
                  }

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

                      // NUEVO: Obtener cantidad de copias del calendario (todas los meses tienen el mismo valor)
                      const calendarCopies = calendarData?.months?.find(m => m.imageSrc)?.copies || 1;
                      const completedMonths = calendarData?.months?.filter(m => m.imageSrc !== null).length || 0;

                      return (
                        <div className="w-full">
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">
                              Calendario - {completedMonths}/12 meses
                            </span>
                            {/* NUEVO: Mostrar cantidad de copias del calendario completo */}
                            {calendarCopies > 1 && completedMonths === 12 && (
                              <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                                ×{calendarCopies} calendarios
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                            {(calendarData?.months || []).map((monthData, monthIndex) => (
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

                      // NUEVO: Calcular total de copias usadas
                      const totalCopiesUsed = polaroidData.polaroids.reduce((sum, p) => sum + (p.copies || 1), 0);
                      const emptySlots = Math.max(0, polaroidData.maxPolaroids - totalCopiesUsed);

                      return (
                        <div className="w-full">
                          <div className="flex items-center gap-2 mb-3">
                            <Grid3X3 className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">
                              Polaroids - {totalCopiesUsed} de {polaroidData.maxPolaroids}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({polaroidData.polaroids.length} {polaroidData.polaroids.length === 1 ? 'único' : 'únicos'})
                            </span>
                          </div>
                          <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                            {polaroidData.polaroids.map((polaroid, pIndex) => (
                              <div
                                key={polaroid.id}
                                className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-green-500 dark:border-green-400 bg-white dark:bg-slate-800 shadow-sm"
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
                                {/* NUEVO: Badge de cantidad de copias */}
                                {polaroid.copies && polaroid.copies > 1 && (
                                  <div className="absolute bottom-1 right-1 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
                                    ×{polaroid.copies}
                                  </div>
                                )}
                              </div>
                            ))}
                            {/* Slots vacíos */}
                            {emptySlots > 0 && (
                              <div className="col-span-full text-xs text-muted-foreground text-center py-2">
                                {emptySlots} {emptySlots === 1 ? 'espacio disponible' : 'espacios disponibles'}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Standard: mostrar grid de imágenes (nuevo formato con array)
                    if (customization.editorType === "standard") {
                      const standardData = customization.data as StandardCustomization;
                      const images = standardData.images || [];
                      const maxImages = standardData.maxImages || requiredImages;

                      // NUEVO: Calcular total de copias usadas
                      const totalCopiesUsed = images.reduce((sum, img) => sum + (img.copies || 1), 0);
                      const emptySlots = Math.max(0, maxImages - totalCopiesUsed);

                      return (
                        <div className="w-full">
                          <div className="flex items-center gap-2 mb-3">
                            <ImageIcon className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">
                              Fotos - {totalCopiesUsed} de {maxImages}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({images.length} {images.length === 1 ? 'única' : 'únicas'})
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
                                {/* NUEVO: Badge de cantidad de copias */}
                                {img.copies && img.copies > 1 && (
                                  <div className="absolute bottom-1 right-1 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
                                    ×{img.copies}
                                  </div>
                                )}
                              </div>
                            ))}
                            {/* Slots vacíos */}
                            {emptySlots > 0 && (
                              <div className="col-span-full text-xs text-muted-foreground text-center py-2">
                                {emptySlots} {emptySlots === 1 ? 'espacio disponible' : 'espacios disponibles'}
                              </div>
                            )}
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
                            {customization?.editorType === "calendar" ? (
                              <>
                                {customization.data && (customization.data as CalendarCustomization).months.filter(m => m.imageSrc !== null).length} / 12 meses
                              </>
                            ) : (
                              <>
                                {totalCopiesUsed} / {requiredImages} fotos
                              </>
                            )}
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
        <div className="w-full items-center flex flex-col justify-center gap-4 sm:gap-6 lg:gap-8 px-2 sm:px-4 lg:px-8 xl:px-12">
          <Stepper currentStep={3} steps={4} title="Proceder al pago" />

          <div className="flex flex-col lg:flex-row w-full gap-4 sm:gap-6 lg:gap-6 xl:gap-8 max-w-7xl mx-auto">
            {/* Columna izquierda: Resumen del pedido */}
            <div className="w-full lg:w-1/2 flex flex-col gap-3 sm:gap-4">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">Resumen del Pedido</h2>

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
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 md:p-5 bg-muted rounded-md">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm sm:text-base md:text-lg">
                    <span>Subtotal:</span>
                    <span className="font-poppins">$ {subtotal.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-base sm:text-lg md:text-xl">
                    <span>Total:</span>
                    <span className="font-poppins">$ {total.toFixed(2)}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                    * Precios incluyen IVA
                  </p>
                </div>
              </div>
            </div>

            {/* Columna derecha: Dirección y Pago */}
            <div className="w-full lg:w-1/2 flex flex-col gap-4 sm:gap-6">
              {/* Verificar autenticación */}
              {!isAuthenticated ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 sm:p-6 text-center">
                  <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-500 dark:text-yellow-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Inicia sesión para continuar</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                    Necesitas una cuenta para procesar tu pedido
                  </p>
                  <Button onClick={() => router.push("/login")} className="text-sm sm:text-base">
                    Iniciar Sesión
                  </Button>
                </div>
              ) : (
                <>
                  {/* Selector de Método de Entrega */}
                  <div className="mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-3 sm:mb-4">Método de Entrega</h2>

                    <RadioGroup
                      value={deliveryMethod}
                      onValueChange={(value) => setDeliveryMethod(value as 'envio_domicilio' | 'recogida_tienda')}
                      className="space-y-2 sm:space-y-3"
                    >
                      {/* Opción: Envío a domicilio */}
                      <div
                        className={`border-2 rounded-lg p-3 sm:p-4 md:p-5 cursor-pointer transition-all ${
                          deliveryMethod === 'envio_domicilio'
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-primary/50'
                        }`}
                        onClick={() => setDeliveryMethod('envio_domicilio')}
                      >
                        <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                          <RadioGroupItem value="envio_domicilio" id="envio_domicilio" className="mt-0.5" />
                          <div className="flex-1">
                            <Label htmlFor="envio_domicilio" className="font-semibold cursor-pointer text-sm sm:text-base md:text-lg">
                              Envío a domicilio
                            </Label>
                            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">
                              Tu pedido será enviado a la dirección que selecciones
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Opción: Recoger en tienda */}
                      <div
                        className={`border-2 rounded-lg p-3 sm:p-4 md:p-5 cursor-pointer transition-all ${
                          deliveryMethod === 'recogida_tienda'
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-primary/50'
                        }`}
                        onClick={() => setDeliveryMethod('recogida_tienda')}
                      >
                        <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                          <RadioGroupItem value="recogida_tienda" id="recogida_tienda" className="mt-0.5" />
                          <div className="flex-1">
                            <Label htmlFor="recogida_tienda" className="font-semibold cursor-pointer text-sm sm:text-base md:text-lg">
                              Recoger en tienda
                            </Label>
                            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">
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
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                        Dirección de Envío
                      </h2>

                    {isLoadingAddresses ? (
                      <div className="flex items-center justify-center p-6 sm:p-8 md:p-10">
                        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 animate-spin" />
                        <span className="ml-2 text-sm sm:text-base md:text-lg">Cargando direcciones...</span>
                      </div>
                    ) : addresses.length === 0 ? (
                      <div className="bg-muted rounded-lg p-4 sm:p-6 md:p-8 text-center">
                        <MapPin className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                        <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-3 sm:mb-4">
                          No tienes direcciones guardadas
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => router.push("/user/profile")}
                          className="text-sm sm:text-base md:text-lg"
                        >
                          Agregar Dirección
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-3">
                        {addresses.map((address) => (
                          <div
                            key={address.id}
                            className={`p-3 sm:p-4 md:p-5 border-2 rounded-lg cursor-pointer transition-all ${
                              selectedAddressId === address.id
                                ? "border-primary bg-primary/5"
                                : "border-muted hover:border-primary/50"
                            }`}
                            onClick={() => setSelectedAddressId(address.id!)}
                          >
                            <div className="flex items-start justify-between gap-2 md:gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-semibold text-sm sm:text-base md:text-lg">{address.alias}</span>
                                  {address.predeterminada && (
                                    <span className="text-xs sm:text-sm bg-primary text-primary-foreground px-2 py-0.5 rounded whitespace-nowrap">
                                      Predeterminada
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs sm:text-sm md:text-base text-muted-foreground break-words">
                                  {address.direccion}
                                  {address.numero_casa && ` #${address.numero_casa}`}
                                  {address.numero_departamento && `, Depto. ${address.numero_departamento}`}
                                </p>
                                <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                                  {address.ciudad}, {address.estado}, {address.codigo_postal}
                                </p>
                                <p className="text-xs sm:text-sm md:text-base text-muted-foreground">{address.pais}</p>
                              </div>
                              <div className="flex items-center flex-shrink-0">
                                {selectedAddressId === address.id && (
                                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-primary" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        <Button
                          variant="ghost"
                          className="w-full text-sm sm:text-base"
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
                    <div>
                      <StoreLocationInfo showMap={true} />

                      <div className="mt-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Importante:</strong> Te notificaremos por email cuando tu pedido esté listo para recoger.
                          No olvides traer una identificación oficial al recoger tu pedido.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Botón de Pago */}
                  <div className="mt-3 sm:mt-4">
                    <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                      Pago Seguro
                    </h2>

                    {checkoutError && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg mb-3 sm:mb-4 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">{checkoutError}</span>
                      </div>
                    )}

                    <div className="bg-muted/50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                      <p className="text-xs sm:text-sm text-muted-foreground text-center">
                        Serás redirigido a Stripe para completar tu pago de forma segura
                      </p>
                    </div>

                    <Button
                      className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold"
                      onClick={handleCheckout}
                      disabled={
                        isProcessingCheckout ||
                        (deliveryMethod === 'envio_domicilio' && !selectedAddressId) ||
                        items.length === 0
                      }
                    >
                      {isProcessingCheckout ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                          Pagar $ {total.toFixed(2)} MXN
                        </>
                      )}
                    </Button>

                    {/* Mensaje dinámico según método de entrega */}
                    {deliveryMethod === 'envio_domicilio' && selectedAddress && (
                      <p className="text-xs text-muted-foreground text-center mt-2 sm:mt-3">
                        Envío a: {selectedAddress.alias} - {selectedAddress.ciudad}
                      </p>
                    )}

                    {deliveryMethod === 'recogida_tienda' && (
                      <p className="text-xs text-muted-foreground text-center mt-2 sm:mt-3">
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
              // Regresar al dashboard principal
              router.push('/user/');
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

      {/* Modal de aceptación de términos */}
      <TermsAcceptanceModal
        isOpen={showModal}
        onAccept={handleAcceptTerms}
        onCancel={() => setShowModal(false)}
        termsDocument={termsStatus?.termsDocument ?? localTermsDocument}
        previousVersion={termsStatus?.userAcceptedVersion ?? null}
        isBlocking={currentStep === 3} // Bloquear si está en paso de checkout
        isLoading={isAcceptingTerms}
      />
    </div>
  );
};

export default CartPage;
