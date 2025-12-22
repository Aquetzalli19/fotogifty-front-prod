import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Cliente } from '@/interfaces/users';

export interface AuthResponse {
  user: Cliente;
  token: string;
}

interface AuthState {
  user: Cliente | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (userData: Cliente, token: string) => void;
  logout: () => void;
  updateUserData: (userData: Partial<Cliente>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (userData, token) => {
        // Guardar token en localStorage separadamente para api-client
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
        }
        set({
          user: userData,
          token,
          isAuthenticated: true
        });
      },
      logout: () => {
        // Limpiar token de localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUserData: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      }))
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);