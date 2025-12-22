import { useState, useEffect, useCallback } from 'react';
import { Address } from '@/types/Address';
import { addressService } from '@/services/addressService';
import { useAuthStore } from '@/stores/auth-store';

export const useAddresses = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuthStore();

  const fetchAddresses = useCallback(async () => {
    if (!user) {
      setError('Usuario no autenticado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await addressService.getAll(user.id);
      setAddresses(data);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Error al cargar las direcciones');
      console.error('Error fetching addresses:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createAddress = async (addressData: Omit<Address, 'id' | 'usuario_id'>) => {
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {
      const newAddress = await addressService.create(addressData, user.id);
      setAddresses([...addresses, newAddress]);
      return { success: true };
    } catch (err) {
      const error = err as Error;
      console.error('Error creating address:', err);
      return { success: false, error: error.message || 'Error al crear la dirección' };
    }
  };

  const updateAddress = async (id: number, addressData: Omit<Address, 'id' | 'usuario_id'>) => {
    try {
      const updatedAddress = await addressService.update(id, addressData);
      setAddresses(addresses.map(addr => addr.id === id ? updatedAddress : addr));
      return { success: true };
    } catch (err) {
      const error = err as Error;
      console.error('Error updating address:', err);
      return { success: false, error: error.message || 'Error al actualizar la dirección' };
    }
  };

  const deleteAddress = async (id: number) => {
    try {
      await addressService.delete(id);
      setAddresses(addresses.filter(addr => addr.id !== id));
      return { success: true };
    } catch (err) {
      const error = err as Error;
      console.error('Error deleting address:', err);
      return { success: false, error: error.message || 'Error al eliminar la dirección' };
    }
  };

  const setDefaultAddress = async (id: number) => {
    try {
      await addressService.setDefault(id);
      setAddresses(addresses.map(addr => ({
        ...addr,
        predeterminada: addr.id === id
      })));
      return { success: true };
    } catch (err) {
      const error = err as Error;
      console.error('Error setting default address:', err);
      return { success: false, error: error.message || 'Error al establecer dirección predeterminada' };
    }
  };

  useEffect(() => {
    if (user) {
      fetchAddresses();
    } else {
      setLoading(false);
    }
  }, [user, fetchAddresses]);

  return {
    addresses,
    loading,
    error,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    refetch: fetchAddresses
  };
};