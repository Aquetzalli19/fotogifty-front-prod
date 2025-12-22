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
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const checkAuth = () => {
      // Verificar si hay token en localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      if (!token) {
        router.push(redirectTo);
        return;
      }

      // Si hay token pero no está en el store, es posible que la app se haya recargado
      // En este caso, intentamos cargar la información del usuario
      if (token && !isAuthenticated) {
        // Esperar un breve momento para que AuthProvider cargue la información
        const timer = setTimeout(() => {
          // Si aún no está autenticado después de cargar, redirigir
          if (!isAuthenticated) {
            router.push(redirectTo);
          } else {
            setLoading(false);
          }
        }, 100);
        
        return () => clearTimeout(timer);
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
  }, [isAuthenticated, user, router, redirectTo, allowedRoles]);

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