'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // Por si queremos roles específicos en el futuro
  redirectTo?: string; // Ruta a la que redirigir si no está autenticado
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Esperar a que el store se hidrate antes de verificar autenticación
    if (!_hasHydrated) {
      return;
    }

    // Verificar si el usuario está autenticado
    const checkAuth = () => {
      // Verificar si hay token en localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

      if (!token || !isAuthenticated) {
        router.push(redirectTo);
        return;
      }

      // Verificar si el usuario tiene los roles necesarios
      if (allowedRoles && user) {
        const userType = user.tipo || '';
        if (!allowedRoles.includes(userType)) {
          // Redirigir según el tipo de usuario
          if (userType === 'admin' || userType === 'super_admin') {
            router.push('/admin');
          } else if (userType === 'store') {
            router.push('/store');
          } else if (userType === 'cliente') {
            router.push('/user');
          } else {
            router.push('/unauthorized');
          }
          return;
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, [_hasHydrated, isAuthenticated, user, router, redirectTo, allowedRoles]);

  // Mostrar un loader mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}