"use client";

import { useAuthStore } from '@/stores/auth-store';
import AddressList from '@/components/address/AddressList';
import { useEffect, useState } from 'react';

const AddressesPage = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Asegurar que la autenticación esté completamente lista
    if (isAuthenticated && user) {
      setIsReady(true);
    }
  }, [isAuthenticated, user]);

  // Mostrar un indicador de carga mientras se verifica la autenticación
  if (!isReady) {
    return (
      <div className="flex justify-center items-center h-32">
        <p>Cargando direcciones...</p>
      </div>
    );
  }

  // Mostrar un indicador de carga mientras se verifica la autenticación
  if (!isReady) {
    return (
      <div className="flex justify-center items-center h-32">
        <p>Cargando direcciones...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <AddressList />
    </div>
  );
};

export default AddressesPage;