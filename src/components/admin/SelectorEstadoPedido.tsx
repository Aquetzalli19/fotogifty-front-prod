"use client";

import { useEffect, useState } from "react";
import { EstadoPedido } from "@/interfaces/estado-pedido";
import {
  obtenerEstadosPedido,
  actualizarEstadoDePedido,
} from "@/services/estados-pedido";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface SelectorEstadoPedidoProps {
  pedidoId: number;
  estadoActual: string;
  onEstadoCambiado?: (nuevoEstado: string) => void;
  disabled?: boolean;
}

/**
 * Selector para cambiar el estado de un pedido
 * Carga estados dinámicamente desde la API
 */
export function SelectorEstadoPedido({
  pedidoId,
  estadoActual,
  onEstadoCambiado,
  disabled = false,
}: SelectorEstadoPedidoProps) {
  const [estados, setEstados] = useState<EstadoPedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingEstados, setIsLoadingEstados] = useState(true);
  const { success, error } = useToast();

  // Cargar estados disponibles
  useEffect(() => {
    const cargarEstados = async () => {
      setIsLoadingEstados(true);
      try {
        const response = await obtenerEstadosPedido(false); // Solo activos
        if (response.success && response.data) {
          setEstados(response.data);
        }
      } catch (err) {
        console.error("Error cargando estados:", err);
        error("Error al cargar los estados disponibles");
      } finally {
        setIsLoadingEstados(false);
      }
    };

    cargarEstados();
  }, [error]);

  const handleChange = async (nuevoEstado: string) => {
    if (nuevoEstado === estadoActual) return;

    setLoading(true);
    try {
      const response = await actualizarEstadoDePedido(pedidoId, nuevoEstado);

      if (response.success) {
        success(`Estado actualizado a: ${nuevoEstado}`);
        onEstadoCambiado?.(nuevoEstado);
      } else {
        error(response.message || "Error al actualizar el estado");
      }
    } catch (err: unknown) {
      console.error("Error actualizando estado:", err);
      error(err instanceof Error ? err.message : "Error al actualizar el estado del pedido");
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingEstados) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Cargando estados...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <Select
        value={estadoActual}
        onValueChange={handleChange}
        disabled={disabled || loading}
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Seleccionar estado" />
          {loading && (
            <Loader2 className="absolute right-8 h-4 w-4 animate-spin" />
          )}
        </SelectTrigger>
        <SelectContent>
          {estados.map((estado) => (
            <SelectItem key={estado.id} value={estado.nombre}>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: estado.color || "#9E9E9E" }}
                />
                <span>{estado.nombre}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
