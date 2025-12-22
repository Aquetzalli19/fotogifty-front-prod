# Especificación de Integración de Pagos con Stripe

## Resumen

Este documento define los endpoints y flujos necesarios para integrar Stripe Checkout con el sistema de pedidos de FotoGifty.

---

## Flujo Recomendado: Stripe Checkout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         FLUJO COMPLETO DE COMPRA                             │
└──────────────────────────────────────────────────────────────────────────────┘

  FRONTEND                           BACKEND                           STRIPE
     │                                  │                                 │
     │  1. Usuario completa carrito     │                                 │
     │     y selecciona dirección       │                                 │
     │                                  │                                 │
     │  2. POST /api/checkout/crear-sesion                                │
     │     {items, direccion, usuario}  │                                 │
     │  ────────────────────────────────>                                 │
     │                                  │                                 │
     │                                  │  3. Crear Checkout Session      │
     │                                  │  ──────────────────────────────>│
     │                                  │                                 │
     │                                  │  4. Devuelve session_id + url   │
     │                                  │<────────────────────────────────│
     │                                  │                                 │
     │  5. Recibe {session_id, url}     │                                 │
     │<──────────────────────────────────                                 │
     │                                  │                                 │
     │  6. Redirige a Stripe Checkout   │                                 │
     │  ─────────────────────────────────────────────────────────────────>│
     │                                  │                                 │
     │                                  │                                 │
     │              [Usuario paga en página de Stripe]                    │
     │                                  │                                 │
     │                                  │  7. Webhook: payment_intent.succeeded
     │                                  │<────────────────────────────────│
     │                                  │                                 │
     │                                  │  8. Crear pedido en BD          │
     │                                  │     estado_pago: 'paid'         │
     │                                  │                                 │
     │  9. Stripe redirige a success_url                                  │
     │     /user/order-success?session_id=xxx                             │
     │<───────────────────────────────────────────────────────────────────│
     │                                  │                                 │
     │  10. GET /api/checkout/verificar-sesion/{session_id}               │
     │  ────────────────────────────────>                                 │
     │                                  │                                 │
     │  11. Recibe datos del pedido     │                                 │
     │<──────────────────────────────────                                 │
     │                                  │                                 │
     │  12. POST /api/pedidos/{id}/imagenes                               │
     │      [Sube las fotos editadas]   │                                 │
     │  ────────────────────────────────>                                 │
     │                                  │                                 │
```

---

## Endpoints Requeridos

### 1. Crear Sesión de Checkout

```
POST /api/checkout/crear-sesion
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "id_usuario": 1,
  "id_direccion": 5,
  "nombre_cliente": "Juan Pérez",
  "email_cliente": "juan@ejemplo.com",
  "telefono_cliente": "+52 555 123 4567",
  "items": [
    {
      "id_paquete": 1,
      "nombre_paquete": "Pack Básico 10 Fotos",
      "categoria_paquete": "Fotos Impresas",
      "precio_unitario": 29.99,
      "cantidad": 2,
      "num_fotos_requeridas": 20
    },
    {
      "id_paquete": 3,
      "nombre_paquete": "Calendario Personalizado",
      "categoria_paquete": "Calendarios",
      "precio_unitario": 19.99,
      "cantidad": 1,
      "num_fotos_requeridas": 12
    }
  ],
  "subtotal": 79.97,
  "iva": 12.80,
  "total": 92.77,
  "success_url": "https://fotogifty.com/user/order-success?session_id={CHECKOUT_SESSION_ID}",
  "cancel_url": "https://fotogifty.com/user/cart"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "session_id": "cs_test_a1b2c3d4e5f6g7h8i9j0",
    "url": "https://checkout.stripe.com/c/pay/cs_test_a1b2c3d4..."
  }
}
```

**Lógica del Backend:**
```javascript
// 1. Validar datos de entrada
// 2. Verificar que el usuario exista
// 3. Verificar que la dirección pertenezca al usuario
// 4. Verificar que los paquetes existan y tengan los precios correctos
// 5. Crear Checkout Session en Stripe

const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  mode: 'payment',
  customer_email: email_cliente,
  line_items: items.map(item => ({
    price_data: {
      currency: 'mxn',
      product_data: {
        name: item.nombre_paquete,
        description: item.categoria_paquete,
      },
      unit_amount: Math.round(item.precio_unitario * 100), // En centavos
    },
    quantity: item.cantidad,
  })),
  // Agregar IVA como línea separada (opcional)
  // O incluirlo en el precio de cada producto
  metadata: {
    id_usuario: id_usuario.toString(),
    id_direccion: id_direccion.toString(),
    items_json: JSON.stringify(items),
    subtotal: subtotal.toString(),
    iva: iva.toString(),
  },
  success_url: success_url,
  cancel_url: cancel_url,
});

// 6. Guardar session_id temporalmente (opcional, para tracking)
// 7. Retornar session_id y url
```

---

### 2. Webhook de Stripe

```
POST /api/webhooks/stripe
Content-Type: application/json
Stripe-Signature: <signature>
```

**Eventos a manejar:**

| Evento | Acción |
|--------|--------|
| `checkout.session.completed` | Crear pedido con estado_pago: 'paid' |
| `checkout.session.expired` | Limpiar datos temporales (opcional) |
| `payment_intent.payment_failed` | Notificar al usuario (opcional) |

**Lógica del Webhook:**
```javascript
const sig = request.headers['stripe-signature'];
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

let event;
try {
  event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
} catch (err) {
  return response.status(400).send(`Webhook Error: ${err.message}`);
}

if (event.type === 'checkout.session.completed') {
  const session = event.data.object;

  // Extraer metadata
  const { id_usuario, id_direccion, items_json, subtotal, iva } = session.metadata;
  const items = JSON.parse(items_json);

  // Crear pedido en la base de datos
  const pedido = await crearPedido({
    id_usuario: parseInt(id_usuario),
    id_direccion: parseInt(id_direccion),
    id_sesion_stripe: session.id,
    id_pago_stripe: session.payment_intent,
    nombre_cliente: session.customer_details.name,
    email_cliente: session.customer_details.email,
    items_pedido: items,
    estado: 'Pendiente',
    estado_pago: 'paid',
    subtotal: parseFloat(subtotal),
    iva: parseFloat(iva),
    total: session.amount_total / 100,
  });

  // Opcional: Enviar email de confirmación
}

response.status(200).json({ received: true });
```

---

### 3. Verificar Sesión de Checkout

```
GET /api/checkout/verificar-sesion/{session_id}
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "complete",
    "payment_status": "paid",
    "pedido": {
      "id": 42,
      "estado": "Pendiente",
      "estado_pago": "paid",
      "total": 92.77,
      "items_pedido": [...],
      "creado_en": "2025-12-15T10:30:00.000Z"
    }
  }
}
```

**Response si el pago no se completó:**
```json
{
  "success": true,
  "data": {
    "status": "open",
    "payment_status": "unpaid",
    "pedido": null
  }
}
```

---

### 4. Subir Imágenes al Pedido

```
POST /api/pedidos/{id}/imagenes
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
imagenes[]: File (imagen1.png)
imagenes[]: File (imagen2.png)
imagenes[]: File (imagen3.png)
...
metadata: JSON string con info de cada imagen (opcional)
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "pedido_id": 42,
    "imagenes_subidas": 12,
    "urls": [
      "https://s3.amazonaws.com/fotogifty/pedidos/42/img1.png",
      "https://s3.amazonaws.com/fotogifty/pedidos/42/img2.png",
      ...
    ]
  }
}
```

---

## Variables de Entorno Requeridas

```env
# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# URLs del Frontend
FRONTEND_URL=https://fotogifty.com

# AWS S3 (para imágenes)
AWS_ACCESS_KEY_ID=xxxxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_S3_BUCKET=fotogifty-images
AWS_REGION=us-east-1
```

---

## Configuración de Stripe Dashboard

### 1. Crear Webhook

1. Ir a **Developers > Webhooks** en el dashboard de Stripe
2. Click en **Add endpoint**
3. URL: `https://tu-api.com/api/webhooks/stripe`
4. Seleccionar eventos:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
5. Copiar el **Signing secret** a `STRIPE_WEBHOOK_SECRET`

### 2. Modo de Prueba

Usar tarjetas de prueba:
- **Éxito**: `4242 4242 4242 4242`
- **Requiere autenticación**: `4000 0025 0000 3155`
- **Rechazada**: `4000 0000 0000 9995`

---

## Modelo de Datos Actualizado

### Tabla: pedidos (agregar campos)

```sql
ALTER TABLE pedidos ADD COLUMN id_sesion_stripe VARCHAR(255);
ALTER TABLE pedidos ADD COLUMN id_pago_stripe VARCHAR(255);
```

### Estados de Pago

| Valor | Descripción |
|-------|-------------|
| `pending` | Pago pendiente (checkout iniciado pero no completado) |
| `paid` | Pago completado exitosamente |
| `failed` | Pago fallido |
| `refunded` | Pago reembolsado |

---

## Flujo del Frontend (Resumen)

```typescript
// 1. Usuario hace clic en "Pagar"
const response = await crearSesionCheckout({
  id_usuario: user.id,
  id_direccion: selectedAddress.id,
  nombre_cliente: user.nombre,
  email_cliente: user.email,
  items: cartItems,
  subtotal,
  iva,
  total,
  success_url: `${window.location.origin}/user/order-success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${window.location.origin}/user/cart`,
});

// 2. Redirigir a Stripe
window.location.href = response.data.url;

// 3. Después del pago, en /user/order-success
const sessionId = searchParams.get('session_id');
const result = await verificarSesion(sessionId);

if (result.data.status === 'complete') {
  // 4. Subir imágenes
  await subirImagenes(result.data.pedido.id, customizationImages);
  // 5. Mostrar confirmación
}
```

---

## Preguntas para el Backend

1. ¿Ya tienen la librería de Stripe instalada? (`npm install stripe`)
2. ¿Prefieren manejar el IVA como línea separada o incluido en precios?
3. ¿Necesitan soporte para múltiples monedas o solo MXN?
4. ¿El upload de imágenes va a S3 o a otro servicio?

---

## Siguiente Paso

Una vez que el backend implemente estos endpoints, yo implementaré en el frontend:

1. Servicio `src/services/checkout.ts`
2. Selector de dirección en paso 3
3. Página `/user/order-success`
4. Lógica de subida de imágenes
