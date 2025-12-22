"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryCard } from "@/components/admin/CategoryCard";
import { AddCategoryDialog } from "@/components/admin/AddCategoryDialog";
import { EditCategoryDialog } from "@/components/admin/EditCategoryDialog";
import { DeleteCategoryDialog } from "@/components/admin/DeleteCategoryDialog";
import { obtenerTodasCategorias, type Categoria } from "@/services/categories";
import { mockCategories } from "@/test-data/categories-mockdata";
import { config } from "@/lib/config";
import { useToast } from "@/hooks/useToast";
import { Toast, ToastContainer } from "@/components/ui/toast";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Estados de diálogos
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Categoria | null>(null);

  // Toast notifications
  const { toasts, removeToast, success, error } = useToast();

  // Cargar categorías
  const loadCategories = async () => {
    setIsLoading(true);

    if (!config.apiUrl) {
      console.log("No API URL configured, using mock data");
      setCategories(mockCategories);
      setFilteredCategories(mockCategories);
      setIsLoading(false);
      return;
    }

    try {
      console.log('Cargando categorías desde API...');
      const response = await obtenerTodasCategorias();
      console.log('Respuesta de categorías:', response);

      if (response.success && response.data) {
        console.log('Categorías cargadas:', response.data);
        setCategories(response.data);
        setFilteredCategories(response.data);
      } else {
        console.warn("API call failed, using mock data", response);
        setCategories(mockCategories);
        setFilteredCategories(mockCategories);
      }
    } catch (err) {
      console.error("Error loading categories, using mock data:", err);
      setCategories(mockCategories);
      setFilteredCategories(mockCategories);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar categorías
  useEffect(() => {
    let result = [...categories];

    // Filtro por búsqueda
    if (searchTerm) {
      result = result.filter(
        (cat) =>
          cat.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cat.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (statusFilter === "active") {
      result = result.filter((cat) => cat.activo);
    } else if (statusFilter === "inactive") {
      result = result.filter((cat) => !cat.activo);
    }

    setFilteredCategories(result);
  }, [searchTerm, statusFilter, categories]);

  // Cargar al montar
  useEffect(() => {
    loadCategories();
  }, []);

  // Handlers
  const handleEdit = (category: Categoria) => {
    setSelectedCategory(category);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (category: Categoria) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleCategoryCreated = () => {
    loadCategories();
  };

  const handleCategoryUpdated = () => {
    setStatusFilter("all"); // Mostrar todas las categorías después de actualizar
    loadCategories();
  };

  const handleCategoryDeleted = () => {
    loadCategories();
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

      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">
              Administrar Categorías
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Gestiona las categorías de tus productos
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Nueva Categoría
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar categorías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value: "all" | "active" | "inactive") =>
              setStatusFilter(value)
            }
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="active">Activas</SelectItem>
              <SelectItem value="inactive">Inactivas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Contador */}
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredCategories.length} de {categories.length}{" "}
          categorías
        </div>

        {/* Lista de categorías */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-8 sm:py-12 border-2 border-dashed rounded-lg">
            <p className="text-base sm:text-lg text-muted-foreground">
              No se encontraron categorías
            </p>
            {searchTerm || statusFilter !== "all" ? (
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Intenta ajustar los filtros
              </p>
            ) : (
              <Button
                variant="outline"
                className="mt-4 text-sm sm:text-base"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear primera categoría
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Diálogos */}
      <AddCategoryDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onCategoryCreated={handleCategoryCreated}
      />

      <EditCategoryDialog
        category={selectedCategory}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onCategoryUpdated={handleCategoryUpdated}
        onShowToast={(message, type) => (type === "success" ? success(message) : error(message))}
      />

      <DeleteCategoryDialog
        category={selectedCategory}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onCategoryDeleted={handleCategoryDeleted}
        onShowToast={(message, type) => (type === "success" ? success(message) : error(message))}
      />
    </>
  );
}
