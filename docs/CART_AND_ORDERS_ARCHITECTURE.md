# Arquitectura del Carrito de Compras y Sistema de Pedidos - FotoGifty

## Índice
1. [Carrito de Compras (Frontend)](#carrito-de-compras-frontend)
2. [Sistema de Pedidos (Backend)](#sistema-de-pedidos-backend)
3. [Flujo Completo de Pedidos](#flujo-completo-de-pedidos)
4. [Integración con Stripe](#integración-con-stripe)

---

## Carrito de Compras (Frontend)

### Ubicación
- **Store**: `src/stores/cart-store.ts`
- **Persistencia**: LocalStorage (Zustand persist)
- **Estado**: Cliente únicamente

### Estructura de Datos

```typescript
interface CartItem {
  id: number;                    // ID del paquete
  productCategory: string;       // Ej: "Fotografía Impresa"
  itemImage: string;             // URL de la imagen
  name: string;                  // Nombre del paquete
  itemPrice: number;             // Precio unitario
  quantity: number;              // Cantidad seleccionada
  numOfRequiredImages: number;   // Fotos requeridas
}

interface CartTotals {
  subtotal: number;              // Suma de items
  iva: number;                   // 16% del subtotal
  total: number;                 // Subtotal + IVA
}
```

### Funcionalidades del Store

```typescript
// src/stores/cart-store.ts
interface CartState {
  items: CartItem[];
  
  // Operaciones CRUD
  addItem: (productName: string, selectedPackage: ShopItem) => void;
  removeItem: (itemId: number) => void;
  increaseQuantity: (itemId: number) => void;
  decreaseQuantity: (itemId: number) => void;
  clearCart: () => void;
  
  // Cálculos
  getTotals: () => CartTotals;
}
```

### Flujo en el Cliente

```
1. Usuario navega productos
   ↓
2. Selecciona paquete → addItem()
   ↓
3. Modifica cantidades → increase/decreaseQuantity()
   ↓
4. Ve resumen → getTotals()
   ↓
5. Procede a checkout → Envía a Stripe
   ↓
6. Pago exitoso → clearCart()
```

### Ventajas
- ✅ Sin latencia de red
- ✅ Funciona offline
- ✅ No requiere autenticación
- ✅ Persiste entre sesiones
- ✅ Cero carga al servidor

---

## Sistema de Pedidos (Backend)

### Endpoints API

```
POST   /api/orders              → Crear pedido (webhook Stripe)
GET    /api/orders              → Listar pedidos (filtros por status)
GET    /api/orders/:id          → Obtener pedido específico
PATCH  /api/orders/:id/status   → Actualizar estado del pedido
POST   /api/orders/:id/images   → Subir imágenes del cliente
GET    /api/orders/:id/images   → Obtener imágenes del pedido
```

### Modelo de Datos

```typescript
interface Order {
  // Identificación
  orderId: number;                    // ID autoincremental
  stripePaymentIntentId: string;      // ID de pago de Stripe
  stripeSessionId: string;            // ID de sesión de Stripe
  
  // Cliente
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  
  // Dirección de envío
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Pedido
  dateOfOrder: string;                // ISO 8601 format
  orderItems: OrderItem[];
  
  // Estados
  status: OrderStatus;                // Estado de producción
  paymentStatus: PaymentStatus;       // Estado de pago
  
  // Imágenes
  images: string[];                   // URLs de S3/Cloudinary
  
  // Totales
  subtotal: number;
  iva: number;
  total: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  productName: string;                // Ej: "Fotografía Impresa"
  package: string;                    // Ej: "Paquete Básico"
  itemPrice: number;                  // Precio unitario
  quantity: number;                   // Cantidad
  numOfRequiredImages: number;        // Fotos necesarias
}

type OrderStatus = 
  | "Pendiente"      // Pago confirmado, esperando fotos
  | "Enviado"        // Cliente subió las fotos
  | "Imprimiendo"    // En proceso de impresión
  | "Empaquetado"    // Listo para envío
  | "En reparto"     // En camino al cliente
  | "Entregado"      // Completado
  | "Archivado";     // Archivado

type PaymentStatus = 
  | "pending"        // Pago pendiente
  | "paid"           // Pagado exitosamente
  | "failed"         // Pago fallido
  | "refunded";      // Reembolsado
```

### Base de Datos (Sugerencia)

```sql
-- Tabla de pedidos
CREATE TABLE orders (
  order_id SERIAL PRIMARY KEY,
  stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_session_id VARCHAR(255) UNIQUE NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50),
  shipping_address JSONB NOT NULL,
  date_of_order TIMESTAMP NOT NULL,
  status VARCHAR(50) NOT NULL,
  payment_status VARCHAR(50) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  iva DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de items del pedido
CREATE TABLE order_items (
  item_id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  package VARCHAR(255) NOT NULL,
  item_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  num_of_required_images INTEGER NOT NULL
);

-- Tabla de imágenes
CREATE TABLE order_images (
  image_id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_client_email ON orders(client_email);
CREATE INDEX idx_orders_stripe_payment_intent ON orders(stripe_payment_intent_id);
```

---

## Flujo Completo de Pedidos

### 1. Fase de Compra (Cliente)

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENTE (Frontend)                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Usuario agrega productos al carrito                    │
│     → useCartStore.addItem()                               │
│     → Guardado en LocalStorage                             │
│                                                             │
│  2. Usuario revisa carrito                                 │
│     → useCartStore.getTotals()                             │
│     → Muestra: Subtotal, IVA, Total                        │
│                                                             │
│  3. Usuario hace click en "Proceder al Pago"              │
│     → Recopila: nombre, email, dirección                   │
│     → Valida formulario                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
```

### 2. Fase de Pago (Stripe)

```
┌─────────────────────────────────────────────────────────────┐
│ STRIPE CHECKOUT                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  4. Frontend llama a API Route                             │
│     POST /api/checkout                                      │
│     Body: {                                                 │
│       items: CartItem[],                                    │
│       customerEmail: string,                                │
│       customerName: string,                                 │
│       shippingAddress: Address                              │
│     }                                                       │
│                                                             │
│  5. Backend crea sesión de Stripe                          │
│     → stripe.checkout.sessions.create()                    │
│     → Incluye metadata con info del pedido                 │
│     → Retorna sessionId                                    │
│                                                             │
│  6. Frontend redirige a Stripe                             │
│     → stripe.redirectToCheckout({ sessionId })             │
│                                                             │
│  7. Usuario completa pago en Stripe                        │
│     → Ingresa datos de tarjeta                             │
│     → Stripe procesa pago                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
```

### 3. Fase de Confirmación (Webhook)

```
┌─────────────────────────────────────────────────────────────┐
│ WEBHOOK DE STRIPE                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  8. Stripe envía evento "checkout.session.completed"       │
│     POST /api/webhooks/stripe                               │
│                                                             │
│  9. Backend verifica firma del webhook                      │
│     → stripe.webhooks.constructEvent()                     │
│                                                             │
│  10. Backend extrae datos de la sesión                     │
│      → session.payment_intent                              │
│      → session.customer_email                              │
│      → session.metadata (orderItems, customerName, etc)    │
│                                                             │
│  11. Backend crea pedido en base de datos                  │
│      POST http://backend-api/api/orders                     │
│      Body: {                                                │
│        stripePaymentIntentId: string,                       │
│        stripeSessionId: string,                             │
│        clientName: string,                                  │
│        clientEmail: string,                                 │
│        shippingAddress: Address,                            │
│        orderItems: OrderItem[],                             │
│        subtotal: number,                                    │
│        iva: number,                                         │
│        total: number,                                       │
│        status: "Pendiente",                                 │
│        paymentStatus: "paid"                                │
│      }                                                      │
│                                                             │
│  12. Backend retorna orderId                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
```

### 4. Fase de Confirmación (Cliente)

```
┌─────────────────────────────────────────────────────────────┐
│ PÁGINA DE ÉXITO                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  13. Stripe redirige a success_url                         │
│      /order/success?session_id={CHECKOUT_SESSION_ID}       │
│                                                             │
│  14. Frontend obtiene detalles de la sesión                │
│      GET /api/checkout/session?session_id=xxx              │
│                                                             │
│  15. Frontend busca el pedido creado                       │
│      GET /api/orders?stripeSessionId=xxx                   │
│                                                             │
│  16. Frontend muestra confirmación                         │
│      → Número de pedido                                    │
│      → Resumen de compra                                   │
│      → Instrucciones para subir fotos                      │
│                                                             │
│  17. Frontend limpia el carrito                            │
│      → useCartStore.clearCart()                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
```

### 5. Fase de Subida de Imágenes

```
┌─────────────────────────────────────────────────────────────┐
│ SUBIDA DE FOTOS                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  18. Cliente accede a página de subida                     │
│      /order/upload?orderId=123                             │
│                                                             │
│  19. Cliente selecciona imágenes                           │
│      → Validación: formato, tamaño, cantidad               │
│      → Preview de imágenes                                 │
│                                                             │
│  20. Cliente sube imágenes                                 │
│      POST /api/orders/123/images                           │
│      → Multipart form data                                 │
│      → Backend sube a S3/Cloudinary                        │
│      → Retorna URLs de las imágenes                        │
│                                                             │
│  21. Backend actualiza estado del pedido                   │
│      PATCH /api/orders/123/status                          │
│      Body: { status: "Enviado" }                           │
│                                                             │
│  22. Cliente recibe confirmación                           │
│      → Email de confirmación                               │
│      → Notificación en pantalla                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
```

### 6. Fase de Producción (Admin)

```
┌─────────────────────────────────────────────────────────────┐
│ PANEL DE ADMINISTRACIÓN                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  23. Admin ve pedidos pendientes                           │
│      GET /api/orders?status=Enviado                        │
│                                                             │
│  24. Admin revisa imágenes del pedido                      │
│      GET /api/orders/123/images                            │
│                                                             │
│  25. Admin actualiza estado según progreso                 │
│      PATCH /api/orders/123/status                          │
│                                                             │
│      Estados:                                               │
│      Enviado → Imprimiendo → Empaquetado → En reparto     │
│                                                             │
│  26. Cliente recibe notificaciones de cambio de estado     │
│      → Email automático                                    │
│      → Puede rastrear en /order/track/123                  │
│                                                             │
│  27. Pedido completado                                     │
│      PATCH /api/orders/123/status                          │
│      Body: { status: "Entregado" }                         │
│                                                             │
│  28. Después de X días → Archivar                          │
│      PATCH /api/orders/123/status                          │
│      Body: { status: "Archivado" }                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Integración con Stripe

### Variables de Entorno

```env
# Frontend (.env.local)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_URL=http://localhost:3000

# Backend (.env)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
BACKEND_API_URL=http://localhost:3001
```

### Configuración de Stripe

```typescript
// lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});
```

### API Route: Crear Sesión de Checkout

```typescript
// app/api/checkout/route.ts
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  const { items, customerEmail, customerName, shippingAddress } = await req.json();
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: items.map((item: CartItem) => ({
      price_data: {
        currency: 'mxn',
        product_data: {
          name: `${item.productCategory} - ${item.name}`,
          images: [item.itemImage],
          metadata: {
            numOfRequiredImages: item.numOfRequiredImages.toString(),
          },
        },
        unit_amount: Math.round(item.itemPrice * 100), // Centavos
      },
      quantity: item.quantity,
    })),
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/cart`,
    customer_email: customerEmail,
    metadata: {
      customerName,
      shippingAddress: JSON.stringify(shippingAddress),
      orderItems: JSON.stringify(items),
    },
  });

  return Response.json({ sessionId: session.id });
}
```

### API Route: Webhook de Stripe

```typescript
// app/api/webhooks/stripe/route.ts
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Crear pedido en backend
    const orderData = {
      stripePaymentIntentId: session.payment_intent as string,
      stripeSessionId: session.id,
      clientEmail: session.customer_email!,
      clientName: session.metadata!.customerName,
      shippingAddress: JSON.parse(session.metadata!.shippingAddress),
      orderItems: JSON.parse(session.metadata!.orderItems),
      subtotal: (session.amount_subtotal! / 100),
      iva: ((session.amount_total! - session.amount_subtotal!) / 100),
      total: (session.amount_total! / 100),
      status: 'Pendiente',
      paymentStatus: 'paid',
      dateOfOrder: new Date().toISOString(),
    };
    
    await fetch(`${process.env.BACKEND_API_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
  }

  return Response.json({ received: true });
}
```

### Componente: Botón de Checkout

```typescript
// components/user/CheckoutButton.tsx
'use client';

import { useCartStore } from '@/stores/cart-store';
import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function CheckoutButton({ customerData }: Props) {
  const { items, getTotals } = useCartStore();
  const [loading, setLoading] = useState(false);
  
  const handleCheckout = async () => {
    setLoading(true);
    
    const stripe = await stripePromise;
    
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        customerEmail: customerData.email,
        customerName: customerData.name,
        shippingAddress: customerData.address,
      }),
    });
    
    const { sessionId } = await res.json();
    
    await stripe?.redirectToCheckout({ sessionId });
    
    setLoading(false);
  };

  return (
    <button onClick={handleCheckout} disabled={loading || items.length === 0}>
      {loading ? 'Procesando...' : `Pagar $${getTotals().total} MXN`}
    </button>
  );
}
```

---

## Diagrama de Estados del Pedido

```
┌──────────────┐
│  Pendiente   │ ← Pago confirmado, esperando fotos
└──────┬───────┘
       │ Cliente sube fotos
       ↓
┌──────────────┐
│   Enviado    │ ← Fotos recibidas
└──────┬───────┘
       │ Admin inicia impresión
       ↓
┌──────────────┐
│ Imprimiendo  │ ← En proceso de impresión
└──────┬───────┘
       │ Impresión completa
       ↓
┌──────────────┐
│ Empaquetado  │ ← Listo para envío
└──────┬───────┘
       │ Enviado a paquetería
       ↓
┌──────────────┐
│  En reparto  │ ← En camino al cliente
└──────┬───────┘
       │ Cliente recibe pedido
       ↓
┌──────────────┐
│  Entregado   │ ← Pedido completado
└──────┬───────┘
       │ Después de 30 días
       ↓
┌──────────────┐
│  Archivado   │ ← Pedido archivado
└──────────────┘
```

---

## Resumen de Responsabilidades

### Frontend (Next.js)
- ✅ Gestión del carrito (Zustand + LocalStorage)
- ✅ UI de productos y checkout
- ✅ Integración con Stripe Checkout
- ✅ Subida de imágenes
- ✅ Seguimiento de pedidos
- ✅ Panel de administración

### Backend (API)
- ✅ Crear pedidos (vía webhook)
- ✅ Almacenar pedidos en base de datos
- ✅ Gestionar estados de pedidos
- ✅ Almacenar imágenes (S3/Cloudinary)
- ✅ Endpoints de consulta

### Stripe
- ✅ Procesamiento de pagos
- ✅ Validación de precios
- ✅ Webhooks de confirmación
- ✅ Gestión de reembolsos
- ✅ Dashboard de transacciones

---

## Seguridad

### Frontend
- Nunca exponer claves secretas
- Validar formularios antes de enviar
- Sanitizar inputs del usuario
- Usar HTTPS en producción

### Backend
- Verificar firma de webhooks de Stripe
- Validar datos antes de guardar en BD
- Usar variables de entorno para secretos
- Implementar rate limiting
- Logs de todas las transacciones

### Stripe
- Usar claves de test en desarrollo
- Configurar webhooks solo desde IPs de Stripe
- Habilitar 3D Secure para pagos
- Monitorear transacciones sospechosas

---

## Próximos Pasos

1. ✅ Mantener carrito actual en Zustand
2. 🔄 Instalar Stripe SDK: `npm install stripe @stripe/stripe-js`
3. 🔄 Crear API routes de checkout y webhook
4. 🔄 Configurar webhook en dashboard de Stripe
5. 🔄 Implementar backend endpoints de pedidos
6. 🔄 Crear página de éxito y subida de imágenes
7. 🔄 Implementar panel de admin para pedidos
8. 🔄 Configurar almacenamiento de imágenes (S3/Cloudinary)
9. 🔄 Implementar sistema de notificaciones por email
10. 🔄 Testing completo del flujo

---

**Fecha de creación**: 2025-11-20  
**Versión**: 1.0
