"use client";

import React, { useState } from 'react';
import AddressCard from './AddressCard';
import AddressForm from './AddressForm';
import { Address } from '@/types/Address';
import { useAddresses } from '@/hooks/useAddresses';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';
import { Toast, ToastContainer } from '@/components/ui/toast';
import { useAuthStore } from '@/stores/auth-store';

const AddressList: React.FC = () => {
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const { toasts, removeToast, success, error: showError } = useToast();

  const {
    addresses,
    loading,
    error,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    refetch
  } = useAddresses();

  const handleCreate = async (addressData: Omit<Address, 'id' | 'usuario_id'>) => {
    if (!user) {
      showError('Usuario no autenticado');
      return;
    }

    const result = await createAddress(addressData);
    if (result.success) {
      success('Dirección creada exitosamente');
      setShowForm(false);
      setEditingAddress(null);
    } else {
      showError(result.error || 'Error al crear la dirección');
    }
  };

  const handleUpdate = async (addressId: number, addressData: Omit<Address, 'id' | 'usuario_id'>) => {
    const result = await updateAddress(addressId, addressData);
    if (result.success) {
      success('Dirección actualizada exitosamente');
      setShowForm(false);
      setEditingAddress(null);
    } else {
      showError(result.error || 'Error al actualizar la dirección');
    }
  };

  const handleDelete = async (id: number) => {
    const result = await deleteAddress(id);
    if (result.success) {
      success('Dirección eliminada exitosamente');
    } else {
      showError(result.error || 'Error al eliminar la dirección');
    }
  };

  const handleSetDefault = async (id: number) => {
    const result = await setDefaultAddress(id);
    if (result.success) {
      success('Dirección predeterminada actualizada');
    } else {
      showError(result.error || 'Error al establecer dirección predeterminada');
    }
  };

  const handleStartEdit = (address: Address) => {
    setEditingAddress(address);
    setShowForm(true);
  };

  const handleStartCreate = () => {
    setEditingAddress(null);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <p>Cargando direcciones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        <p>Error: {error}</p>
        <Button
          variant="outline"
          className="mt-2"
          onClick={() => refetch()}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Mis Direcciones</h2>
        <Button onClick={handleStartCreate}>
          + Agregar Dirección
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 border border-border bg-card p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">
            {editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
          </h3>
          <AddressForm
            onSubmit={editingAddress ? (data) => handleUpdate(editingAddress.id!, data) : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingAddress(null);
            }}
            editingAddress={editingAddress || undefined}
          />
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No tienes direcciones registradas.</p>
          <Button onClick={handleStartCreate}>
            Agregar Primera Dirección
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={() => handleStartEdit(address)}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      <ToastContainer>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>
    </div>
  );
};

export default AddressList;