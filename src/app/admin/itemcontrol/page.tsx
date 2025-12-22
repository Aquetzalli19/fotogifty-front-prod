"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import ItemCard from "@/components/admin/ItemCard";
import { obtenerTodosPaquetes } from "@/services/packages";
import { obtenerTodasCategorias } from "@/services/categories";
import { mockItems } from "@/test-data/admi-mockItems";
import { itemPackages } from "@/interfaces/admi-items";
import { mapPaquetesToItemPackages } from "@/lib/mappers/package-mapper";
import { config } from "@/lib/config";
import { useToast } from "@/hooks/useToast";
import { Toast, ToastContainer } from "@/components/ui/toast";
import { DeletePackageDialog } from "@/components/admin/DeletePackageDialog";

const Page = () => {
  const [items, setItems] = useState<itemPackages[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<itemPackages | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Toast notifications
  const { toasts, removeToast, success, error: showError } = useToast();

  // Cargar paquetes
  const loadPackages = async () => {
    setIsLoading(true);

    if (!config.apiUrl) {
      console.log("No API URL configured, using mock data");
      setItems(mockItems);
      setIsLoading(false);
      return;
    }

    try {
      // Cargar paquetes y categorías en paralelo
      const [paquetesResponse, categoriasResponse] = await Promise.all([
        obtenerTodosPaquetes(),
        obtenerTodasCategorias(),
      ]);

      if (paquetesResponse.success && paquetesResponse.data) {
        // Crear un mapa de categorías para fácil acceso
        const categoriasMap = new Map<number, string>();
        if (categoriasResponse.success && categoriasResponse.data) {
          categoriasResponse.data.forEach((cat) => {
            categoriasMap.set(cat.id, cat.nombre);
          });
        }

        // Mapear los paquetes al formato del frontend
        const mappedItems = mapPaquetesToItemPackages(
          paquetesResponse.data,
          categoriasMap
        );
        setItems(mappedItems);
      } else {
        console.warn("API call failed, using mock data");
        setItems(mockItems);
      }
    } catch (err) {
      console.error("Error loading packages, using mock data:", err);
      setItems(mockItems);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar al montar
  useEffect(() => {
    loadPackages();
  }, []);

  const allItems = items;
  const activeItems = items.filter((item) => item.itemStatus === true);
  const inactiveItems = items.filter((item) => item.itemStatus === false);

  const getFilteredItems = (filter: string) => {
    switch (filter) {
      case "active":
        return activeItems;
      case "inactive":
        return inactiveItems;
      case "all":
      default:
        return allItems;
    }
  };

  const handleDelete = (item: itemPackages) => {
    setSelectedPackage(item);
    setIsDeleteDialogOpen(true);
  };

  const handlePackageDeleted = () => {
    loadPackages();
  };

  const handlePackageUpdated = () => {
    loadPackages();
  };

  return (
    <>
      {/* Notificaciones */}
      <ToastContainer>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>

      <div className="p-2 md:p-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl text-primary text-center mb-4 md:mb-6">
          Administrar paquetes
        </h1>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="gap-0 space-y-0"
        >
          <div className="md:hidden mb-4 space-y-3 flex items-center flex-col px-2">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full bg-primary/10 text-base sm:text-lg text-primary">
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-base sm:text-lg">
                  Todos los productos
                </SelectItem>
                <SelectItem value="active" className="text-base sm:text-lg">
                  Productos activos
                </SelectItem>
                <SelectItem value="inactive" className="text-base sm:text-lg">
                  Productos inactivos
                </SelectItem>
              </SelectContent>
            </Select>
            <Link href="/admin/addItem" className="w-full">
              <Button className="text-sm sm:text-base w-full">
                <Plus className="mr-2 h-4 w-4" /> Añadir producto
              </Button>
            </Link>
          </div>

          <div className="hidden md:flex">
            <div className="overflow-x-auto scrollbar-hide">
              <TabsList className="w-full min-w-max flex space-x-2 pb-0">
                <TabsTrigger value="all">Todos los productos</TabsTrigger>
                <TabsTrigger value="active">Productos activos</TabsTrigger>
                <TabsTrigger value="inactive">Productos inactivos</TabsTrigger>
                <Link href="/admin/addItem">
                  <Button className="text-sm sm:text-lg w-64 sm:w-80 h-full">
                    <Plus className="mr-2 h-4 w-4" /> Añadir producto
                  </Button>
                </Link>
              </TabsList>
            </div>
          </div>

          <div className="w-full md:-mt-2">
            <div className="w-full min-h-[60vh] sm:min-h-[70vh] md:min-h-[80vh] bg-dark rounded-2xl rounded-t-none p-2 sm:p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {activeTab === "all" && (
                    <TabsContent value="all" className="m-0">
                      <div className="flex flex-col gap-2 sm:gap-4">
                        {getFilteredItems("all").length === 0 ? (
                          <div className="text-center py-8 sm:py-12 border-2 border-dashed rounded-lg mx-2">
                            <p className="text-base sm:text-lg text-muted-foreground">
                              No hay paquetes disponibles
                            </p>
                            <Link href="/admin/addItem">
                              <Button variant="outline" className="mt-4 text-sm sm:text-base">
                                <Plus className="h-4 w-4 mr-2" />
                                Crear primer paquete
                              </Button>
                            </Link>
                          </div>
                        ) : (
                          getFilteredItems("all").map((item) => (
                            <ItemCard
                              key={item.id}
                              item={item}
                              onDelete={handleDelete}
                              onUpdate={handlePackageUpdated}
                            />
                          ))
                        )}
                      </div>
                    </TabsContent>
                  )}
                  {activeTab === "active" && (
                    <TabsContent value="active" className="m-0">
                      <div className="flex flex-col gap-2 sm:gap-4">
                        {getFilteredItems("active").length === 0 ? (
                          <div className="text-center py-8 sm:py-12 border-2 border-dashed rounded-lg mx-2">
                            <p className="text-base sm:text-lg text-muted-foreground">
                              No hay paquetes activos
                            </p>
                          </div>
                        ) : (
                          getFilteredItems("active").map((item) => (
                            <ItemCard
                              key={item.id}
                              item={item}
                              onDelete={handleDelete}
                              onUpdate={handlePackageUpdated}
                            />
                          ))
                        )}
                      </div>
                    </TabsContent>
                  )}
                  {activeTab === "inactive" && (
                    <TabsContent value="inactive" className="m-0">
                      <div className="flex flex-col gap-2 sm:gap-4">
                        {getFilteredItems("inactive").length === 0 ? (
                          <div className="text-center py-8 sm:py-12 border-2 border-dashed rounded-lg mx-2">
                            <p className="text-base sm:text-lg text-muted-foreground">
                              No hay paquetes inactivos
                            </p>
                          </div>
                        ) : (
                          getFilteredItems("inactive").map((item) => (
                            <ItemCard
                              key={item.id}
                              item={item}
                              onDelete={handleDelete}
                              onUpdate={handlePackageUpdated}
                            />
                          ))
                        )}
                      </div>
                    </TabsContent>
                  )}
                </>
              )}
            </div>
          </div>
        </Tabs>
      </div>

      {/* Diálogo de eliminación */}
      <DeletePackageDialog
        package={selectedPackage}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onPackageDeleted={handlePackageDeleted}
        onShowToast={(message, type) =>
          type === "success" ? success(message) : showError(message)
        }
      />
    </>
  );
};

export default Page;
