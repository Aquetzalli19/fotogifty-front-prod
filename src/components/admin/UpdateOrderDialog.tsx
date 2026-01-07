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
import DownloadPedidoFotos from "@/components/user/DownloadPedidoFotos";
import { config } from "@/lib/config";

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
  const clientEmail = order.email_cliente;
  const clientPhone = order.telefono_cliente;
  const address = order.direccion_envio;
  const paymentStatus = order.estado_pago;
  const stripeSessionId = order.id_sesion_stripe;

  // ✅ NUEVO: Detectar si tenemos objetos de fotos con IDs (mejor opción)
  const fotos = order.fotos || [];
  const hasFotosWithIds = fotos.length > 0;

  // ⚠️ Fallback: Solo URLs (para pedidos antiguos)
  const images = order.imagenes || order.images || fotos.map(f => f.url) || [];

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
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const [downloadingImageIndex, setDownloadingImageIndex] = useState<number | null>(null);

  // Descargar una imagen individual
  const handleDownloadSingle = async (imageUrl: string, index: number) => {
    setDownloadingImageIndex(index);

    try {
      const token = localStorage.getItem('auth_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      console.log(`📥 Descargando imagen ${index + 1}...`);

      const response = await fetch(`${apiUrl}/fotos/download-by-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ imageUrl })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const nombreArchivo = hasFotosWithIds && fotos[index]?.nombre_archivo
        ? fotos[index].nombre_archivo
        : `pedido-${orderId}-imagen-${index + 1}.jpg`;

      link.download = nombreArchivo;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`✅ Descargada imagen ${index + 1}: ${nombreArchivo}`);
    } catch (error) {
      console.error(`❌ Error descargando imagen ${index + 1}:`, error);
      alert(`Error al descargar imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setDownloadingImageIndex(null);
    }
  };

  const handleDownload = async () => {
    if (images.length === 0) {
      alert("No hay imágenes para descargar");
      return;
    }

    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: images.length });

    try {
      // Usar proxy del backend (POST /api/fotos/download-by-url)
      // Este endpoint tiene requireAdmin y funciona correctamente
      console.log(`📥 Descargando ${images.length} imágenes del pedido ${orderId}...`);

      const token = localStorage.getItem('auth_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      for (let i = 0; i < images.length; i++) {
        setDownloadProgress({ current: i + 1, total: images.length });
        const imageUrl = images[i];

        try {
          const response = await fetch(`${apiUrl}/fotos/download-by-url`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ imageUrl })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
          }

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;

          // Usar nombre de archivo si está disponible, o generar uno
          const nombreArchivo = hasFotosWithIds && fotos[i]?.nombre_archivo
            ? fotos[i].nombre_archivo
            : `pedido-${orderId}-imagen-${i + 1}.jpg`;

          link.download = nombreArchivo;

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          console.log(`✅ Descargada imagen ${i + 1}/${images.length}: ${nombreArchivo}`);

          // Delay entre descargas (1 segundo para evitar bloqueo del navegador)
          if (i < images.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (imgError) {
          console.error(`❌ Error descargando imagen ${i + 1}:`, imgError);
          alert(`Error al descargar imagen ${i + 1}: ${imgError instanceof Error ? imgError.message : 'Error desconocido'}`);
        }
      }

      console.log(`✅ Descarga completada: ${images.length} imágenes del pedido ${orderId}`);
      alert(`Se descargaron ${images.length} imágenes correctamente`);
    } catch (error) {
      console.error("❌ Error al descargar archivos:", error);
      alert(`Error al descargar los archivos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsDownloading(false);
      setDownloadProgress({ current: 0, total: 0 });
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

        {/* Dirección de envío o información de tienda */}
        {order.metodo_entrega === 'recogida_tienda' ? (
          // Mostrar información de tienda si es recogida
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              Recoger en Tienda
            </h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{config.storeInfo.nombre}</p>
              <p className="text-muted-foreground">{config.storeInfo.direccion}</p>
              <p className="text-muted-foreground">
                {config.storeInfo.ciudad}, {config.storeInfo.estado}
              </p>
              <p className="text-muted-foreground">C.P. {config.storeInfo.codigo_postal}</p>
              <p className="text-muted-foreground">{config.storeInfo.telefono}</p>
              <p className="text-xs text-blue-600 mt-2">
                Horario: {config.storeInfo.horario}
              </p>
            </div>
          </div>
        ) : address ? (
          // Mostrar dirección de envío (código existente)
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
        ) : (
          // Sin dirección ni recogida en tienda (código existente)
          <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <MapPin className="h-4 w-4" />
              <p className="text-sm">Sin información de entrega</p>
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
                  <div
                    key={index}
                    className={`relative aspect-square bg-gray-100 rounded-md overflow-hidden border-2 transition-all ${
                      selectedImage === imageUrl ? "border-primary" : "border-transparent"
                    }`}
                  >
                    {/* Imagen - clickeable para ver ampliada */}
                    <button
                      onClick={() => setSelectedImage(imageUrl)}
                      className="w-full h-full hover:opacity-90 transition-opacity"
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

                    {/* Botón de descarga flotante */}
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-1 right-1 h-7 w-7 shadow-md hover:shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadSingle(imageUrl, index);
                      }}
                      disabled={downloadingImageIndex === index}
                    >
                      {downloadingImageIndex === index ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
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
        {/* Botón de descarga (siempre visible) */}
        <Button
          variant="secondary"
          onClick={handleDownload}
          disabled={isDownloading || images.length === 0}
          className="w-full sm:w-auto text-sm"
        >
          {isDownloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Descargando {downloadProgress.current}/{downloadProgress.total}...
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
