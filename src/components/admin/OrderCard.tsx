"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { AdmiOrder, OrderItem } from "@/interfaces/order-summary";
import { Separator } from "../ui/separator";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ImageIcon } from "lucide-react";

import UpdateOrderDialog from "./UpdateOrderDialog";

interface OrderCardProps {
  order: AdmiOrder;
  onOrderUpdated?: () => void;
}

const OrderCard = ({ order, onOrderUpdated }: OrderCardProps) => {
  const [open, setOpen] = useState(false);

  // Usar los campos del backend (items_pedido) con fallback a orderItems para compatibilidad
  const items = order.items_pedido || order.orderItems || [];

  // Calcular total desde items o usar el total del backend
  const total = order.total ?? items.reduce((acc, item) => {
    // Soportar ambos formatos de item
    const price = 'precio_unitario' in item ? item.precio_unitario : (item as OrderItem).itemPrice || 0;
    const qty = 'cantidad' in item ? item.cantidad : 1;
    return acc + (price * qty);
  }, 0);

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

  // Usar campos del backend con fallback
  const orderId = order.orderId ?? order.id;
  const clientName = order.nombre_cliente ?? order.clientName ?? "Cliente";
  const orderDate = order.fecha_pedido ?? order.dateOfOrder;
  const status = order.estado ?? order.status ?? "Sin estado";
  const images = order.imagenes || order.images || [];

  const statusStyles: Record<string, string> = {
    "Pendiente": "bg-orange-100 text-orange-800 border-orange-300",
    "En Proceso": "bg-blue-100 text-blue-800 border-blue-300",
    "Enviado": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "Entregado": "bg-green-200 text-green-900 border-green-400",
    "Cancelado": "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <>
      <Card className="w-full mx-2 sm:mx-auto gap-2 flex flex-col sm:flex-row">
        <div className="items-center flex flex-row sm:flex-col px-3 sm:px-4 py-2 sm:py-6 justify-center text-secondary font-medium w-full sm:w-40 bg-muted/30 sm:bg-transparent rounded-t-lg sm:rounded-none">
          <p className="text-xs sm:text-sm text-center">
            Num. de pedido:{" "}
            <span className="text-sm sm:text-base font-bold">
              {orderId ?? "N/A"}
            </span>
          </p>
        </div>
        <div className="w-full flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">
              <span className="text-lg sm:text-xl block">{clientName}</span>
              <span className="text-secondary text-sm mt-1 block font-normal">
                Realizado el: {orderDate ? formatDate(orderDate) : "N/A"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 w-full flex flex-col pb-2">
            <CardDescription className="text-sm md:text-md">
              Resumen del pedido
            </CardDescription>
            <div className="space-y-2 pl-2 sm:pl-6 w-full">
              {items.length > 0 ? (
                items.map((item, index) => {
                  // Soportar ambos formatos de item
                  const productName = 'nombre_paquete' in item ? item.nombre_paquete : (item as OrderItem).productName ?? "Producto";
                  const category = 'categoria_paquete' in item ? item.categoria_paquete : (item as OrderItem).package ?? "N/A";
                  const quantity = 'cantidad' in item ? item.cantidad : 1;

                  return (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs sm:text-sm gap-1 sm:gap-0"
                    >
                      <div className="text-muted-foreground w-full sm:w-auto">
                        <div className="flex flex-col sm:flex-row gap-1">
                          <span className="font-semibold text-foreground">
                            {productName}
                          </span>
                          <div className="flex flex-row gap-1">
                            <span>Categoría:</span>
                            <span className="text-secondary font-medium">
                              {category}
                            </span>
                            {quantity > 1 && (
                              <span className="text-muted-foreground">
                                (x{quantity})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-sm">Sin items</p>
              )}
              <Separator className="my-2 sm:min-w-full" />
              <div className="flex justify-end font-poppins text-sm sm:text-base">
                {formatCurrency(total)}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row md:justify-between md:items-center gap-2 sm:gap-4 pt-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`border-solid ${
                  statusStyles[status] ?? "bg-gray-100 text-gray-800"
                } text-xs sm:text-sm`}
              >
                {status}
              </Badge>
              {images.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <ImageIcon className="h-3 w-3" />
                  {images.length}
                </Badge>
              )}
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  className="bg-secondary/40 text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2 border border-secondary text-secondary hover:text-secondary-foreground w-full sm:w-auto"
                  onClick={() => setOpen(true)}
                >
                  Más detalles
                </Button>
              </DialogTrigger>
              <UpdateOrderDialog order={order} setOpen={setOpen} onOrderUpdated={onOrderUpdated} />
            </Dialog>
          </CardFooter>
        </div>
      </Card>
    </>
  );
};

export default OrderCard;
