import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthenticatedUser, UserType } from '@/interfaces/users';

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
  setHasHydrated: (state: boolean) => void;
  login: (userData: AuthenticatedUser, token: string) => void;
  logout: () => void;
  updateUserData: (userData: Partial<AuthenticatedUser>) => void;
  isUserType: (type: UserType) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      userType: null,
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state
        });
      },
      login: (userData, token) => {
        // Guardar token en localStorage separadamente para api-client
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
        }
        set({
          user: userData,
          token,
          isAuthenticated: true,
          userType: userData.tipo
        });
      },
      logout: () => {
        // Limpiar token de localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
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
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);