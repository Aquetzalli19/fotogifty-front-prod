"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrderCard from "@/components/admin/OrderCard";
import { obtenerTodosPedidos } from "@/services/pedidos";
import { AdmiOrder } from "@/interfaces/order-summary";
import { config } from "@/lib/config";
import { mockOrders } from "@/test-data/admi-mockOrders";
import { Loader2, PackageX } from "lucide-react";

const StorePage = () => {
  const [allOrders, setAllOrders] = useState<AdmiOrder[]>([]);
  const [sentOrders, setSentOrders] = useState<AdmiOrder[]>([]);
  const [printOrders, setPrintOrders] = useState<AdmiOrder[]>([]);
  const [packagesOrders, setPackagesOrders] = useState<AdmiOrder[]>([]);
  const [ongoingOrders, setOngoingOrders] = useState<AdmiOrder[]>([]);
  const [archiveOrders, setArchiveOrders] = useState<AdmiOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrders = async () => {
    setIsLoading(true);

    try {
      if (config.apiUrl) {
        const orders = await obtenerTodosPedidos();
        setAllOrders(orders);
      } else {
        setAllOrders(mockOrders);
      }
    } catch (error) {
      console.error("Error al cargar los pedidos:", error);
      setAllOrders(mockOrders);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    const getStatus = (order: AdmiOrder) => order.estado ?? order.status;
    setSentOrders(allOrders.filter((order) => getStatus(order) === "Enviado"));
    setPrintOrders(allOrders.filter((order) => getStatus(order) === "En Proceso"));
    setPackagesOrders(allOrders.filter((order) => getStatus(order) === "Pendiente"));
    setOngoingOrders(allOrders.filter((order) => getStatus(order) === "En Proceso"));
    setArchiveOrders(allOrders.filter((order) => getStatus(order) === "Entregado" || getStatus(order) === "Cancelado"));
  }, [allOrders]);

  const renderOrderList = (orders: AdmiOrder[], emptyMessage: string) => {
    if (orders.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
          <PackageX className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-base sm:text-lg text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {orders.map((order, index) => (
          <OrderCard key={order.orderId ?? order.id ?? `order-${index}`} order={order} onOrderUpdated={loadOrders} />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen p-2 sm:p-4 md:p-6">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-center text-primary">
        Control de Pedidos
      </h1>

      <Tabs defaultValue="all" className="w-full max-w-7xl mx-auto">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1 mb-4">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            Todos
          </TabsTrigger>
          <TabsTrigger value="ongoing" className="text-xs sm:text-sm">
            En proceso
          </TabsTrigger>
          <TabsTrigger value="print" className="text-xs sm:text-sm">
            Impresión
          </TabsTrigger>
          <TabsTrigger value="packages" className="text-xs sm:text-sm">
            Pendientes
          </TabsTrigger>
          <TabsTrigger value="sent" className="text-xs sm:text-sm">
            Enviados
          </TabsTrigger>
          <TabsTrigger value="archive" className="text-xs sm:text-sm">
            Archivo
          </TabsTrigger>
        </TabsList>

        <div className="bg-muted/30 rounded-xl p-2 sm:p-4 min-h-[60vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground mt-4">Cargando pedidos...</p>
            </div>
          ) : (
            <>
              <TabsContent value="all" className="m-0">
                {renderOrderList(allOrders, "No hay pedidos registrados")}
              </TabsContent>

              <TabsContent value="ongoing" className="m-0">
                {renderOrderList(ongoingOrders, "No hay pedidos en proceso")}
              </TabsContent>

              <TabsContent value="print" className="m-0">
                {renderOrderList(printOrders, "No hay pedidos en impresión")}
              </TabsContent>

              <TabsContent value="packages" className="m-0">
                {renderOrderList(packagesOrders, "No hay pedidos pendientes")}
              </TabsContent>

              <TabsContent value="sent" className="m-0">
                {renderOrderList(sentOrders, "No hay pedidos enviados")}
              </TabsContent>

              <TabsContent value="archive" className="m-0">
                {renderOrderList(archiveOrders, "No hay pedidos archivados")}
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default StorePage;
