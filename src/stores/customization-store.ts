import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EditorType } from "@/lib/category-utils";
import { Effect } from "@/lib/types";

// Tipos de personalización para cada editor

// Interfaz para cada imagen guardada en Standard
export interface SavedStandardImage {
  id: number;
  imageSrc: string; // Imagen ORIGINAL para permitir edición posterior (SE GUARDA EN LOCALSTORAGE)
  renderedImageSrc?: string; // Imagen RENDERIZADA (canvas con todas las transformaciones) - SE ENVÍA AL BACKEND (NO SE GUARDA, SE GENERA AL SUBIR)
  transformations: {
    scale: number;
    rotation: number;
    mirrorX: boolean;
    mirrorY: boolean;
    posX: number;
    posY: number;
  };
  effects: Effect[];
  canvasStyle: {
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  };
  selectedFilter: string;
  thumbnailDataUrl?: string; // Preview pequeño para la galería (NO SE GUARDA, SE GENERA AL MOSTRAR)
  // Dimensiones físicas y resolución para impresión correcta
  // OPCIONAL para compatibilidad con imágenes guardadas anteriormente (fallback: 4×6" a 300 DPI)
  printDimensions?: {
    widthInches: number;    // Ancho en pulgadas (ej: 4, 5, 8, 10)
    heightInches: number;   // Alto en pulgadas (ej: 6, 7, 10, 12)
    resolution: number;     // DPI para exportar (generalmente 300)
  };
}

export interface StandardCustomization {
  images: SavedStandardImage[];
  maxImages: number;
}

export interface CalendarCustomization {
  months: Array<{
    month: number;
    imageSrc: string | null; // Imagen ORIGINAL para permitir edición posterior (SE GUARDA EN LOCALSTORAGE)
    renderedImageSrc?: string; // CALENDARIO COMPLETO (con template) - Para preview/visualización (NO SE GUARDA, SE GENERA AL SUBIR)
    croppedPhotoSrc?: string; // SOLO ÁREA DE FOTO RECORTADA (sin template) - SE ENVÍA AL BACKEND (NO SE GUARDA, SE GENERA AL SUBIR)
    transformations: {
      scale: number;
      posX: number;
      posY: number;
    };
  }>;
}

export interface PolaroidCustomization {
  polaroids: Array<{
    id: number;
    imageSrc: string; // Imagen ORIGINAL para permitir edición posterior
    renderedImageSrc?: string; // Imagen RENDERIZADA (canvas con marco polaroid y transformaciones) - SE ENVÍA AL BACKEND
    transformations: {
      scale: number;
      posX: number;
      posY: number;
    };
    thumbnailDataUrl?: string;
    // Campos para polaroid doble (horizontal)
    isDouble?: boolean; // Si es polaroid doble (dos imágenes lado a lado)
    imageSrc2?: string; // Segunda imagen ORIGINAL (solo si isDouble === true)
    transformations2?: { // Transformaciones independientes para la segunda imagen
      scale: number;
      posX: number;
      posY: number;
    };
  }>;
  maxPolaroids: number;
}

// Interfaz principal de personalización
export interface Customization {
  cartItemId: number;
  instanceIndex: number; // Para manejar múltiples unidades del mismo item
  editorType: EditorType;
  data: StandardCustomization | CalendarCustomization | PolaroidCustomization;
  completed: boolean; // Si tiene todas las imágenes requeridas
  lastModified: number; // timestamp
}

// Estado del store
export interface CustomizationState {
  customizations: Customization[];

  // Obtener personalización específica
  getCustomization: (cartItemId: number, instanceIndex: number) => Customization | undefined;

  // Guardar o actualizar personalización
  saveCustomization: (customization: Omit<Customization, 'lastModified'>) => void;

  // Eliminar personalización
  removeCustomization: (cartItemId: number, instanceIndex: number) => void;

  // Eliminar todas las personalizaciones de un item del carrito
  removeAllForCartItem: (cartItemId: number) => void;

  // Verificar si una instancia está completa
  isInstanceComplete: (cartItemId: number, instanceIndex: number, requiredImages: number) => boolean;

  // Obtener progreso de una instancia (imágenes agregadas / requeridas)
  getInstanceProgress: (cartItemId: number, instanceIndex: number) => { current: number; total: number };

  // Limpiar todo
  clearAll: () => void;
}

export const useCustomizationStore = create<CustomizationState>()(
  persist(
    (set, get) => ({
      customizations: [],

      getCustomization: (cartItemId, instanceIndex) => {
        return get().customizations.find(
          (c) => c.cartItemId === cartItemId && c.instanceIndex === instanceIndex
        );
      },

      saveCustomization: (customization) => {
        const { customizations } = get();
        const existingIndex = customizations.findIndex(
          (c) =>
            c.cartItemId === customization.cartItemId &&
            c.instanceIndex === customization.instanceIndex
        );

        const newCustomization: Customization = {
          ...customization,
          lastModified: Date.now(),
        };

        if (existingIndex >= 0) {
          // Actualizar existente
          const updated = [...customizations];
          updated[existingIndex] = newCustomization;
          set({ customizations: updated });
        } else {
          // Agregar nuevo
          set({ customizations: [...customizations, newCustomization] });
        }
      },

      removeCustomization: (cartItemId, instanceIndex) => {
        set((state) => ({
          customizations: state.customizations.filter(
            (c) => !(c.cartItemId === cartItemId && c.instanceIndex === instanceIndex)
          ),
        }));
      },

      removeAllForCartItem: (cartItemId) => {
        set((state) => ({
          customizations: state.customizations.filter((c) => c.cartItemId !== cartItemId),
        }));
      },

      isInstanceComplete: (cartItemId, instanceIndex, requiredImages) => {
        const customization = get().getCustomization(cartItemId, instanceIndex);
        if (!customization) return false;

        const { current } = get().getInstanceProgress(cartItemId, instanceIndex);
        return current >= requiredImages;
      },

      getInstanceProgress: (cartItemId, instanceIndex) => {
        const customization = get().getCustomization(cartItemId, instanceIndex);

        if (!customization) {
          return { current: 0, total: 0 };
        }

        let current = 0;

        switch (customization.editorType) {
          case 'standard':
            const standardData = customization.data as StandardCustomization;
            // Nuevo formato: array de imágenes
            current = standardData.images?.length || 0;
            break;

          case 'calendar':
            const calendarData = customization.data as CalendarCustomization;
            current = calendarData.months.filter((m) => m.imageSrc !== null).length;
            break;

          case 'polaroid':
            const polaroidData = customization.data as PolaroidCustomization;
            current = polaroidData.polaroids.length;
            break;
        }

        return { current, total: 0 }; // total se determina por el producto
      },

      clearAll: () => {
        set({ customizations: [] });
      },
    }),
    {
      name: "customization-storage",
    }
  )
);
