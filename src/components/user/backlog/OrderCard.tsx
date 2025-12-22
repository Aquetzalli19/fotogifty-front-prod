import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AdmiOrder } from "@/interfaces/order-summary";
import { Package, Calendar, Hash } from "lucide-react";

interface OrderCardProps {
  order: AdmiOrder;
}

export function OrderCard({ order }: OrderCardProps) {
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

  // Estilos para diferentes estados
  const statusStyles: Record<string, string> = {
    "Pendiente": "bg-gray-100 text-gray-800 border-gray-300",
    "En Proceso": "bg-blue-100 text-blue-800 border-blue-300",
    "Enviado": "bg-indigo-100 text-indigo-800 border-indigo-300",
    "En reparto": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "Entregado": "bg-green-100 text-green-800 border-green-300",
    "Cancelado": "bg-red-100 text-red-800 border-red-300",
  };

  const getStatusStyle = (status: string) => {
    return statusStyles[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border gap-2">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <CardTitle className="text-primary text-lg flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Pedido #{order.id}
          </CardTitle>
          <Badge
            variant="outline"
            className={`border ${getStatusStyle(order.estado)} text-sm`}
          >
            {order.estado}
          </Badge>
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

        {order.imagenes && order.imagenes.length > 0 && (
          <Button
            variant="secondary"
            className="bg-secondary/40 border border-secondary text-secondary hover:text-secondary-foreground w-full sm:w-auto"
          >
            Ver fotos ({order.imagenes.length})
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
