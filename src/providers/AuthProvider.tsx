'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { obtenerUsuarioActual } from '@/services/auth';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { login, loadUserDataFromBackend } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('auth_token');

      if (token) {
        try {
          const response = await obtenerUsuarioActual();
          if (response.success && response.data) {
            login(response.data, token);
            // Restaurar carrito y customizaciones del usuario desde el backend
            await loadUserDataFromBackend();
          } else {
            localStorage.removeItem('auth_token');
          }
        } catch (error) {
          localStorage.removeItem('auth_token');
          console.error('Error verifying token:', error);
        }
      }

      setIsInitialized(true);
    };

    initializeAuth();
  }, [login, loadUserDataFromBackend]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}