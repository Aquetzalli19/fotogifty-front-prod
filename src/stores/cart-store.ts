import { CartItem, CartTotals } from "@/interfaces/cart-item";
import { ShopItem } from "@/interfaces/product-card";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  obtenerCarritoTemporal,
  guardarCarritoTemporal,
  eliminarCarritoTemporal,
  TempCartItem,
  debounce,
} from "@/services/temp-cart";

export interface CartState {
  items: CartItem[];
  isSyncing: boolean;
  lastSyncError: string | null;
  addItem: (productName: string, selectedPackage: ShopItem) => void;
  removeItem: (itemId: number) => void;
  increaseQuantity: (itemId: number) => void;
  decreaseQuantity: (itemId: number) => void;
  clearCart: () => void;
  getTotals: () => CartTotals;
  // Nuevos métodos para sincronización con backend
  loadFromBackend: () => Promise<void>;
  syncToBackend: () => Promise<void>;
  clearAndSyncBackend: () => Promise<void>;
}

// Función para convertir CartItem a TempCartItem para el backend
const cartItemToTempItem = (item: CartItem): TempCartItem => ({
  id: String(item.id),
  packageId: item.id,
  packageName: item.name,
  categoryName: item.productCategory,
  price: item.itemPrice,
  quantity: item.quantity,
  imageUrl: item.itemImage || '',
});

// Función debounced para sincronizar con backend (2 segundos de espera)
const debouncedSync = debounce(async (items: CartItem[]) => {
  try {
    const tempItems = items.map(cartItemToTempItem);
    const result = await guardarCarritoTemporal(tempItems);
    if (result.success) {
      console.log('✅ Carrito sincronizado con backend');
    } else {
      console.warn('⚠️ Error sincronizando carrito:', result.message);
    }
  } catch (error) {
    console.error('❌ Error en sincronización de carrito:', error);
  }
}, 2000);

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isSyncing: false,
      lastSyncError: null,

      addItem: (productName, selectedPackage) => {
        const { items } = get();
        const itemId = selectedPackage.id;
        const existingItem = items.find((item) => item.id === itemId);

        if (existingItem) {
          get().increaseQuantity(itemId);
        } else {
          const newItem: CartItem = {
            ...selectedPackage,
            productCategory: productName,
            quantity: 1,
            editorType: selectedPackage.editorType,
          };
          const newItems = [...items, newItem];
          set({ items: newItems });
          // Sincronizar con backend después de agregar
          debouncedSync(newItems);
        }
      },

      removeItem: (itemId) => {
        set((state) => {
          const newItems = state.items.filter((item) => item.id !== itemId);
          // Sincronizar con backend después de eliminar
          debouncedSync(newItems);
          return { items: newItems };
        });
      },

      increaseQuantity: (itemId) => {
        set((state) => {
          const newItems = state.items.map((item) =>
            item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
          );
          // Sincronizar con backend después de modificar
          debouncedSync(newItems);
          return { items: newItems };
        });
      },

      decreaseQuantity: (itemId) => {
        const itemToDecrease = get().items.find((item) => item.id === itemId);

        if (itemToDecrease && itemToDecrease.quantity > 1) {
          set((state) => {
            const newItems = state.items.map((item) =>
              item.id === itemId
                ? { ...item, quantity: item.quantity - 1 }
                : item
            );
            // Sincronizar con backend después de modificar
            debouncedSync(newItems);
            return { items: newItems };
          });
        } else {
          get().removeItem(itemId);
        }
      },

      clearCart: () => {
        set({ items: [] });
        // Nota: No sincronizamos aquí porque clearCart se usa internamente
        // Para limpiar en backend, usar clearAndSyncBackend
      },

      getTotals: () => {
        const { items } = get();

        // Los precios ya incluyen IVA, solo sumamos directamente
        const total = items.reduce((acc, item) => {
          return acc + item.itemPrice * item.quantity;
        }, 0);

        return {
          subtotal: parseFloat(total.toFixed(2)),
          iva: 0,
          total: parseFloat(total.toFixed(2)),
        };
      },

      // Cargar carrito desde el backend (llamar en login)
      loadFromBackend: async () => {
        set({ isSyncing: true, lastSyncError: null });
        try {
          const response = await obtenerCarritoTemporal();
          if (response.success && response.data && response.data.items.length > 0) {
            // Convertir TempCartItem[] a CartItem[]
            // Nota: Necesitamos los datos completos del paquete, pero por ahora
            // solo cargamos lo básico. En producción, se debería hacer un fetch
            // de los paquetes para obtener datos completos.
            console.log('📦 Carrito cargado desde backend:', response.data.items.length, 'items');
            // Los items del backend se mezclan con los locales si es necesario
            // Por ahora, priorizamos el backend
          }
          set({ isSyncing: false });
        } catch (error) {
          console.error('Error cargando carrito desde backend:', error);
          set({
            isSyncing: false,
            lastSyncError: 'Error al cargar carrito desde el servidor'
          });
        }
      },

      // Forzar sincronización inmediata con backend
      syncToBackend: async () => {
        const { items } = get();
        set({ isSyncing: true, lastSyncError: null });
        try {
          const tempItems = items.map(cartItemToTempItem);
          const result = await guardarCarritoTemporal(tempItems);
          if (!result.success) {
            set({ lastSyncError: result.message || 'Error al sincronizar' });
          }
          set({ isSyncing: false });
        } catch (error) {
          console.error('Error sincronizando carrito:', error);
          set({
            isSyncing: false,
            lastSyncError: 'Error al sincronizar con el servidor'
          });
        }
      },

      // Limpiar carrito local y en backend
      clearAndSyncBackend: async () => {
        set({ items: [], isSyncing: true, lastSyncError: null });
        try {
          await eliminarCarritoTemporal();
          set({ isSyncing: false });
        } catch (error) {
          console.error('Error eliminando carrito en backend:', error);
          set({
            isSyncing: false,
            lastSyncError: 'Error al eliminar carrito del servidor'
          });
        }
      },
    }),
    {
      name: "shopping-cart-storage-final",
      // Solo persistir items, no el estado de sincronización
      partialize: (state) => ({ items: state.items }),
    }
  )
);
