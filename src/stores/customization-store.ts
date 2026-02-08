import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EditorType } from "@/lib/category-utils";
import { Effect } from "@/lib/types";
import {
  obtenerCustomizacionesTemporales,
  guardarCustomizacionTemporal,
  eliminarCustomizacionTemporal,
  eliminarTodasCustomizaciones,
  debounce,
} from "@/services/temp-cart";

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
  copies: number; // NUEVO: Cantidad de copias físicas de esta foto (mínimo 1)
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
      rotation: number;
      posX: number;
      posY: number;
    };
    effects: {
      brightness: number;
      contrast: number;
      saturation: number;
      sepia: number;
    };
    selectedFilter: string;
    canvasStyle: {
      borderColor: string;
      borderWidth: number;
      backgroundColor: string;
    };
    copies?: number; // OBSOLETO: Ya no se usa para calendarios (cada calendario es único)
  }>;
}

export interface PolaroidCustomization {
  // Dimensiones del canvas del paquete (para renderizar con las dimensiones correctas)
  canvasWidth: number; // En pixels a exportResolution DPI
  canvasHeight: number; // En pixels a exportResolution DPI
  widthInches: number; // Ancho en pulgadas del paquete
  heightInches: number; // Alto en pulgadas del paquete
  exportResolution: number; // DPI para exportar (300)
  photoArea: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  polaroids: Array<{
    id: number;
    imageSrc: string; // Imagen ORIGINAL para permitir edición posterior
    renderedImageSrc?: string; // Imagen RENDERIZADA (canvas con marco polaroid y transformaciones) - SE ENVÍA AL BACKEND
    transformations: {
      scale: number;
      rotation: number;
      posX: number;
      posY: number;
    };
    effects: {
      brightness: number;
      contrast: number;
      saturation: number;
      sepia: number;
    };
    selectedFilter: string;
    canvasStyle: {
      borderColor: string;
      borderWidth: number;
      backgroundColor: string;
    };
    thumbnailDataUrl?: string;
    copies: number; // NUEVO: Cantidad de copias físicas de este polaroid (mínimo 1)
    // DEPRECADO: Campos para polaroid doble (funcionalidad removida, se mantiene para compatibilidad con datos existentes)
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

  // NUEVOS MÉTODOS PARA SISTEMA DE COPIAS
  // Actualizar cantidad de copias de una foto específica
  updateCopies: (cartItemId: number, instanceIndex: number, imageId: number, copies: number) => void;

  // Obtener total de copias usadas en una instancia del carrito
  getTotalCopiesUsed: (cartItemId: number, instanceIndex: number) => number;

  // Obtener copias disponibles restantes
  getRemainingCopies: (cartItemId: number, instanceIndex: number, packageQuantity: number) => number;

  // Limpiar todo
  clearAll: () => void;

  // Métodos para sincronización con backend
  isSyncing: boolean;
  lastSyncError: string | null;
  loadFromBackend: () => Promise<void>;
  syncCustomizationToBackend: (cartItemId: number, instanceIndex: number) => Promise<void>;
  clearAllAndSyncBackend: () => Promise<void>;
}

// Función debounced para sincronizar customización con backend (2 segundos de espera)
const createDebouncedCustomizationSync = () => {
  const syncQueue = new Map<string, NodeJS.Timeout>();

  return (customization: Customization) => {
    const key = `${customization.cartItemId}-${customization.instanceIndex}`;

    // Cancelar sync pendiente para esta customización
    const existingTimeout = syncQueue.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Programar nuevo sync
    const timeout = setTimeout(async () => {
      try {
        const result = await guardarCustomizacionTemporal(
          String(customization.cartItemId),
          customization.instanceIndex,
          customization.editorType,
          customization.data as unknown as Record<string, unknown>,
          customization.completed
        );
        if (result.success) {
          console.log('✅ Customización sincronizada con backend');
        } else {
          console.warn('⚠️ Error sincronizando customización:', result.message);
        }
      } catch (error) {
        console.error('❌ Error en sincronización de customización:', error);
      }
      syncQueue.delete(key);
    }, 2000);

    syncQueue.set(key, timeout);
  };
};

const debouncedCustomizationSync = createDebouncedCustomizationSync();

export const useCustomizationStore = create<CustomizationState>()(
  persist(
    (set, get) => ({
      customizations: [],
      isSyncing: false,
      lastSyncError: null,

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

        // Sincronizar con backend (debounced)
        debouncedCustomizationSync(newCustomization);
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
            current = standardData?.images?.length || 0;
            break;

          case 'calendar':
            const calendarData = customization.data as CalendarCustomization;
            current = calendarData?.months?.filter((m) => m.imageSrc !== null).length || 0;
            break;

          case 'polaroid':
            const polaroidData = customization.data as PolaroidCustomization;
            current = polaroidData?.polaroids?.length || 0;
            break;
        }

        return { current, total: 0 }; // total se determina por el producto
      },

      // NUEVOS MÉTODOS PARA SISTEMA DE COPIAS
      updateCopies: (cartItemId, instanceIndex, imageId, copies) => {
        const customization = get().getCustomization(cartItemId, instanceIndex);
        if (!customization) return;

        const updatedData = { ...customization.data };

        switch (customization.editorType) {
          case 'standard':
            const standardData = updatedData as StandardCustomization;
            const imageIndex = standardData.images.findIndex((img) => img.id === imageId);
            if (imageIndex >= 0) {
              standardData.images[imageIndex] = {
                ...standardData.images[imageIndex],
                copies: Math.max(1, copies), // Mínimo 1 copia
              };
            }
            break;

          case 'calendar':
            const calendarData = updatedData as CalendarCustomization;
            const monthIndex = calendarData.months.findIndex((m) => m.month === imageId);
            if (monthIndex >= 0) {
              calendarData.months[monthIndex] = {
                ...calendarData.months[monthIndex],
                copies: Math.max(1, copies),
              };
            }
            break;

          case 'polaroid':
            const polaroidData = updatedData as PolaroidCustomization;
            const polaroidIndex = polaroidData.polaroids.findIndex((p) => p.id === imageId);
            if (polaroidIndex >= 0) {
              polaroidData.polaroids[polaroidIndex] = {
                ...polaroidData.polaroids[polaroidIndex],
                copies: Math.max(1, copies),
              };
            }
            break;
        }

        get().saveCustomization({
          ...customization,
          data: updatedData,
        });
      },

      getTotalCopiesUsed: (cartItemId, instanceIndex) => {
        const customization = get().getCustomization(cartItemId, instanceIndex);
        if (!customization) return 0;

        let total = 0;

        switch (customization.editorType) {
          case 'standard':
            const standardData = customization.data as StandardCustomization;
            total = standardData?.images?.reduce((sum, img) => sum + (img.copies || 1), 0) || 0;
            break;

          case 'calendar':
            const calendarData = customization.data as CalendarCustomization;
            total = calendarData?.months
              ?.filter((m) => m.imageSrc !== null)
              .reduce((sum, month) => sum + (month.copies || 1), 0) || 0;
            break;

          case 'polaroid':
            const polaroidData = customization.data as PolaroidCustomization;
            total = polaroidData?.polaroids?.reduce((sum, p) => sum + (p.copies || 1), 0) || 0;
            break;
        }

        return total;
      },

      getRemainingCopies: (cartItemId, instanceIndex, packageQuantity) => {
        const used = get().getTotalCopiesUsed(cartItemId, instanceIndex);
        return Math.max(0, packageQuantity - used);
      },

      clearAll: () => {
        set({ customizations: [] });
      },

      // Cargar customizaciones desde el backend (llamar en login)
      loadFromBackend: async () => {
        set({ isSyncing: true, lastSyncError: null });
        try {
          const response = await obtenerCustomizacionesTemporales();
          if (response.success && response.data && response.data.length > 0) {
            const localCustomizations = get().customizations;

            const backendCustomizations: Customization[] = response.data
              .map((item) => {
                // Manejar tanto camelCase como snake_case del backend
                const raw = item as Record<string, unknown>;
                const cid = raw.cartItemId ?? raw.cart_item_id ?? raw.cartitemid;
                const iidx = raw.instanceIndex ?? raw.instance_index;
                const etype = (raw.editorType ?? raw.editor_type) as string;

                return {
                  cartItemId: typeof cid === 'string' ? parseInt(cid, 10) : Number(cid),
                  instanceIndex: typeof iidx === 'string' ? parseInt(iidx as string, 10) : Number(iidx),
                  editorType: etype as EditorType,
                  data: (raw.data ?? raw.datos) as unknown as StandardCustomization | CalendarCustomization | PolaroidCustomization,
                  completed: item.completed,
                  lastModified: Date.now(),
                };
              })
              .filter((c) => !isNaN(c.cartItemId) && !isNaN(c.instanceIndex));

            // Merge: backend llena los huecos donde no hay datos locales
            const merged = [...localCustomizations];
            for (const backendItem of backendCustomizations) {
              const existsLocally = merged.some(
                (c) => c.cartItemId === backendItem.cartItemId && c.instanceIndex === backendItem.instanceIndex
              );
              if (!existsLocally) {
                merged.push(backendItem);
              }
            }

            set({ customizations: merged });
          }
          set({ isSyncing: false });
        } catch (error) {
          console.error('Error cargando customizaciones desde backend:', error);
          set({
            isSyncing: false,
            lastSyncError: 'Error al cargar customizaciones desde el servidor'
          });
        }
      },

      // Sincronizar una customización específica con el backend
      syncCustomizationToBackend: async (cartItemId, instanceIndex) => {
        const customization = get().getCustomization(cartItemId, instanceIndex);
        if (!customization) return;

        set({ isSyncing: true, lastSyncError: null });
        try {
          const result = await guardarCustomizacionTemporal(
            String(cartItemId),
            instanceIndex,
            customization.editorType,
            customization.data as unknown as Record<string, unknown>,
            customization.completed
          );
          if (!result.success) {
            set({ lastSyncError: result.message || 'Error al sincronizar' });
          }
          set({ isSyncing: false });
        } catch (error) {
          console.error('Error sincronizando customización:', error);
          set({
            isSyncing: false,
            lastSyncError: 'Error al sincronizar con el servidor'
          });
        }
      },

      // Limpiar todo local y en backend
      clearAllAndSyncBackend: async () => {
        set({ customizations: [], isSyncing: true, lastSyncError: null });
        try {
          await eliminarTodasCustomizaciones();
          set({ isSyncing: false });
        } catch (error) {
          console.error('Error eliminando customizaciones en backend:', error);
          set({
            isSyncing: false,
            lastSyncError: 'Error al eliminar customizaciones del servidor'
          });
        }
      },
    }),
    {
      name: "customization-storage",
      // Solo persistir customizations, no el estado de sincronización
      partialize: (state) => ({ customizations: state.customizations }),
    }
  )
);
