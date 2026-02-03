import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthenticatedUser, UserType } from '@/interfaces/users';
import {
  clearAllUserData,
  validateAndClearIfDifferentUser,
  setDataOwner,
} from '@/lib/user-data-utils';
import { useCartStore } from './cart-store';
import { useCustomizationStore } from './customization-store';

export interface AuthResponse {
  user: AuthenticatedUser;
  token: string;
}

interface AuthState {
  user: AuthenticatedUser | null;
  token: string | null;
  isAuthenticated: boolean;
  userType: UserType | null;
  _hasHydrated: boolean;
  isLoadingUserData: boolean;
  setHasHydrated: (state: boolean) => void;
  login: (userData: AuthenticatedUser, token: string) => void;
  logout: () => void;
  updateUserData: (userData: Partial<AuthenticatedUser>) => void;
  isUserType: (type: UserType) => boolean;
  // Cargar carrito y customizaciones del usuario desde el backend
  loadUserDataFromBackend: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      userType: null,
      _hasHydrated: false,
      isLoadingUserData: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state
        });
      },
      login: (userData, token) => {
        // Guardar token en localStorage separadamente para api-client
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);

          // SEGURIDAD: Validar y limpiar datos si pertenecen a otro usuario
          // Esto previene que un usuario vea datos de otro usuario
          validateAndClearIfDifferentUser(userData.id, userData.email);

          // Establecer el usuario actual como dueño de los datos
          setDataOwner(userData.id, userData.email);
        }
        set({
          user: userData,
          token,
          isAuthenticated: true,
          userType: userData.tipo
        });
      },
      logout: () => {
        // SEGURIDAD: Limpiar TODOS los datos de usuario
        // Esto previene que otro usuario vea datos del usuario anterior
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');

          // Limpiar carrito, customizaciones y otros datos sensibles
          clearAllUserData();
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          userType: null
        });
      },
      updateUserData: (userData) => {
        set((state) => {
          if (!state.user) return { user: null };

          // Crear un nuevo objeto completamente para forzar re-render
          const updatedUser = {
            ...state.user,
            ...userData,
            // Agregar timestamp para garantizar que el objeto es nuevo
            _lastUpdated: Date.now()
          };

          return { user: updatedUser };
        });
      },
      isUserType: (type: UserType) => {
        const state = get();
        return state.userType === type;
      },

      // Cargar datos del usuario desde el backend (carrito y customizaciones)
      loadUserDataFromBackend: async () => {
        set({ isLoadingUserData: true });
        try {
          // Cargar carrito y customizaciones en paralelo
          await Promise.all([
            useCartStore.getState().loadFromBackend(),
            useCustomizationStore.getState().loadFromBackend(),
          ]);
          console.log('✅ Datos de usuario cargados desde backend');
        } catch (error) {
          console.error('Error cargando datos de usuario desde backend:', error);
        } finally {
          set({ isLoadingUserData: false });
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // No persistir estados transitorios
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        userType: state.userType,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);