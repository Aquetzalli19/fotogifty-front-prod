"use client";

import { Separator } from "@/components/ui/separator";
import { OrderCard } from "@/components/user/backlog/OrderCard";
import { AdmiOrder } from "@/interfaces/order-summary";
import { obtenerPedidosUsuario } from "@/services/pedidos";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, PackageX, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BacklogPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<AdmiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await obtenerPedidosUsuario(user.id);
        setOrders(data);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("No se pudieron cargar los pedidos. Por favor, intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, isAuthenticated, router]);

  // Show loading while checking auth
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-8 md:px-12 lg:px-20 py-8 sm:py-12 space-y-6 sm:space-y-8">
      <div className="space-y-4">
        <h1 className="text-primary text-2xl sm:text-3xl md:text-4xl font-semibold">
          Historial de pedidos
        </h1>
        <Separator />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando tus pedidos...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-destructive text-center">{error}</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </Button>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <PackageX className="h-16 w-16 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h2 className="text-xl font-medium text-foreground">
              No tienes pedidos aún
            </h2>
            <p className="text-muted-foreground">
              Cuando realices tu primera compra, aparecerá aquí.
            </p>
          </div>
          <Button
            onClick={() => router.push("/user")}
            className="mt-4"
          >
            Explorar productos
          </Button>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
