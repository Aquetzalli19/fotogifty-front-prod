import { apiClient } from '@/lib/api-client';
import { Address } from '@/types/Address';

export const addressService = {
  getAll: async (userId: number): Promise<Address[]> => {
    // Obtenemos todas las direcciones del usuario autenticado actualmente
    const response = await apiClient.get<Address[]>(`/direcciones/usuario/${userId}`);
    // Asegurarse de que la respuesta tiene la estructura esperada
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Error al cargar las direcciones');
  },

  create: async (addressData: Omit<Address, 'id' | 'usuario_id'>, userId: number): Promise<Address> => {
    // Añadir el usuario_id al cuerpo de la solicitud
    const requestData = { ...addressData, usuario_id: userId };
    const response = await apiClient.post<Address>('/direcciones', requestData);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Error al crear la dirección');
  },

  update: async (id: number, addressData: Omit<Address, 'id' | 'usuario_id'>): Promise<Address> => {
    const response = await apiClient.put<Address>(`/direcciones/${id}`, addressData);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Error al actualizar la dirección');
  },

  delete: async (id: number): Promise<void> => {
    const response = await apiClient.delete(`/direcciones/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Error al eliminar la dirección');
    }
  },

  setDefault: async (id: number): Promise<void> => {
    const response = await apiClient.patch(`/direcciones/${id}/predeterminada`);
    if (!response.success) {
      throw new Error(response.message || 'Error al establecer dirección predeterminada');
    }
  }
};