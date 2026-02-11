"use client";

import { useEffect, useState } from "react";
import { EstadoPedido, CrearEstadoPedidoDTO } from "@/interfaces/estado-pedido";
import {
  obtenerEstadosPedido,
  crearEstadoPedido,
  actualizarEstadoPedido,
  eliminarEstadoPedido,
} from "@/services/estados-pedido";
import { EstadoBadge } from "@/components/EstadoBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import { Toast, ToastContainer } from "@/components/ui/toast";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  AlertCircle,
} from "lucide-react";

export default function EstadosPedidoAdmin() {
  const [estados, setEstados] = useState<EstadoPedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState<CrearEstadoPedidoDTO>({
    nombre: "",
    descripcion: "",
    color: "#2196F3",
    orden: 0,
  });

  const { toasts, removeToast, success, error: showError } = useToast();

  // Cargar estados
  const cargar = async () => {
    setIsLoading(true);
    try {
      const response = await obtenerEstadosPedido(true); // Incluir inactivos
      if (response.success && response.data) {
        setEstados(response.data);
      }
    } catch (err: unknown) {
      console.error("Error cargando estados:", err);
      showError("Error al cargar los estados de pedido");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleOpenDialog = (estado?: EstadoPedido) => {
    if (estado) {
      // Editar
      setEditingId(estado.id);
      setForm({
        nombre: estado.nombre,
        descripcion: estado.descripcion || "",
        color: estado.color || "#2196F3",
        orden: estado.orden,
      });
    } else {
      // Crear nuevo
      setEditingId(null);
      // Calcular siguiente orden disponible
      const maxOrden = estados.length > 0 ? Math.max(...estados.map((e) => e.orden)) : 0;
      setForm({
        nombre: "",
        descripcion: "",
        color: "#2196F3",
        orden: maxOrden + 1,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setForm({
      nombre: "",
      descripcion: "",
      color: "#2196F3",
      orden: 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      showError("El nombre del estado es requerido");
      return;
    }

    setIsSubmitting(true);
    try {
      let response;
      if (editingId) {
        response = await actualizarEstadoPedido(editingId, form);
        success(`Estado "${form.nombre}" actualizado exitosamente`);
      } else {
        response = await crearEstadoPedido(form);
        success(`Estado "${form.nombre}" creado exitosamente`);
      }

      if (response.success) {
        handleCloseDialog();
        cargar();
      }
    } catch (err: unknown) {
      console.error("Error guardando estado:", err);
      showError(err instanceof Error ? err.message : "Error al guardar el estado");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (estado: EstadoPedido) => {
    if (!confirm(`¿Estás seguro de eliminar el estado "${estado.nombre}"?\n\nEsta acción no se puede deshacer y fallará si hay pedidos asociados.`)) {
      return;
    }

    try {
      const response = await eliminarEstadoPedido(estado.id);
      if (response.success) {
        success(`Estado "${estado.nombre}" eliminado exitosamente`);
        cargar();
      }
    } catch (err: unknown) {
      console.error("Error eliminando estado:", err);
      showError(err instanceof Error ? err.message : "No se puede eliminar: hay pedidos asociados a este estado");
    }
  };

  const toggleActivo = async (estado: EstadoPedido) => {
    try {
      const response = await actualizarEstadoPedido(estado.id, {
        activo: !estado.activo,
      });

      if (response.success) {
        success(
          `Estado "${estado.nombre}" ${!estado.activo ? "activado" : "desactivado"}`
        );
        cargar();
      }
    } catch (err: unknown) {
      console.error("Error cambiando estado activo:", err);
      showError(err instanceof Error ? err.message : "Error al cambiar el estado");
    }
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

      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">
              Estados de Pedido
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona los estados disponibles para los pedidos
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Estado
          </Button>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Estados dinámicos del sistema</p>
                <p>
                  Los estados que configures aquí estarán disponibles en todo el
                  sistema. El orden determina el flujo del pedido. No puedes
                  eliminar estados con pedidos asociados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Estados */}
        <Card>
          <CardHeader>
            <CardTitle>Estados Registrados ({estados.length})</CardTitle>
            <CardDescription>
              Lista de todos los estados disponibles en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : estados.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">
                  No hay estados configurados
                </p>
                <Button onClick={() => handleOpenDialog()} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Estado
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Orden</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="hidden md:table-cell">Descripción</TableHead>
                      <TableHead className="w-24">Activo</TableHead>
                      <TableHead className="w-32 text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estados.map((estado) => (
                      <TableRow
                        key={estado.id}
                        className={!estado.activo ? "opacity-50" : ""}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{estado.orden}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <EstadoBadge nombre={estado.nombre} color={estado.color} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-md truncate">
                          {estado.descripcion || "—"}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={estado.activo}
                            onCheckedChange={() => toggleActivo(estado)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(estado)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(estado)}
                              title="Eliminar"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Crear/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Estado" : "Nuevo Estado"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Modifica la información del estado"
                  : "Crea un nuevo estado para los pedidos"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  Nombre del Estado <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(e) =>
                    setForm({ ...form, nombre: e.target.value })
                  }
                  placeholder="Ej: Pendiente, Imprimiendo..."
                  required
                />
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción (opcional)</Label>
                <Textarea
                  id="descripcion"
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm({ ...form, descripcion: e.target.value })
                  }
                  placeholder="Describe el estado..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Color y Orden */}
              <div className="grid grid-cols-2 gap-4">
                {/* Color */}
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="color"
                      type="color"
                      value={form.color || "#2196F3"}
                      onChange={(e) =>
                        setForm({ ...form, color: e.target.value })
                      }
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={form.color || "#2196F3"}
                      onChange={(e) =>
                        setForm({ ...form, color: e.target.value })
                      }
                      placeholder="#2196F3"
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Orden */}
                <div className="space-y-2">
                  <Label htmlFor="orden">Orden</Label>
                  <Input
                    id="orden"
                    type="number"
                    min="0"
                    value={form.orden}
                    onChange={(e) =>
                      setForm({ ...form, orden: Number(e.target.value) })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Define la secuencia
                  </p>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Vista Previa</Label>
                <div className="border rounded-lg p-4 bg-muted/20 flex items-center justify-center">
                  <EstadoBadge
                    nombre={form.nombre || "Ejemplo"}
                    color={form.color}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingId ? "Guardar Cambios" : "Crear Estado"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
