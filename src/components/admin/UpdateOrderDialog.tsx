import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Download, ImageIcon, Loader2, MapPin, User, Phone, Mail, Calendar, CreditCard } from "lucide-react";
import { AdmiOrder, OrderItem } from "@/interfaces/order-summary";
import { useState } from "react";
import { actualizarEstadoPedido } from "@/services/pedidos";
import { Separator } from "../ui/separator";

interface OrderDialogProps {
  order: AdmiOrder;
  setOpen: (open: boolean) => void;
  onOrderUpdated?: () => void;
}

const UpdateOrderDialog = ({ order, setOpen, onOrderUpdated }: OrderDialogProps) => {
  // Usar campos del backend con fallback para compatibilidad
  const status = order.estado ?? order.status ?? "Pendiente";
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [isUpdating, setIsUpdating] = useState(false);

  // Usar los campos del backend (items_pedido) con fallback a orderItems para compatibilidad
  const items = order.items_pedido || order.orderItems || [];

  // Calcular total desde items o usar el total del backend
  const total = order.total ?? items.reduce((acc, item) => {
    const price = 'precio_unitario' in item ? item.precio_unitario : (item as OrderItem).itemPrice || 0;
    const qty = 'cantidad' in item ? item.cantidad : 1;
    return acc + (price * qty);
  }, 0);

  // Usar campos del backend con fallback
  const orderId = order.orderId ?? order.id;
  const clientName = order.nombre_cliente ?? order.clientName ?? "Cliente";
  const orderDate = order.fecha_pedido ?? order.dateOfOrder;
  const images = order.imagenes || order.images || [];
  const clientEmail = order.email_cliente;
  const clientPhone = order.telefono_cliente;
  const address = order.direccion_envio;
  const paymentStatus = order.estado_pago;
  const stripeSessionId = order.id_sesion_stripe;

  // Estado para imagen seleccionada en vista ampliada
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(date));
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (images.length === 0) {
      alert("No hay imágenes para descargar");
      return;
    }

    setIsDownloading(true);

    try {
      // Descargar cada imagen
      for (let i = 0; i < images.length; i++) {
        const imageUrl = images[i];

        try {
          // Fetch la imagen
          const response = await fetch(imageUrl);
          if (!response.ok) throw new Error(`Error al obtener imagen ${i + 1}`);

          const blob = await response.blob();

          // Crear URL temporal y descargar
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;

          // Extraer extensión del URL o usar .jpg por defecto
          const extension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
          link.download = `pedido-${orderId}-imagen-${i + 1}.${extension}`;

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Limpiar URL temporal
          window.URL.revokeObjectURL(url);

          // Pequeña pausa entre descargas para evitar bloqueos del navegador
          if (i < images.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } catch (imgError) {
          console.error(`Error descargando imagen ${i + 1}:`, imgError);
        }
      }

      console.log(`Descargadas ${images.length} imágenes del pedido ${orderId}`);
    } catch (error) {
      console.error("Error al descargar archivos:", error);
      alert("Error al descargar los archivos");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveChanges = async () => {
    setIsUpdating(true);
    try {
      // Actualizar el estado del pedido usando el servicio
      // actualizarEstadoPedido devuelve AdmiOrder | null
      const updatedOrder = await actualizarEstadoPedido(orderId, selectedStatus);

      if (updatedOrder) {
        console.log("Estado del pedido actualizado exitosamente");
        setOpen(false);
        // Notificar al padre para refrescar la lista
        onOrderUpdated?.();
      } else {
        console.error("Error al actualizar el estado del pedido");
        alert("Error al actualizar el estado del pedido");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Error al actualizar el estado del pedido");
    } finally {
      setIsUpdating(false);
    }
  };
  return (
    <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
      <DialogHeader>
        <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
          Pedido #{orderId ?? "N/A"}
          {paymentStatus && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              paymentStatus === "pagado" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
            }`}>
              {paymentStatus}
            </span>
          )}
        </DialogTitle>
        <DialogDescription className="text-sm">
          Información completa del pedido y actualización de estado
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        {/* Información del cliente */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Información del Cliente
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Nombre</p>
                <p className="text-sm font-medium">{clientName}</p>
              </div>
            </div>
            {clientEmail && (
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium break-all">{clientEmail}</p>
                </div>
              </div>
            )}
            {clientPhone && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Teléfono</p>
                  <p className="text-sm font-medium">{clientPhone}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Fecha del pedido</p>
                <p className="text-sm font-medium">{orderDate ? formatDate(orderDate) : "N/A"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dirección de envío */}
        {address && (
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              Dirección de Envío
            </h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{address.calle}</p>
              <p className="text-muted-foreground">
                {address.ciudad}, {address.estado}
              </p>
              <p className="text-muted-foreground">
                C.P. {address.codigo_postal}
              </p>
              <p className="text-muted-foreground">{address.pais}</p>
            </div>
          </div>
        )}

        {!address && (
          <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <MapPin className="h-4 w-4" />
              <p className="text-sm">Sin dirección de envío registrada</p>
            </div>
          </div>
        )}

        {/* Estado y Total */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-semibold">Estado del Pedido</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="En Proceso">En Proceso</SelectItem>
                <SelectItem value="Enviado">Enviado</SelectItem>
                <SelectItem value="Entregado">Entregado</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-semibold">Total del Pedido</Label>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <p className="text-lg font-bold text-primary">{formatCurrency(total)}</p>
            </div>
            {order.subtotal && order.iva && (
              <p className="text-xs text-muted-foreground">
                Subtotal: {formatCurrency(order.subtotal)} + IVA: {formatCurrency(order.iva)}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Productos */}
        <div>
          <Label className="text-xs sm:text-sm font-semibold">Productos del Pedido</Label>
          <div className="mt-2 space-y-2 border rounded-lg p-3 sm:p-4 bg-background">
            {items.length > 0 ? (
              items.map((item, index) => {
                const productName = 'nombre_paquete' in item ? item.nombre_paquete : (item as OrderItem).productName ?? "Producto";
                const category = 'categoria_paquete' in item ? item.categoria_paquete : (item as OrderItem).package ?? "N/A";
                const price = 'precio_unitario' in item ? item.precio_unitario : (item as OrderItem).itemPrice || 0;
                const quantity = 'cantidad' in item ? item.cantidad : 1;

                return (
                  <div key={index} className="flex flex-col sm:flex-row sm:justify-between py-2 gap-1 border-b last:border-0">
                    <div className="flex-1">
                      <span className="text-sm font-medium">{productName}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-secondary bg-secondary/10 px-2 py-0.5 rounded">
                          {category}
                        </span>
                        {quantity > 1 && (
                          <span className="text-xs text-muted-foreground">
                            x{quantity}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-semibold">{formatCurrency(price * quantity)}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">Sin productos</p>
            )}
            <div className="flex justify-between pt-3 font-bold border-t text-sm sm:text-base mt-2">
              <span>Total:</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Galería de imágenes */}
        <div className="mt-3 sm:mt-4">
          <Label className="text-left flex items-center gap-2 text-xs sm:text-sm">
            <ImageIcon className="h-4 w-4" />
            Imágenes del pedido ({images.length})
          </Label>
          {images.length > 0 ? (
            <div className="mt-2 border rounded-md p-4">
              {/* Vista ampliada de imagen seleccionada */}
              {selectedImage && (
                <div className="mb-4">
                  <div className="relative w-full h-64 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedImage}
                      alt="Imagen seleccionada"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => setSelectedImage(null)}
                  >
                    Cerrar vista ampliada
                  </Button>
                </div>
              )}

              {/* Grid de miniaturas */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {images.map((imageUrl, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(imageUrl)}
                    className={`relative aspect-square bg-gray-100 rounded-md overflow-hidden border-2 transition-all hover:border-primary ${
                      selectedImage === imageUrl ? "border-primary" : "border-transparent"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={`Imagen ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error("Error cargando imagen:", imageUrl);
                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='12'%3EError%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-2 border rounded-md p-4 text-center text-muted-foreground">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay imágenes en este pedido</p>
            </div>
          )}
        </div>
      </div>
      <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between pt-4">
        <Button
          variant="secondary"
          onClick={handleDownload}
          disabled={isDownloading || images.length === 0}
          className="w-full sm:w-auto text-sm"
        >
          {isDownloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Descargando...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" /> Descargar archivos ({images.length})
            </>
          )}
        </Button>
        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
          <Button onClick={handleSaveChanges} disabled={isUpdating} className="w-full sm:w-auto text-sm">
            {isUpdating ? "Actualizando..." : "Guardar cambios"}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isUpdating} className="w-full sm:w-auto text-sm">
            Cancelar
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
};

export default UpdateOrderDialog;
