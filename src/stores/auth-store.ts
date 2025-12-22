import { create } from 'zustand';
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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (userData, token) => set({ 
    user: userData, 
    token, 
    isAuthenticated: true 
  }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
  updateUserData: (userData) => set((state) => ({
    user: state.user ? { ...state.user, ...userData } : null
  }))
}));