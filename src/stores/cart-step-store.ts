import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartStepState {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  resetStep: () => void;
}

export const useCartStepStore = create<CartStepState>()(
  persist(
    (set) => ({
      currentStep: 1,
      setCurrentStep: (step: number) => set({ currentStep: step }),
      resetStep: () => set({ currentStep: 1 }),
    }),
    {
      name: "cart-step-storage", // name of the item in the storage (must be unique)
    }
  )
);