"use client";

import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import OrderCard from "@/components/admin/OrderCard";
import { obtenerTodosPedidos } from "@/services/pedidos";
import { AdmiOrder } from "@/interfaces/order-summary";
import { config } from "@/lib/config";
import { mockOrders } from "@/test-data/admi-mockOrders";
import { Loader2, PackageX } from "lucide-react";

const Page = () => {
  const [allOrders, setAllOrders] = useState<AdmiOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [activeTab, setActiveTab] = useState("all");

  // Función para cargar pedidos (extraída para poder llamarla desde callbacks)
  const loadOrders = async () => {
    setIsLoading(true);

    try {
      if (config.apiUrl) {
        // Usar la API real - obtenerTodosPedidos devuelve directamente AdmiOrder[]
        const orders = await obtenerTodosPedidos();
        setAllOrders(orders);
      } else {
        // Usar datos mock si no hay API configurada
        setAllOrders(mockOrders);
      }
    } catch (error) {
      console.error("Error al cargar los pedidos:", error);
      // En caso de error, usar datos mock
      setAllOrders(mockOrders);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar pedidos al montar
  useEffect(() => {
    loadOrders();
  }, []);

  // Helper para obtener estado de pedido
  const getStatus = (order: AdmiOrder) => order.estado ?? order.status;

  // COMPUTAR DATOS DERIVADOS DURANTE RENDER usando useMemo
  // Reemplaza múltiples estados + useEffect (anti-patrón)
  const { sortedAllOrders, pendingOrders, inProgressOrders, sentOrders, deliveredOrders, cancelledOrders } = useMemo(() => {
    const sortFn = (orders: AdmiOrder[]): AdmiOrder[] => {
      return [...orders].sort((a, b) => {
        const dateA = new Date(a.fecha_pedido).getTime();
        const dateB = new Date(b.fecha_pedido).getTime();
        // Más recientes = fechas más cercanas a hoy = timestamps mayores primero
        return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
      });
    };

    return {
      sortedAllOrders: sortFn(allOrders),
      pendingOrders: sortFn(allOrders.filter((order) => getStatus(order) === "Pendiente")),
      inProgressOrders: sortFn(allOrders.filter((order) => getStatus(order) === "En Proceso")),
      sentOrders: sortFn(allOrders.filter((order) => getStatus(order) === "Enviado")),
      deliveredOrders: sortFn(allOrders.filter((order) => getStatus(order) === "Entregado")),
      cancelledOrders: sortFn(allOrders.filter((order) => getStatus(order) === "Cancelado")),
    };
  }, [allOrders, sortOrder]);

  return (
    <div className="p-2 md:p-4">
      <h1 className="text-2xl sm:text-3xl md:text-4xl text-primary text-center mb-4 md:mb-6">
        Control de pedidos
      </h1>

      {/* Filtro de ordenamiento */}
      <div className="mb-4 flex justify-end px-2">
        <div className="w-full md:w-auto">
          <Select value={sortOrder} onValueChange={(value: "newest" | "oldest") => setSortOrder(value)}>
            <SelectTrigger className="w-full md:w-[200px] bg-background">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Más recientes</SelectItem>
              <SelectItem value="oldest">Más antiguos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="gap-0 space-y-0"
      >
        <div className="md:hidden mb-4 px-2">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full bg-primary/10 text-base sm:text-lg text-primary">
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-base sm:text-lg">
                Todos los pedidos
              </SelectItem>
              <SelectItem value="pending" className="text-base sm:text-lg">
                Pendientes
              </SelectItem>
              <SelectItem value="inprogress" className="text-base sm:text-lg">
                En Proceso
              </SelectItem>
              <SelectItem value="sent" className="text-base sm:text-lg">
                Enviados
              </SelectItem>
              <SelectItem value="delivered" className="text-base sm:text-lg">
                Entregados
              </SelectItem>
              <SelectItem value="cancelled" className="text-base sm:text-lg">
                Cancelados
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="hidden md:flex">
          <div className="overflow-x-auto scrollbar-hide">
            <TabsList className="w-full min-w-max flex space-x-2 pb-0 transition-all">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="pending">Pendientes</TabsTrigger>
              <TabsTrigger value="inprogress">En Proceso</TabsTrigger>
              <TabsTrigger value="sent">Enviados</TabsTrigger>
              <TabsTrigger value="delivered">Entregados</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelados</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="w-full md:-mt-2">
          <div className="w-full min-h-[60vh] sm:min-h-[70vh] md:min-h-[80vh] bg-dark rounded-2xl rounded-t-none p-2 sm:p-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground mt-4">Cargando pedidos...</p>
              </div>
            ) : (
              <>
                <TabsContent value="all" className="m-0">
                  {sortedAllOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
                      <PackageX className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-base sm:text-lg text-muted-foreground">No hay pedidos registrados</p>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-4">
                      {sortedAllOrders.map((order, index) => (
                        <OrderCard key={order.orderId ?? `order-${index}`} order={order} onOrderUpdated={loadOrders} />
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="pending" className="m-0">
                  {pendingOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
                      <PackageX className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-base sm:text-lg text-muted-foreground">No hay pedidos pendientes</p>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-4">
                      {pendingOrders.map((order, index) => (
                        <OrderCard key={order.orderId ?? `pending-${index}`} order={order} onOrderUpdated={loadOrders} />
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="inprogress" className="m-0">
                  {inProgressOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
                      <PackageX className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-base sm:text-lg text-muted-foreground">No hay pedidos en proceso</p>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-4">
                      {inProgressOrders.map((order, index) => (
                        <OrderCard key={order.orderId ?? `inprogress-${index}`} order={order} onOrderUpdated={loadOrders} />
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="sent" className="m-0">
                  {sentOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
                      <PackageX className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-base sm:text-lg text-muted-foreground">No hay pedidos enviados</p>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-4">
                      {sentOrders.map((order, index) => (
                        <OrderCard key={order.orderId ?? `sent-${index}`} order={order} onOrderUpdated={loadOrders} />
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="delivered" className="m-0">
                  {deliveredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
                      <PackageX className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-base sm:text-lg text-muted-foreground">No hay pedidos entregados</p>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-4">
                      {deliveredOrders.map((order, index) => (
                        <OrderCard key={order.orderId ?? `delivered-${index}`} order={order} onOrderUpdated={loadOrders} />
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="cancelled" className="m-0">
                  {cancelledOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
                      <PackageX className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-base sm:text-lg text-muted-foreground">No hay pedidos cancelados</p>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-4">
                      {cancelledOrders.map((order, index) => (
                        <OrderCard key={order.orderId ?? `cancelled-${index}`} order={order} onOrderUpdated={loadOrders} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default Page;
