# Sistema de Gestión de Ubicación de Tienda - Plan de Implementación

## 📋 Objetivo

Implementar un sistema completo para gestionar la ubicación de la tienda física que permita:
1. **Admin**: Configurar dirección, coordenadas y horarios desde un formulario
2. **Carrito**: Mostrar la dirección cuando el usuario selecciona "Recoger en tienda"
3. **Landing Page**: Mostrar un mapa con pin en la ubicación de la tienda

---

## 🗄️ PARTE 1: BACKEND (Para tu equipo de backend)

### 1.1. Base de Datos

Crear tabla `configuracion_tienda`:

```sql
CREATE TABLE configuracion_tienda (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL DEFAULT 'FotoGifty',
  direccion VARCHAR(500) NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  estado VARCHAR(100) NOT NULL,
  codigo_postal VARCHAR(10) NOT NULL,
  pais VARCHAR(100) NOT NULL DEFAULT 'México',
  telefono VARCHAR(20) NOT NULL,
  email VARCHAR(255),

  -- Coordenadas para el mapa
  latitud DECIMAL(10, 8) NOT NULL,
  longitud DECIMAL(11, 8) NOT NULL,

  -- Horarios
  horario_lunes_viernes VARCHAR(100),
  horario_sabado VARCHAR(100),
  horario_domingo VARCHAR(100),

  -- Información adicional
  descripcion TEXT,
  instrucciones_llegada TEXT,

  -- Timestamps
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  actualizado_por INT, -- ID del admin que hizo la última actualización

  -- Constraint: Solo debe haber UN registro en esta tabla
  UNIQUE KEY unique_config (id)
);

-- Insertar configuración por defecto
INSERT INTO configuracion_tienda (
  nombre, direccion, ciudad, estado, codigo_postal,
  telefono, latitud, longitud,
  horario_lunes_viernes, horario_sabado, horario_domingo
) VALUES (
  'FotoGifty - Tienda Principal',
  'Av. Principal #123, Col. Centro',
  'Ciudad de México',
  'CDMX',
  '01000',
  '55-1234-5678',
  19.432608,  -- Latitud de ejemplo (Zócalo CDMX)
  -99.133209, -- Longitud de ejemplo
  'Lunes a Viernes: 9:00 AM - 7:00 PM',
  'Sábado: 10:00 AM - 3:00 PM',
  'Domingo: Cerrado'
);
```

**Notas importantes:**
- Solo debe existir **UN** registro en esta tabla (id=1)
- Las coordenadas son **obligatorias** para mostrar el mapa
- Los horarios son opcionales pero recomendados

### 1.2. Endpoints a Implementar

#### **GET `/api/configuracion-tienda`** (Público)
Obtener la configuración actual de la tienda.

```typescript
// Request: No requiere autenticación
GET /api/configuracion-tienda

// Response
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "FotoGifty - Tienda Principal",
    "direccion": "Av. Principal #123, Col. Centro",
    "ciudad": "Ciudad de México",
    "estado": "CDMX",
    "codigo_postal": "01000",
    "pais": "México",
    "telefono": "55-1234-5678",
    "email": "contacto@fotogifty.com",
    "latitud": 19.432608,
    "longitud": -99.133209,
    "horario_lunes_viernes": "Lunes a Viernes: 9:00 AM - 7:00 PM",
    "horario_sabado": "Sábado: 10:00 AM - 3:00 PM",
    "horario_domingo": "Domingo: Cerrado",
    "descripcion": "Nuestra tienda principal en el centro de la ciudad",
    "instrucciones_llegada": "Estamos frente al parque central, edificio azul",
    "fecha_actualizacion": "2024-01-15T10:30:00.000Z"
  }
}
```

**Lógica:**
```sql
SELECT * FROM configuracion_tienda WHERE id = 1;
```

---

#### **PUT `/api/configuracion-tienda`** (Admin/Super Admin)
Actualizar la configuración de la tienda.

```typescript
// Request
PUT /api/configuracion-tienda
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "nombre": "FotoGifty - Tienda Principal",
  "direccion": "Nueva Dirección #456",
  "ciudad": "Guadalajara",
  "estado": "Jalisco",
  "codigo_postal": "44100",
  "pais": "México",
  "telefono": "33-9876-5432",
  "email": "tienda@fotogifty.com",
  "latitud": 20.676667,
  "longitud": -103.347222,
  "horario_lunes_viernes": "Lunes a Viernes: 9:00 AM - 7:00 PM",
  "horario_sabado": "Sábado: 10:00 AM - 3:00 PM",
  "horario_domingo": "Domingo: Cerrado",
  "descripcion": "Nuestra nueva ubicación",
  "instrucciones_llegada": "Junto al centro comercial"
}

// Response
{
  "success": true,
  "message": "Configuración de tienda actualizada correctamente",
  "data": { /* objeto actualizado */ }
}
```

**Validaciones:**
- ✅ Solo usuarios con rol `admin` o `super_admin`
- ✅ Latitud: entre -90 y 90
- ✅ Longitud: entre -180 y 180
- ✅ Todos los campos obligatorios presentes

**Lógica:**
```sql
UPDATE configuracion_tienda
SET
  nombre = ?,
  direccion = ?,
  ciudad = ?,
  estado = ?,
  codigo_postal = ?,
  pais = ?,
  telefono = ?,
  email = ?,
  latitud = ?,
  longitud = ?,
  horario_lunes_viernes = ?,
  horario_sabado = ?,
  horario_domingo = ?,
  descripcion = ?,
  instrucciones_llegada = ?,
  actualizado_por = ?
WHERE id = 1;
```

---

### 1.3. Middleware de Autenticación

```typescript
// Validar que solo admins puedan actualizar
const validarRolAdmin = (req, res, next) => {
  const user = req.user; // Del token JWT

  if (!user || !['admin', 'super_admin'].includes(user.rol)) {
    return res.status(403).json({
      success: false,
      error: 'No tienes permisos para realizar esta acción'
    });
  }

  next();
};

// Aplicar middleware
app.put('/api/configuracion-tienda', validarRolAdmin, actualizarConfiguracionTienda);
```

---

### 1.4. Controlador de Ejemplo

```typescript
// controllers/configuracionTiendaController.ts

export const obtenerConfiguracion = async (req, res) => {
  try {
    const config = await db.query(
      'SELECT * FROM configuracion_tienda WHERE id = 1'
    );

    if (!config || config.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Configuración de tienda no encontrada'
      });
    }

    res.json({
      success: true,
      data: config[0]
    });
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener configuración de tienda'
    });
  }
};

export const actualizarConfiguracion = async (req, res) => {
  try {
    const {
      nombre, direccion, ciudad, estado, codigo_postal, pais,
      telefono, email, latitud, longitud,
      horario_lunes_viernes, horario_sabado, horario_domingo,
      descripcion, instrucciones_llegada
    } = req.body;

    // Validar coordenadas
    if (latitud < -90 || latitud > 90) {
      return res.status(400).json({
        success: false,
        error: 'Latitud inválida (debe estar entre -90 y 90)'
      });
    }

    if (longitud < -180 || longitud > 180) {
      return res.status(400).json({
        success: false,
        error: 'Longitud inválida (debe estar entre -180 y 180)'
      });
    }

    // Actualizar
    await db.query(
      `UPDATE configuracion_tienda SET
        nombre = ?, direccion = ?, ciudad = ?, estado = ?,
        codigo_postal = ?, pais = ?, telefono = ?, email = ?,
        latitud = ?, longitud = ?,
        horario_lunes_viernes = ?, horario_sabado = ?, horario_domingo = ?,
        descripcion = ?, instrucciones_llegada = ?,
        actualizado_por = ?
      WHERE id = 1`,
      [
        nombre, direccion, ciudad, estado, codigo_postal, pais,
        telefono, email, latitud, longitud,
        horario_lunes_viernes, horario_sabado, horario_domingo,
        descripcion, instrucciones_llegada,
        req.user.id
      ]
    );

    // Obtener el registro actualizado
    const updated = await db.query(
      'SELECT * FROM configuracion_tienda WHERE id = 1'
    );

    res.json({
      success: true,
      message: 'Configuración actualizada correctamente',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error actualizando configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar configuración de tienda'
    });
  }
};
```

---

### 1.5. Rutas

```typescript
// routes/configuracionTienda.ts
import express from 'express';
import { obtenerConfiguracion, actualizarConfiguracion } from '../controllers/configuracionTiendaController';
import { validarToken, validarRolAdmin } from '../middleware/auth';

const router = express.Router();

// Público - Obtener configuración
router.get('/configuracion-tienda', obtenerConfiguracion);

// Admin - Actualizar configuración
router.put('/configuracion-tienda', validarToken, validarRolAdmin, actualizarConfiguracion);

export default router;
```

---

## 🎨 PARTE 2: FRONTEND

### 2.1. Interfaces TypeScript

Crear: `src/interfaces/store-config.ts`

```typescript
/**
 * Configuración de la tienda física
 */
export interface StoreConfiguration {
  id: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  pais: string;
  telefono: string;
  email: string | null;
  latitud: number;
  longitud: number;
  horario_lunes_viernes: string | null;
  horario_sabado: string | null;
  horario_domingo: string | null;
  descripcion: string | null;
  instrucciones_llegada: string | null;
  fecha_actualizacion: string;
}

/**
 * DTO para actualizar configuración
 */
export interface StoreConfigurationDTO {
  nombre: string;
  direccion: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  pais: string;
  telefono: string;
  email?: string;
  latitud: number;
  longitud: number;
  horario_lunes_viernes?: string;
  horario_sabado?: string;
  horario_domingo?: string;
  descripcion?: string;
  instrucciones_llegada?: string;
}
```

---

### 2.2. Servicio API

Crear: `src/services/store-configuration.ts`

```typescript
import { apiClient } from '@/lib/api-client';
import { StoreConfiguration, StoreConfigurationDTO } from '@/interfaces/store-config';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Obtener configuración actual de la tienda
 */
export async function obtenerConfiguracionTienda(): Promise<ApiResponse<StoreConfiguration>> {
  try {
    const response = await apiClient.get<StoreConfiguration>('/configuracion-tienda');
    return response;
  } catch (error) {
    console.error('Error obteniendo configuración de tienda:', error);
    throw error;
  }
}

/**
 * Actualizar configuración de la tienda (Admin)
 */
export async function actualizarConfiguracionTienda(
  data: StoreConfigurationDTO
): Promise<ApiResponse<StoreConfiguration>> {
  try {
    const response = await apiClient.put<StoreConfiguration>('/configuracion-tienda', data);
    return response;
  } catch (error) {
    console.error('Error actualizando configuración de tienda:', error);
    throw error;
  }
}
```

---

### 2.3. Página de Admin para Gestión

Crear: `src/app/admin/store-settings/page.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Loader2, MapPin, Store, Phone, Mail, Clock } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Toast, ToastContainer } from "@/components/ui/toast";
import { obtenerConfiguracionTienda, actualizarConfiguracionTienda } from "@/services/store-configuration";
import { StoreConfigurationDTO } from "@/interfaces/store-config";

const storeConfigSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  direccion: z.string().min(1, "La dirección es requerida"),
  ciudad: z.string().min(1, "La ciudad es requerida"),
  estado: z.string().min(1, "El estado es requerido"),
  codigo_postal: z.string().min(1, "El código postal es requerido"),
  pais: z.string().min(1, "El país es requerido"),
  telefono: z.string().min(1, "El teléfono es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  latitud: z.number().min(-90).max(90, "Latitud debe estar entre -90 y 90"),
  longitud: z.number().min(-180).max(180, "Longitud debe estar entre -180 y 180"),
  horario_lunes_viernes: z.string().optional(),
  horario_sabado: z.string().optional(),
  horario_domingo: z.string().optional(),
  descripcion: z.string().optional(),
  instrucciones_llegada: z.string().optional(),
});

type StoreConfigFormData = z.infer<typeof storeConfigSchema>;

export default function StoreSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toasts, removeToast, success, error } = useToast();

  const form = useForm<StoreConfigFormData>({
    resolver: zodResolver(storeConfigSchema),
    defaultValues: {
      nombre: "",
      direccion: "",
      ciudad: "",
      estado: "",
      codigo_postal: "",
      pais: "México",
      telefono: "",
      email: "",
      latitud: 19.432608,
      longitud: -99.133209,
      horario_lunes_viernes: "",
      horario_sabado: "",
      horario_domingo: "",
      descripcion: "",
      instrucciones_llegada: "",
    },
  });

  // Cargar configuración actual
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        const response = await obtenerConfiguracionTienda();
        if (response.success && response.data) {
          const config = response.data;
          form.reset({
            nombre: config.nombre,
            direccion: config.direccion,
            ciudad: config.ciudad,
            estado: config.estado,
            codigo_postal: config.codigo_postal,
            pais: config.pais,
            telefono: config.telefono,
            email: config.email || "",
            latitud: config.latitud,
            longitud: config.longitud,
            horario_lunes_viernes: config.horario_lunes_viernes || "",
            horario_sabado: config.horario_sabado || "",
            horario_domingo: config.horario_domingo || "",
            descripcion: config.descripcion || "",
            instrucciones_llegada: config.instrucciones_llegada || "",
          });
        }
      } catch (err) {
        error("Error al cargar la configuración");
      } finally {
        setIsLoading(false);
      }
    };

    loadConfiguration();
  }, []);

  const onSubmit = async (data: StoreConfigFormData) => {
    setIsSaving(true);
    try {
      const response = await actualizarConfiguracionTienda(data);
      if (response.success) {
        success("Configuración actualizada exitosamente");
      } else {
        error("Error al actualizar la configuración");
      }
    } catch (err) {
      error("Error al actualizar la configuración");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
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

      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Store className="h-8 w-8" />
            Configuración de Tienda
          </h1>
          <p className="text-muted-foreground mt-2">
            Administra la información y ubicación de tu tienda física
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Información General */}
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
                <CardDescription>Datos básicos de la tienda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Tienda</FormLabel>
                      <FormControl>
                        <Input placeholder="FotoGifty - Tienda Principal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Teléfono
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="55-1234-5678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email (Opcional)
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="tienda@fotogifty.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Ubicación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Ubicación
                </CardTitle>
                <CardDescription>Dirección física y coordenadas para el mapa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="direccion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input placeholder="Av. Principal #123, Col. Centro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ciudad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ciudad</FormLabel>
                        <FormControl>
                          <Input placeholder="Ciudad de México" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input placeholder="CDMX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="codigo_postal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código Postal</FormLabel>
                        <FormControl>
                          <Input placeholder="01000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pais"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>País</FormLabel>
                        <FormControl>
                          <Input placeholder="México" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="latitud"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitud</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.000001"
                            placeholder="19.432608"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Usa <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google Maps</a> para obtener las coordenadas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="longitud"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitud</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.000001"
                            placeholder="-99.133209"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Haz clic derecho en el mapa → "¿Qué hay aquí?"
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Horarios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horarios de Atención
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="horario_lunes_viernes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lunes a Viernes</FormLabel>
                      <FormControl>
                        <Input placeholder="9:00 AM - 7:00 PM" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="horario_sabado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sábado</FormLabel>
                      <FormControl>
                        <Input placeholder="10:00 AM - 3:00 PM" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="horario_domingo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domingo</FormLabel>
                      <FormControl>
                        <Input placeholder="Cerrado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Información Adicional */}
            <Card>
              <CardHeader>
                <CardTitle>Información Adicional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descripción de la tienda..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instrucciones_llegada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instrucciones de Llegada</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Cómo llegar a la tienda..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Ayuda a los clientes a encontrar la tienda
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button type="submit" disabled={isSaving} size="lg">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Configuración
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}
```

---

### 2.4. Integración en el Carrito

Modificar: `src/app/user/cart/page.tsx`

```typescript
// Agregar al inicio del archivo
import { obtenerConfiguracionTienda } from "@/services/store-configuration";
import { StoreConfiguration } from "@/interfaces/store-config";

// Dentro del componente, agregar estado
const [storeConfig, setStoreConfig] = useState<StoreConfiguration | null>(null);

// Cargar configuración de tienda
useEffect(() => {
  const loadStoreConfig = async () => {
    try {
      const response = await obtenerConfiguracionTienda();
      if (response.success && response.data) {
        setStoreConfig(response.data);
      }
    } catch (error) {
      console.error('Error cargando configuración de tienda:', error);
    }
  };

  loadStoreConfig();
}, []);

// En el JSX, en la sección de método de entrega, reemplazar la info hardcodeada:
{deliveryMethod === 'recogida_tienda' && storeConfig && (
  <div className="mt-4 p-4 bg-muted rounded-lg">
    <h4 className="font-semibold mb-2 flex items-center gap-2">
      <MapPin className="h-5 w-5 text-primary" />
      {storeConfig.nombre}
    </h4>
    <div className="space-y-1 text-sm text-muted-foreground">
      <p>{storeConfig.direccion}</p>
      <p>{storeConfig.ciudad}, {storeConfig.estado} {storeConfig.codigo_postal}</p>
      <p className="flex items-center gap-2">
        <Phone className="h-4 w-4" />
        {storeConfig.telefono}
      </p>
      {storeConfig.horario_lunes_viernes && (
        <p className="flex items-center gap-2 mt-2">
          <Clock className="h-4 w-4" />
          {storeConfig.horario_lunes_viernes}
        </p>
      )}
      {storeConfig.instrucciones_llegada && (
        <p className="mt-2 text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
          <strong>Cómo llegar:</strong> {storeConfig.instrucciones_llegada}
        </p>
      )}
    </div>
  </div>
)}
```

---

### 2.5. Componente de Mapa para Landing Page

Crear: `src/components/landing-page/StoreLocationMap.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { MapPin, Phone, Clock, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { obtenerConfiguracionTienda } from "@/services/store-configuration";
import { StoreConfiguration } from "@/interfaces/store-config";

export default function StoreLocationMap() {
  const [config, setConfig] = useState<StoreConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await obtenerConfiguracionTienda();
        if (response.success && response.data) {
          setConfig(response.data);
        }
      } catch (error) {
        console.error('Error cargando configuración:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  const handleOpenMaps = () => {
    if (config) {
      const url = `https://www.google.com/maps/search/?api=1&query=${config.latitud},${config.longitud}`;
      window.open(url, '_blank');
    }
  };

  if (isLoading || !config) {
    return null;
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Visítanos en Nuestra Tienda
          </h2>
          <p className="text-lg text-muted-foreground">
            Recoge tus pedidos o consulta nuestro catálogo en persona
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Mapa */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <iframe
                src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1000!2d${config.longitud}!3d${config.latitud}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1ses!2smx!4v1234567890`}
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-[400px]"
              />
            </CardContent>
          </Card>

          {/* Información */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-6 w-6 text-primary" />
                {config.nombre}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dirección */}
              <div>
                <h3 className="font-semibold mb-2">Dirección</h3>
                <p className="text-muted-foreground">{config.direccion}</p>
                <p className="text-muted-foreground">
                  {config.ciudad}, {config.estado} {config.codigo_postal}
                </p>
                <p className="text-muted-foreground">{config.pais}</p>
              </div>

              {/* Teléfono */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Teléfono
                </h3>
                <a href={`tel:${config.telefono}`} className="text-primary hover:underline">
                  {config.telefono}
                </a>
              </div>

              {/* Horarios */}
              {(config.horario_lunes_viernes || config.horario_sabado || config.horario_domingo) && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Horarios de Atención
                  </h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {config.horario_lunes_viernes && <p>{config.horario_lunes_viernes}</p>}
                    {config.horario_sabado && <p>{config.horario_sabado}</p>}
                    {config.horario_domingo && <p>{config.horario_domingo}</p>}
                  </div>
                </div>
              )}

              {/* Instrucciones */}
              {config.instrucciones_llegada && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Cómo llegar</h3>
                  <p className="text-sm text-muted-foreground">{config.instrucciones_llegada}</p>
                </div>
              )}

              {/* Botón de navegación */}
              <Button onClick={handleOpenMaps} className="w-full gap-2">
                <Navigation className="h-4 w-4" />
                Abrir en Google Maps
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
```

Integrar en: `src/app/(presentation)/page.tsx`

```typescript
import StoreLocationMap from "@/components/landing-page/StoreLocationMap";

// Agregar al final antes del Footer
<StoreLocationMap />
```

---

## 📝 Resumen de Implementación

### Backend (Tu equipo):
1. ✅ Crear tabla `configuracion_tienda`
2. ✅ Implementar `GET /api/configuracion-tienda` (público)
3. ✅ Implementar `PUT /api/configuracion-tienda` (admin)
4. ✅ Middleware de validación de roles
5. ✅ Insertar datos por defecto

### Frontend (Yo implementaré):
1. ✅ Interfaces TypeScript
2. ✅ Servicio API
3. ✅ Página de admin (`/admin/store-settings`)
4. ✅ Integración en carrito
5. ✅ Componente de mapa para landing
6. ✅ Agregar link en menú de admin

### Tiempo Estimado:
- **Backend**: 3-4 horas
- **Frontend**: 4-5 horas
- **Total**: 7-9 horas

---

## 🚀 Orden de Implementación Recomendado

1. **Backend primero**: Crear tabla y endpoints
2. **Frontend admin**: Crear página de configuración
3. **Frontend carrito**: Integrar en el flujo de compra
4. **Frontend landing**: Agregar mapa
5. **Testing**: Probar todo el flujo

---

## 📌 Notas Importantes

- Las coordenadas se pueden obtener en Google Maps (clic derecho → "¿Qué hay aquí?")
- El mapa usa Google Maps Embed API (no requiere API key para uso básico)
- Solo debe haber UN registro en la tabla `configuracion_tienda`
- Solo admins/super_admins pueden actualizar la configuración
- La configuración es pública (cualquiera puede consultarla)

---

¿Quieres que empiece con la implementación del frontend ahora o prefieres que tu equipo termine el backend primero?
