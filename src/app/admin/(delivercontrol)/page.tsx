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
import { obtenerEstadosPedido } from "@/services/estados-pedido";
import { AdmiOrder } from "@/interfaces/order-summary";
import { EstadoPedido } from "@/interfaces/estado-pedido";
import { config } from "@/lib/config";
import { mockOrders } from "@/test-data/admi-mockOrders";
import { Loader2, PackageX } from "lucide-react";

const Page = () => {
  const [allOrders, setAllOrders] = useState<AdmiOrder[]>([]);
  const [estados, setEstados] = useState<EstadoPedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEstados, setIsLoadingEstados] = useState(true);
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

  // Cargar estados disponibles
  useEffect(() => {
    const loadEstados = async () => {
      setIsLoadingEstados(true);
      try {
        const response = await obtenerEstadosPedido(false); // Solo activos
        if (response.success && response.data) {
          // Ordenar por campo 'orden'
          const sortedEstados = response.data.sort((a, b) => a.orden - b.orden);
          setEstados(sortedEstados);
        }
      } catch (error) {
        console.error("Error al cargar estados:", error);
      } finally {
        setIsLoadingEstados(false);
      }
    };
    loadEstados();
  }, []);

  // Cargar pedidos al montar
  useEffect(() => {
    loadOrders();
  }, []);

  // Helper para obtener estado de pedido
  const getStatus = (order: AdmiOrder) => order.estado ?? order.status;

  // COMPUTAR DATOS DERIVADOS DURANTE RENDER usando useMemo
  // Filtros dinámicos basados en estados de la BD
  const ordersByEstado = useMemo(() => {
    const sortFn = (orders: AdmiOrder[]): AdmiOrder[] => {
      return [...orders].sort((a, b) => {
        const dateA = new Date(a.fecha_pedido).getTime();
        const dateB = new Date(b.fecha_pedido).getTime();
        // Más recientes = fechas más cercanas a hoy = timestamps mayores primero
        return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
      });
    };

    // Crear objeto con "all" + un filtro por cada estado
    const result: Record<string, AdmiOrder[]> = {
      all: sortFn(allOrders),
    };

    // Generar filtros dinámicos para cada estado
    estados.forEach((estado) => {
      const tabKey = estado.nombre.toLowerCase().replace(/\s+/g, "-");
      result[tabKey] = sortFn(
        allOrders.filter((order) => getStatus(order) === estado.nombre)
      );
    });

    return result;
  }, [allOrders, estados, sortOrder]);

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
              {estados.map((estado) => {
                const tabKey = estado.nombre.toLowerCase().replace(/\s+/g, "-");
                return (
                  <SelectItem key={estado.id} value={tabKey} className="text-base sm:text-lg">
                    {estado.nombre}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="hidden md:flex">
          <div className="overflow-x-auto scrollbar-hide">
            <TabsList className="w-full min-w-max flex space-x-2 pb-0 transition-all">
              <TabsTrigger value="all">Todos</TabsTrigger>
              {estados.map((estado) => {
                const tabKey = estado.nombre.toLowerCase().replace(/\s+/g, "-");
                return (
                  <TabsTrigger key={estado.id} value={tabKey}>
                    {estado.nombre}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        </div>

        <div className="w-full md:-mt-2">
          <div className="w-full min-h-[60vh] sm:min-h-[70vh] md:min-h-[80vh] bg-dark rounded-2xl rounded-t-none p-2 sm:p-4">
            {isLoading || isLoadingEstados ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground mt-4">Cargando pedidos...</p>
              </div>
            ) : (
              <>
                {/* Tab "Todos" */}
                <TabsContent value="all" className="m-0">
                  {ordersByEstado.all?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
                      <PackageX className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-base sm:text-lg text-muted-foreground">No hay pedidos registrados</p>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-4">
                      {ordersByEstado.all?.map((order, index) => (
                        <OrderCard key={order.orderId ?? `order-${index}`} order={order} onOrderUpdated={loadOrders} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Tabs dinámicos por cada estado */}
                {estados.map((estado) => {
                  const tabKey = estado.nombre.toLowerCase().replace(/\s+/g, "-");
                  const orders = ordersByEstado[tabKey] || [];

                  return (
                    <TabsContent key={estado.id} value={tabKey} className="m-0">
                      {orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
                          <PackageX className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-base sm:text-lg text-muted-foreground">
                            No hay pedidos con estado &quot;{estado.nombre}&quot;
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 sm:space-y-4">
                          {orders.map((order, index) => (
                            <OrderCard
                              key={order.orderId ?? `${tabKey}-${index}`}
                              order={order}
                              onOrderUpdated={loadOrders}
                            />
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default Page;
