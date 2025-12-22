'use client';

import { useState } from 'react';
import { obtenerTodosPaquetes, obtenerPaquetePorId } from '@/services/packages';
import { obtenerTodasCategorias } from '@/services/categories';
import { Button } from '@/components/ui/button';

/**
 * Página de prueba para verificar la conexión con la API
 * Acceder en: http://localhost:3000/test-api
 */
export default function TestAPIPage() {
  const [resultado, setResultado] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const probarPaquetes = async () => {
    setLoading(true);
    try {
      const response = await obtenerTodosPaquetes();
      setResultado(JSON.stringify(response, null, 2));
    } catch (error) {
      setResultado(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const probarPaquetePorId = async () => {
    setLoading(true);
    try {
      const response = await obtenerPaquetePorId(1);
      setResultado(JSON.stringify(response, null, 2));
    } catch (error) {
      setResultado(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const probarCategorias = async () => {
    setLoading(true);
    try {
      const response = await obtenerTodasCategorias();
      setResultado(JSON.stringify(response, null, 2));
    } catch (error) {
      setResultado(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Prueba de Conexión con API</h1>

      <div className="space-y-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <Button onClick={probarPaquetes} disabled={loading}>
            {loading ? 'Cargando...' : 'Obtener Todos los Paquetes'}
          </Button>

          <Button onClick={probarPaquetePorId} disabled={loading}>
            {loading ? 'Cargando...' : 'Obtener Paquete ID 1'}
          </Button>

          <Button onClick={probarCategorias} disabled={loading}>
            {loading ? 'Cargando...' : 'Obtener Todas las Categorías'}
          </Button>
        </div>
      </div>

      <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Resultado:</h2>
        <pre className="overflow-auto max-h-96 text-sm">
          {resultado || 'Haz clic en un botón para probar la API'}
        </pre>
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Información:</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>API URL: {process.env.NEXT_PUBLIC_API_URL || 'No configurada'}</li>
          <li>Esta página solo debe usarse para testing</li>
          <li>Verifica que el backend esté corriendo en http://localhost:3001</li>
        </ul>
      </div>
    </div>
  );
}
