"use client";

import React from 'react';
import { Address } from '@/types/Address';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface AddressSelectorProps {
  addresses: Address[];
  selectedAddressId: number | null;
  onSelect: (id: number) => void;
  onAddNew: () => void;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({ 
  addresses, 
  selectedAddressId, 
  onSelect,
  onAddNew 
}) => {
  const defaultAddress = addresses.find(addr => addr.predeterminada);

  if (addresses.length === 0) {
    return (
      <div className="border rounded-lg p-4 mb-4">
        <p className="text-muted-foreground">No tienes direcciones registradas.</p>
        <Button 
          onClick={onAddNew}
          className="mt-2"
        >
          Agregar Dirección
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium">Selecciona una dirección:</h3>
      <RadioGroup 
        value={selectedAddressId?.toString() || undefined} 
        onValueChange={(value) => onSelect(Number(value))}
        className="space-y-2"
      >
        {addresses.map(address => (
          <div 
            key={address.id}
            className={`border rounded-lg p-3 cursor-pointer transition-colors bg-card hover:bg-muted ${
              selectedAddressId === address.id ? 'border-primary' : 'border-border'
            }`}
            onClick={() => onSelect(address.id!)}
          >
            <div className="flex items-start space-x-3">
              <RadioGroupItem 
                value={address.id?.toString()} 
                id={`address-${address.id}`}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="flex justify-between">
                  <Label 
                    htmlFor={`address-${address.id}`} 
                    className="font-medium cursor-pointer"
                  >
                    {address.alias}
                  </Label>
                  {address.predeterminada && (
                    <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                      Predeterminada
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {address.direccion}
                  {address.numero_casa && `, ${address.numero_casa}`}
                  {address.numero_departamento && `, Depto. ${address.numero_departamento}`}
                </div>
                <div className="text-sm text-muted-foreground">
                  {address.ciudad}, {address.estado}, {address.codigo_postal}
                </div>
                <div className="text-sm text-muted-foreground">
                  {address.pais}
                </div>
                {address.especificaciones && (
                  <div className="text-sm italic text-muted-foreground mt-1">
                    {address.especificaciones}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </RadioGroup>
      <Button 
        variant="outline"
        size="sm"
        onClick={onAddNew}
        className="mt-3"
      >
        + Agregar nueva dirección
      </Button>
    </div>
  );
};

export default AddressSelector;