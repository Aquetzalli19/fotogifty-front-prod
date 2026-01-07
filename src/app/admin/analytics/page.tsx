"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Download,
  Loader2,
  Calendar,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";
import type { AnalyticsData, AnalyticsFilters, VentasPorCategoria, EstadoPedidos } from "@/interfaces/analytics";
import { obtenerTodosPedidos } from "@/services/pedidos";
import { obtenerTodasCategorias } from "@/services/categories";

// Colores para las gráficas
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d"];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [totalPedidosConsiderados, setTotalPedidosConsiderados] = useState(0);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    fechaInicio: getDefaultStartDate(),
    fechaFin: getDefaultEndDate(),
  });

  // Cargar datos
  useEffect(() => {
    loadAnalyticsData();
  }, [filters]);

  // Función para obtener analytics desde el backend
  async function loadAnalyticsData() {
    setLoading(true);
    try {
      // ✅ OPCIÓN 1: Usar endpoint de analytics del backend (cuando esté implementado)
      const analyticsService = await import('@/services/analytics');
      const data = await analyticsService.obtenerAnalytics(filters);

      if (data) {
        setAnalyticsData(data);
        setUsingFallback(false);
        setLoading(false);
        return;
      }

      // ⚠️ FALLBACK: Si el endpoint no existe, calcular desde pedidos
      console.warn('⚠️ Endpoint de analytics no disponible, calculando desde pedidos...');
      setUsingFallback(true);
      await loadAnalyticsFromPedidos();
    } catch (error) {
      console.error('Error al cargar analytics desde backend:', error);
      // Si falla, usar fallback
      setUsingFallback(true);
      await loadAnalyticsFromPedidos();
    }
  }

  // Función fallback: calcular analytics desde los pedidos (temporal)
  async function loadAnalyticsFromPedidos() {
    try {
      // Obtener todos los pedidos
      const pedidos = await obtenerTodosPedidos();

      // Filtrar por rango de fechas
      const pedidosFiltrados = pedidos.filter((pedido) => {
        const fechaPedido = new Date(pedido.fecha_pedido || pedido.creado_en || "");
        const fechaInicio = new Date(filters.fechaInicio);
        const fechaFin = new Date(filters.fechaFin);
        return fechaPedido >= fechaInicio && fechaPedido <= fechaFin;
      });

      console.log(`📊 Pedidos en rango de fechas: ${pedidosFiltrados.length} de ${pedidos.length} totales`);

      // Solo pedidos pagados y completados (incluyendo En Proceso para ver pedidos recientes)
      const pedidosPagados = pedidosFiltrados.filter(
        (p) => p.estado_pago === "pagado" ||
               p.estado === "Entregado" ||
               p.estado === "Enviado" ||
               p.estado === "En Proceso" ||
               p.estado === "Imprimiendo" ||
               p.estado === "Empaquetado"
      );

      console.log(`💰 Pedidos válidos para analytics: ${pedidosPagados.length} de ${pedidosFiltrados.length} filtrados`);
      setTotalPedidosConsiderados(pedidosPagados.length);

      // Calcular KPIs
      const ventasTotales = pedidosPagados.reduce((sum, p) => sum + (p.total || 0), 0);
      const numeroPedidos = pedidosPagados.length;
      const ticketPromedio = numeroPedidos > 0 ? ventasTotales / numeroPedidos : 0;

      // Ventas por día
      const ventasPorDiaMap = new Map<string, { ventas: number; pedidos: number }>();
      pedidosPagados.forEach((pedido) => {
        const fecha = new Date(pedido.fecha_pedido || pedido.creado_en || "").toISOString().split("T")[0];
        const current = ventasPorDiaMap.get(fecha) || { ventas: 0, pedidos: 0 };
        ventasPorDiaMap.set(fecha, {
          ventas: current.ventas + (pedido.total || 0),
          pedidos: current.pedidos + 1,
        });
      });

      const ventasPorDia = Array.from(ventasPorDiaMap.entries())
        .map(([fecha, data]) => ({
          fecha,
          ventas: data.ventas,
          pedidos: data.pedidos,
        }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha));

      // Productos más vendidos
      const productosMap = new Map<number, {
        id_paquete: number;
        nombre_paquete: string;
        categoria_paquete: string;
        cantidad: number;
        ingresos: number;
      }>();

      pedidosPagados.forEach((pedido) => {
        (pedido.items_pedido || []).forEach((item) => {
          const current = productosMap.get(item.id_paquete) || {
            id_paquete: item.id_paquete,
            nombre_paquete: item.nombre_paquete,
            categoria_paquete: item.categoria_paquete,
            cantidad: 0,
            ingresos: 0,
          };
          productosMap.set(item.id_paquete, {
            ...current,
            cantidad: current.cantidad + (item.cantidad || 1),
            ingresos: current.ingresos + (item.precio_unitario * (item.cantidad || 1)),
          });
        });
      });

      const productosTopVentas = Array.from(productosMap.values())
        .sort((a, b) => b.ingresos - a.ingresos)
        .slice(0, 10);

      // Ventas por categoría
      const categoriasMap = new Map<string, { ventas: number; pedidos: number }>();
      pedidosPagados.forEach((pedido) => {
        (pedido.items_pedido || []).forEach((item) => {
          const categoria = item.categoria_paquete || "Sin categoría";
          const current = categoriasMap.get(categoria) || { ventas: 0, pedidos: 0 };
          categoriasMap.set(categoria, {
            ventas: current.ventas + (item.precio_unitario * (item.cantidad || 1)),
            pedidos: current.pedidos + 1,
          });
        });
      });

      const totalVentasCategorias = Array.from(categoriasMap.values()).reduce(
        (sum, cat) => sum + cat.ventas,
        0
      );

      const ventasPorCategoria = Array.from(categoriasMap.entries()).map(([categoria, data]) => ({
        categoria,
        ventas: data.ventas,
        pedidos: data.pedidos,
        porcentaje: totalVentasCategorias > 0 ? (data.ventas / totalVentasCategorias) * 100 : 0,
      }));

      // Estados de pedidos
      const estadosMap = new Map<string, number>();
      pedidosFiltrados.forEach((pedido) => {
        const estado = pedido.estado || "Pendiente";
        estadosMap.set(estado, (estadosMap.get(estado) || 0) + 1);
      });

      const totalPedidos = pedidosFiltrados.length;
      const estadosPedidos = Array.from(estadosMap.entries()).map(([estado, cantidad]) => ({
        estado,
        cantidad,
        porcentaje: totalPedidos > 0 ? (cantidad / totalPedidos) * 100 : 0,
      }));

      // Guardar datos
      setAnalyticsData({
        kpis: {
          ventasTotales,
          numeroPedidos,
          ticketPromedio,
          tasaCrecimiento: 0, // TODO: calcular vs período anterior
        },
        ventasPorDia,
        productosTopVentas,
        ventasPorCategoria,
        estadosPedidos,
      });
    } catch (error) {
      console.error("Error al cargar analytics desde pedidos:", error);
    } finally {
      setLoading(false);
    }
  }

  // Exportar a Excel
  const handleExportExcel = async () => {
    try {
      const pedidos = await obtenerTodosPedidos();

      // Crear workbook
      const wb = XLSX.utils.book_new();

      // Hoja 1: KPIs
      if (analyticsData?.kpis) {
        const kpisData = [
          ["KPI", "Valor"],
          ["Ventas Totales", `$${analyticsData.kpis.ventasTotales.toFixed(2)} MXN`],
          ["Número de Pedidos", analyticsData.kpis.numeroPedidos],
          ["Ticket Promedio", `$${analyticsData.kpis.ticketPromedio.toFixed(2)} MXN`],
        ];
        const wsKPIs = XLSX.utils.aoa_to_sheet(kpisData);
        XLSX.utils.book_append_sheet(wb, wsKPIs, "KPIs");
      }

      // Hoja 2: Pedidos Completos
      const pedidosData = pedidos.map((p) => ({
        "ID Pedido": p.id,
        Fecha: new Date(p.fecha_pedido || p.creado_en || "").toLocaleDateString("es-MX"),
        Cliente: p.nombre_cliente,
        Email: p.email_cliente,
        Estado: p.estado,
        "Estado Pago": p.estado_pago,
        Subtotal: p.subtotal || 0,
        IVA: p.iva || 0,
        Total: p.total || 0,
      }));
      const wsPedidos = XLSX.utils.json_to_sheet(pedidosData);
      XLSX.utils.book_append_sheet(wb, wsPedidos, "Pedidos");

      // Hoja 3: Ventas por Producto
      if (analyticsData?.productosTopVentas) {
        const productosData = analyticsData.productosTopVentas.map((p) => ({
          Producto: p.nombre_paquete,
          Categoría: p.categoria_paquete,
          Cantidad: p.cantidad,
          Ingresos: `$${p.ingresos.toFixed(2)} MXN`,
        }));
        const wsProductos = XLSX.utils.json_to_sheet(productosData);
        XLSX.utils.book_append_sheet(wb, wsProductos, "Ventas por Producto");
      }

      // Hoja 4: Ventas por Categoría
      if (analyticsData?.ventasPorCategoria) {
        const categoriasData = analyticsData.ventasPorCategoria.map((c) => ({
          Categoría: c.categoria,
          Ventas: `$${c.ventas.toFixed(2)} MXN`,
          Pedidos: c.pedidos,
          Porcentaje: `${c.porcentaje.toFixed(2)}%`,
        }));
        const wsCategorias = XLSX.utils.json_to_sheet(categoriasData);
        XLSX.utils.book_append_sheet(wb, wsCategorias, "Ventas por Categoría");
      }

      // Descargar archivo
      const fileName = `analytics-${filters.fechaInicio}-${filters.fechaFin}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Error al exportar Excel:", error);
      alert("Error al exportar Excel");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Analytics del Negocio
          </h1>
          <p className="text-muted-foreground mt-1">
            Análisis de ventas y rendimiento del negocio
          </p>
          {usingFallback && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              ⚠️ Usando cálculo local (endpoint backend no disponible) - {totalPedidosConsiderados} pedidos considerados
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={() => loadAnalyticsData()} variant="outline" size="lg">
            <Loader2 className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refrescar
          </Button>
          <Button onClick={handleExportExcel} size="lg">
            <Download className="mr-2 h-4 w-4" />
            Exportar a Excel
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label>Fecha Inicio</Label>
            <input
              type="date"
              value={filters.fechaInicio}
              onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="flex-1">
            <Label>Fecha Fin</Label>
            <input
              type="date"
              value={filters.fechaFin}
              onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="flex-1">
            <Label>Período Rápido</Label>
            <Select
              onValueChange={(value) => {
                const today = new Date();
                const start = new Date();

                switch (value) {
                  case "7days":
                    start.setDate(today.getDate() - 7);
                    break;
                  case "30days":
                    start.setDate(today.getDate() - 30);
                    break;
                  case "90days":
                    start.setDate(today.getDate() - 90);
                    break;
                  case "year":
                    start.setFullYear(today.getFullYear() - 1);
                    break;
                }

                setFilters({
                  ...filters,
                  fechaInicio: start.toISOString().split("T")[0],
                  fechaFin: today.toISOString().split("T")[0],
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Últimos 7 días</SelectItem>
                <SelectItem value="30days">Último mes</SelectItem>
                <SelectItem value="90days">Últimos 3 meses</SelectItem>
                <SelectItem value="year">Último año</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analyticsData?.kpis.ventasTotales || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              En el período seleccionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Número de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.kpis.numeroPedidos || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pedidos completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analyticsData?.kpis.ticketPromedio || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Por pedido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Productos Vendidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.productosTopVentas.reduce((sum, p) => sum + p.cantidad, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unidades totales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por Día */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas por Día</CardTitle>
            <CardDescription>Evolución diaria de ventas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData?.ventasPorDia || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Line type="monotone" dataKey="ventas" stroke="#8884d8" name="Ventas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ventas por Producto */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Productos</CardTitle>
            <CardDescription>Productos más vendidos por ingresos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData?.productosTopVentas || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre_paquete" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="ingresos" fill="#82ca9d" name="Ingresos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ventas por Categoría */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas por Categoría</CardTitle>
            <CardDescription>Distribución de ventas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData?.ventasPorCategoria || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: { payload?: VentasPorCategoria }) =>
                    props.payload ? `${props.payload.categoria}: ${props.payload.porcentaje.toFixed(1)}%` : ''
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="ventas"
                >
                  {(analyticsData?.ventasPorCategoria || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Estados de Pedidos */}
        <Card>
          <CardHeader>
            <CardTitle>Estados de Pedidos</CardTitle>
            <CardDescription>Distribución por estado</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData?.estadosPedidos || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="cantidad"
                  label={(props: { payload?: EstadoPedidos }) =>
                    props.payload ? `${props.payload.estado}: ${props.payload.porcentaje.toFixed(1)}%` : ''
                  }
                >
                  {(analyticsData?.estadosPedidos || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Productos */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Productos Vendidos</CardTitle>
          <CardDescription>Todos los productos ordenados por ingresos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">#</th>
                  <th className="text-left p-2">Producto</th>
                  <th className="text-left p-2">Categoría</th>
                  <th className="text-right p-2">Cantidad</th>
                  <th className="text-right p-2">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {(analyticsData?.productosTopVentas || []).map((producto, index) => (
                  <tr key={producto.id_paquete} className="border-b hover:bg-muted/50">
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2 font-medium">{producto.nombre_paquete}</td>
                    <td className="p-2">{producto.categoria_paquete}</td>
                    <td className="p-2 text-right">{producto.cantidad}</td>
                    <td className="p-2 text-right font-semibold">
                      {formatCurrency(producto.ingresos)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function getDefaultStartDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 1); // Último mes
  return date.toISOString().split("T")[0];
}

function getDefaultEndDate(): string {
  return new Date().toISOString().split("T")[0];
}
