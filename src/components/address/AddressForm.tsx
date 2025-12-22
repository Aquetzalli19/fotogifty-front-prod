"use client";

import React, { useState, useEffect } from 'react';
import { Address } from '@/types/Address';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const AddressFormSchema = z.object({
  alias: z.string().min(1, { message: 'El alias es requerido' }),
  pais: z.string().min(1, { message: 'El país es requerido' }),
  estado: z.string().min(1, { message: 'El estado es requerido' }),
  ciudad: z.string().min(1, { message: 'La ciudad es requerida' }),
  codigo_postal: z.string().min(1, { message: 'El código postal es requerido' }),
  direccion: z.string().min(1, { message: 'La dirección es requerida' }),
  numero_casa: z.string().optional(),
  numero_departamento: z.string().optional(),
  especificaciones: z.string().optional(),
  predeterminada: z.boolean(),
});

interface AddressFormProps {
  onSubmit: (address: Omit<Address, 'id' | 'usuario_id'>) => void;
  onCancel: () => void;
  editingAddress?: Address;
}

const AddressForm: React.FC<AddressFormProps> = ({ onSubmit, onCancel, editingAddress }) => {
  const [formData, setFormData] = useState<Omit<Address, 'id' | 'usuario_id'>>({
    alias: '',
    pais: '',
    estado: '',
    ciudad: '',
    codigo_postal: '',
    direccion: '',
    numero_casa: '',
    numero_departamento: '',
    especificaciones: '',
    predeterminada: false,
  });

  const form = useForm<z.infer<typeof AddressFormSchema>>({
    resolver: zodResolver(AddressFormSchema),
    defaultValues: {
      alias: '',
      pais: '',
      estado: '',
      ciudad: '',
      codigo_postal: '',
      direccion: '',
      numero_casa: '',
      numero_departamento: '',
      especificaciones: '',
      predeterminada: false,
    },
  });

  useEffect(() => {
    if (editingAddress) {
      setFormData({
        alias: editingAddress.alias,
        pais: editingAddress.pais,
        estado: editingAddress.estado,
        ciudad: editingAddress.ciudad,
        codigo_postal: editingAddress.codigo_postal,
        direccion: editingAddress.direccion,
        numero_casa: editingAddress.numero_casa || '',
        numero_departamento: editingAddress.numero_departamento || '',
        especificaciones: editingAddress.especificaciones || '',
        predeterminada: editingAddress.predeterminada,
      });
      
      // Actualizar los valores del formulario react-hook-form
      form.reset({
        alias: editingAddress.alias,
        pais: editingAddress.pais,
        estado: editingAddress.estado,
        ciudad: editingAddress.ciudad,
        codigo_postal: editingAddress.codigo_postal,
        direccion: editingAddress.direccion,
        numero_casa: editingAddress.numero_casa || '',
        numero_departamento: editingAddress.numero_departamento || '',
        especificaciones: editingAddress.especificaciones || '',
        predeterminada: editingAddress.predeterminada,
      });
    } else {
      // Reiniciar el formulario si no hay dirección de edición
      form.reset({
        alias: '',
        pais: '',
        estado: '',
        ciudad: '',
        codigo_postal: '',
        direccion: '',
        numero_casa: '',
        numero_departamento: '',
        especificaciones: '',
        predeterminada: false,
      });
    }
  }, [editingAddress, form]);

  const handleFormSubmit = (data: z.infer<typeof AddressFormSchema>) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FormField
              control={form.control}
              name="alias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alias *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej: Casa, Trabajo"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <FormField
              control={form.control}
              name="pais"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>País *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="País"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado/Región *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Estado"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <FormField
              control={form.control}
              name="ciudad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciudad *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ciudad"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <FormField
              control={form.control}
              name="codigo_postal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código Postal *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Código Postal"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Calle y número"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <FormField
              control={form.control}
              name="numero_casa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de casa</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Número"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <FormField
              control={form.control}
              name="numero_departamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Departamento"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div>
          <FormField
            control={form.control}
            name="especificaciones"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Especificaciones</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Ej: Edificio A, Puerta Azul, Piso 3, etc."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center">
          <FormField
            control={form.control}
            name="predeterminada"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">
                  Establecer como dirección predeterminada
                </FormLabel>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
          >
            {editingAddress ? 'Actualizar' : 'Crear'} Dirección
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddressForm;