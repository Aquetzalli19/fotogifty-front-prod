import { CartItem, CartTotals } from "@/interfaces/cart-item";
import { ShopItem } from "@/interfaces/product-card";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const IVA_RATE = 0.16;

export interface CartState {
  items: CartItem[];
  addItem: (productName: string, selectedPackage: ShopItem) => void;
  removeItem: (itemId: number) => void;
  increaseQuantity: (itemId: number) => void;
  decreaseQuantity: (itemId: number) => void;
  clearCart: () => void;
  getTotals: () => CartTotals;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
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
            editorType: selectedPackage.editorType, // Preservar el tipo de editor
          };
          set({ items: [...items, newItem] });
        }
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
      },

      increaseQuantity: (itemId) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
          ),
        }));
      },

      decreaseQuantity: (itemId) => {
        const itemToDecrease = get().items.find((item) => item.id === itemId);

        if (itemToDecrease && itemToDecrease.quantity > 1) {
          set((state) => ({
            items: state.items.map((item) =>
              item.id === itemId
                ? { ...item, quantity: item.quantity - 1 }
                : item
            ),
          }));
        } else {
          get().removeItem(itemId);
        }
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotals: () => {
        const { items } = get();

        const subtotal = items.reduce((acc, item) => {
          return acc + item.itemPrice * item.quantity;
        }, 0);

        const iva = subtotal * IVA_RATE;
        const total = subtotal + iva;

        return {
          subtotal: parseFloat(subtotal.toFixed(2)),
          iva: parseFloat(iva.toFixed(2)),
          total: parseFloat(total.toFixed(2)),
        };
      },
    }),
    {
      name: "shopping-cart-storage-final",
    }
  )
);
