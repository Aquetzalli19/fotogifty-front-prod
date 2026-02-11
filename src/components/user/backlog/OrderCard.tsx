import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdmiOrder } from "@/interfaces/order-summary";
import { Package, Calendar, Hash, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { EstadoBadge } from "@/components/EstadoBadge";
import { obtenerEstadosPedido } from "@/services/estados-pedido";
import { EstadoPedido } from "@/interfaces/estado-pedido";

interface OrderCardProps {
  order: AdmiOrder;
}

export function OrderCard({ order }: OrderCardProps) {
  const [isPhotosDialogOpen, setIsPhotosDialogOpen] = useState(false);
  const [estados, setEstados] = useState<EstadoPedido[]>([]);

  // Cargar estados dinámicos desde la API
  useEffect(() => {
    const cargarEstados = async () => {
      try {
        const response = await obtenerEstadosPedido(false);
        if (response.success && response.data) {
          setEstados(response.data);
        }
      } catch (error) {
        console.error("Error cargando estados:", error);
      }
    };

    cargarEstados();
  }, []);

  // Encontrar el color del estado actual
  const estadoActual = estados.find((e) => e.nombre === order.estado);
  const colorEstado = estadoActual?.color;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (date: string | undefined | null) => {
    if (!date) return "Fecha no disponible";
    try {
      const parsedDate = new Date(date);
      // Check if date is valid
      if (isNaN(parsedDate.getTime())) {
        return "Fecha no disponible";
      }
      return new Intl.DateTimeFormat("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(parsedDate);
    } catch {
      return "Fecha no disponible";
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border gap-2">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <CardTitle className="text-primary text-lg flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Pedido #{order.id}
          </CardTitle>
          <EstadoBadge nombre={order.estado} color={colorEstado} />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {formatDate(order.fecha_pedido)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <CardDescription className="text-md flex items-center gap-2">
          <Package className="h-4 w-4" />
          Productos del pedido
        </CardDescription>
        <div className="space-y-2">
          {(order.items_pedido || []).map((item, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm gap-2 pb-2 border-b border-dashed last:border-0"
            >
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {item.nombre_paquete}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.categoria_paquete} • {item.cantidad} {item.cantidad > 1 ? "unidades" : "unidad"}
                </p>
              </div>
              <span className="font-poppins text-base">
                {formatCurrency(item.precio_unitario * item.cantidad)}
              </span>
            </div>
          ))}
          <Separator className="mt-2" />

          {/* Subtotales */}
          {order.subtotal && (
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Subtotal:</span>
              <span className="font-poppins">{formatCurrency(order.subtotal)}</span>
            </div>
          )}
          {order.iva && (
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>IVA:</span>
              <span className="font-poppins">{formatCurrency(order.iva)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2">
            <span className="font-semibold">Total:</span>
            <span className="font-poppins text-lg font-bold text-primary">
              {formatCurrency(order.total || 0)}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
        {/* Información de envío si existe */}
        {order.direccion_envio && (
          <div className="text-xs text-muted-foreground text-center sm:text-left">
            Envío a: {order.direccion_envio.ciudad}, {order.direccion_envio.estado}
          </div>
        )}

        {(order.imagenes && order.imagenes.length > 0) || (order.fotos && order.fotos.length > 0) ? (
          <Button
            variant="secondary"
            className="bg-secondary/40 border border-secondary text-secondary hover:text-secondary-foreground w-full sm:w-auto"
            onClick={() => setIsPhotosDialogOpen(true)}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Ver fotos ({order.fotos?.length || order.imagenes?.length || 0})
          </Button>
        ) : null}
      </CardFooter>

      {/* Dialog para ver fotos */}
      <Dialog open={isPhotosDialogOpen} onOpenChange={setIsPhotosDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fotos del Pedido #{order.id}</DialogTitle>
            <DialogDescription>
              {order.fotos?.length || order.imagenes?.length || 0} {(order.fotos?.length || order.imagenes?.length || 0) === 1 ? 'foto' : 'fotos'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {/* Priorizar fotos con metadata completa */}
            {order.fotos && order.fotos.length > 0 ? (
              order.fotos.map((foto, index) => (
                <div key={foto.id || index} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                  <Image
                    src={foto.url}
                    alt={foto.nombre_archivo || `Foto ${index + 1}`}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                  {foto.cantidad_copias && foto.cantidad_copias > 1 && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-medium">
                      {foto.cantidad_copias} copias
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs">
                    <p className="truncate">{foto.nombre_archivo}</p>
                    <p className="text-[10px] text-gray-300">
                      {foto.ancho_foto}&quot; × {foto.alto_foto}&quot; • {foto.resolucion_foto} DPI
                    </p>
                  </div>
                </div>
              ))
            ) : order.imagenes && order.imagenes.length > 0 ? (
              // Fallback a imagenes (solo URLs)
              order.imagenes.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                  <Image
                    src={url}
                    alt={`Foto ${index + 1}`}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs text-center">
                    Foto {index + 1}
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground py-8">
                No hay fotos disponibles
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
