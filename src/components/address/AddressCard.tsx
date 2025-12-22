"use client";

import React from 'react';
import { Address } from '@/types/Address';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AddressCardProps {
  address: Address;
  onEdit: () => void;
  onDelete: (id: number) => void;
  onSetDefault: (id: number) => void;
}

const AddressCard: React.FC<AddressCardProps> = ({ address, onEdit, onDelete, onSetDefault }) => {
  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta dirección?')) {
      onDelete(address.id!);
    }
  };

  return (
    <div className={`border rounded-lg p-4 bg-card ${address.predeterminada ? 'border-primary' : 'border-border'}`}>
      <div className="flex justify-between items-start">
        <div>
          {address.predeterminada && (
            <div className="mb-2">
              <Badge className="bg-primary/10 text-primary border-0">Predeterminada</Badge>
            </div>
          )}
          
          <div className="mb-2">
            <h3 className="font-semibold text-foreground">{address.alias}</h3>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-1 mb-3">
            <p>{address.direccion}</p>
            {address.numero_casa && <p>Número: {address.numero_casa}</p>}
            {address.numero_departamento && <p>Departamento: {address.numero_departamento}</p>}
            <p>{address.ciudad}, {address.estado}, {address.codigo_postal}</p>
            <p>{address.pais}</p>
            {address.especificaciones && <p className="italic">{address.especificaciones}</p>}
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
        >
          Editar
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
        >
          Eliminar
        </Button>
        {!address.predeterminada && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSetDefault(address.id!)}
          >
            Establecer predeterminada
          </Button>
        )}
      </div>
    </div>
  );
};

export default AddressCard;