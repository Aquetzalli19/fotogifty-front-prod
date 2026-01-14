# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FotoGifty is a Next.js 15 photo printing e-commerce platform with an integrated photo editor. The application supports three main user roles: public visitors, authenticated users, and administrators.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

## Environment Configuration

El proyecto usa variables de entorno para configuración. Copia `.env.example` a `.env.local`:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**Variables disponibles**:
- `NEXT_PUBLIC_API_URL`: URL base del backend API (usada por el proxy de Next.js configurado en `next.config.ts`)
- Stripe keys (futuro): `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Store information (para opción de recoger en tienda): `NEXT_PUBLIC_STORE_NAME`, `NEXT_PUBLIC_STORE_ADDRESS`, `NEXT_PUBLIC_STORE_CITY`, `NEXT_PUBLIC_STORE_STATE`, `NEXT_PUBLIC_STORE_ZIP`, `NEXT_PUBLIC_STORE_PHONE`, `NEXT_PUBLIC_STORE_HOURS`

### API Proxy Configuration

El proyecto usa **rewrites de Next.js** para hacer proxy de las peticiones API, evitando problemas de CORS:

- **Desarrollo**: Todas las peticiones a `/api/*` se redirigen a `http://localhost:3001/api/*`
- **Producción**: Las peticiones se redirigen a la URL configurada en `NEXT_PUBLIC_API_URL`
- **Configuración**: Ver `next.config.ts` función `rewrites()`
- **Uso en código**: Todas las peticiones usan `/api` como base (ver `src/lib/config.ts`)

**Ventajas del proxy**:
- ✅ Sin problemas de CORS
- ✅ URL del backend oculta al cliente
- ✅ Mismo dominio en cliente y servidor
- ✅ Fácil cambio de backend sin modificar código

### Next.js Image Configuration

El proyecto tiene configurados patrones de imágenes remotas en `next.config.ts`:

```typescript
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "encrypted-tbn0.gstatic.com", // Google images (legacy)
      pathname: "/images/**",
    },
    {
      protocol: "https",
      hostname: "fotogifty.s3.us-east-1.amazonaws.com", // AWS S3 bucket
      pathname: "/fotos/**",
    },
  ],
}
```

**Importante**: Para usar `next/image` con nuevas fuentes, agregar el hostname a `remotePatterns`

## Architecture

### Route Structure

The application uses Next.js App Router with route groups for role-based layouts:

- **Public routes** (`/app/(presentation)/`): Landing page, login, signup
  - Layout includes NavBar, Footer, and ThemeProvider

- **User routes** (`/app/user/`): Authenticated user interface
  - `/user/(presentation)/page.tsx` - Product catalogue
  - `/user/(presentation)/profile/page.tsx` - User profile management
  - `/user/(presentation)/backlog/page.tsx` - Order history
  - `/user/editor/page.tsx` - Photo editor
  - `/user/cart/page.tsx` - Shopping cart

- **Admin routes** (`/app/admin/`): Admin dashboard
  - `/admin/(delivercontrol)/` - Order tracking and delivery management
  - `/admin/itemcontrol/` - Product inventory management
  - `/admin/addItem/` - Add new products to catalogue
  - `/admin/categories/` - Category management
  - `/admin/users/` - User management
  - `/admin/analytics/` - Analytics dashboard with KPIs, charts, sales data
    - Requires backend implementation (see `ANALYTICS_ENDPOINTS_SPEC.md`)
  - Layout includes admin navigation and authentication check

- **Store routes** (`/app/store/`): Point-of-sale interface
  - Separate login for store employees
  - Uses store-specific components from `src/components/store/`

- **Test routes** (development only):
  - `/test` - Development testing page
  - `/test-api` - API connection testing page

### State Management

**Zustand stores**:
- `src/stores/cart-store.ts`: Shopping cart management
  - Persisted to localStorage as `shopping-cart-storage-final`
  - Handles item quantities, totals, and cart operations
  - **Important**: Prices already include IVA - no additional tax calculation
- `src/stores/auth-store.ts`: Authentication state management
  - Stores user data, token, and authentication status
  - Methods: `login()`, `logout()`, `updateUserData()`
- `src/stores/cart-step-store.ts`: Shopping cart checkout flow state
- `src/stores/customization-store.ts`: Photo editor customizations per cart item
  - Persisted to localStorage as `customization-storage`
  - Stores images, transformations, effects for Standard/Calendar/Polaroid editors
  - Manages multiple instances per cart item (e.g., 3 separate customizations for quantity=3)
  - Methods: `saveCustomization()`, `getCustomization()`, `removeCustomization()`, `isInstanceComplete()`

### Key Features

**Photo Editors** (3 types based on product category):

1. **Standard Editor** (`src/app/user/editor/StandardEditor.tsx`):
   - Canvas-based image editing with configurable dimensions from package
   - Mobile-first responsive design with touch event support
   - Implements Command pattern for undo/redo via `useHistory` hook
   - Transformations: scale, rotation, mirror (X/Y), position (drag/drop and touch)
   - Effects: brightness, contrast, saturation, sepia (custom pixel manipulation)
   - Canvas styling: background color, border color/width
   - Export: PNG with 300 DPI embedded metadata via `png-dpi.ts`
   - Rendering utilities: `src/lib/standard-render-utils.ts`

2. **Calendar Editor** (`src/components/editor-components/CalendarEditor.tsx`):
   - 12-month calendar with photo area at 52% top (configurable in `CALENDAR_AREA_CONFIG.md`)
   - Template-based: loads PNG template and composites photo behind it
   - Photo area dimensions auto-detected from template (typically 2400×3600px)
   - Basic transformations: scale, position (no rotation/effects)
   - Export: Cropped photo area only (without template) for backend printing
   - Rendering utilities: `src/lib/calendar-render-utils.ts`

3. **Polaroid Editor** (`src/components/editor-components/PolaroidEditor.tsx`):
   - Polaroid-style frame with white border and caption area
   - Basic transformations: scale, position within polaroid frame
   - Rendering utilities: `src/lib/polaroid-render-utils.ts`

**Editor Type Detection** (`src/lib/category-utils.ts`):
- Auto-detects editor type from category name (case-insensitive):
  - "calendario"/"calendar" → `calendar` editor
  - "polaroid" → `polaroid` editor
  - Others → `standard` editor
- `EditorType` preserved throughout: ProductCard → Cart → Editor
- See `EDITOR_TYPE_USAGE.md` for complete guide

**Shared utilities**:
- `src/lib/canvas-utils.ts`: Transformation matrix operations (MIT licensed from Igor Zinken)
- `src/lib/canvas-operations.ts`: Canvas manipulation helpers
- `src/lib/png-dpi.ts`: Embed 300 DPI metadata in PNG files
- `src/lib/image-compression.ts`: Compress images for upload

**Component Organization**:
- `src/components/landing-page/`: Marketing sections for homepage
- `src/components/user/`: User-facing features (navbar, profile, product catalogue, cart)
  - `DownloadFotoButton.tsx`: Download individual photo (Admin/Store only)
  - `DownloadPedidoFotos.tsx`: Download all photos from an order (Admin/Store only)
- `src/components/admin/`: Admin dashboard components (analytics, order management)
- `src/components/store/`: Store (point-of-sale) components
- `src/components/address/`: Address management forms and displays
- `src/components/common/`: Shared components used across multiple sections
- `src/components/ui/`: shadcn/ui components (Radix UI-based primitives)
- `src/components/editor-components/`: Photo editor tabs and controls
  - `CalendarEditor.tsx`: Calendar-specific editor
  - `PolaroidEditor.tsx`: Polaroid-specific editor
  - `TransformTab.tsx`, `AdjustTab.tsx`, `BackgroundTab.tsx`: Standard editor tabs
  - `FilterPreview.tsx`, `DownloadPreview.tsx`: Shared previews
- `src/components/ProtectedRoute.tsx`: Route protection wrapper component

### Styling & UI

- **TailwindCSS** with custom configuration (`tailwind.config.js` via `@tailwindcss/postcss`)
- **Fonts**: Raleway (primary) and Poppins from Google Fonts
- **Dark mode**: next-themes with system preference support via `ThemeProvider` in `src/providers/`
- **UI Library**: Radix UI primitives + custom shadcn/ui components
- **Animations**: Framer Motion via `motion` package and Lenis for smooth scrolling
- **Component configuration**: `components.json` for shadcn/ui component generation

### Forms & Validation

- **react-hook-form** + **@hookform/resolvers** for form handling
- **Zod v4.1.8** for schema validation
  - `src/validations/user-schema.ts` - User data validation
  - `src/validations/item-package-schema.ts` - Product validation

### Data Visualization & Export

- **recharts**: Chart library for analytics dashboard
- **xlsx**: Excel export functionality for admin reports

### TypeScript Configuration

- Import alias: `@/*` maps to `./src/*`
- Target: ES2017
- Strict mode enabled
- Path-based imports for cleaner code

### Backend Integration & API

**Configuración de API**:
- URL base configurada en `.env.local`: `NEXT_PUBLIC_API_URL`
- Cliente HTTP centralizado en `src/lib/api-client.ts`
- Configuración global en `src/lib/config.ts`
- Data mappers in `src/lib/mappers/`: Transform between API snake_case and frontend camelCase

**Servicios de API** (`src/services/`):
- `packages.ts`: Gestión de paquetes (productos) - **Conectado a API real**
  - `obtenerTodosPaquetes()`, `obtenerPaquetePorId()`, `obtenerPaquetesPorCategoria()`
  - `crearPaquete()`, `actualizarPaquete()`, `eliminarPaquete()`
- `categories.ts`: Gestión de categorías - **Conectado a API real**
  - `obtenerTodasCategorias()`, `obtenerCategoriaPorId()`
  - `crearCategoria()`, `actualizarCategoria()`, `eliminarCategoria()`
- `auth.ts`: Autenticación - **Conectado a API real**
  - `loginCliente()`, `loginAdmin()`, `registroAdmin()`
- `fotos.ts`: Gestión de fotos - **Conectado a API real**
  - `obtenerUrlDescargaFoto()`: Get signed S3 URL (expires in 1 hour)
  - `descargarFoto()`: Download single photo with 300 DPI metadata
  - `descargarMultiplesFotos()`: Batch download photos (Admin/Store only)
  - `obtenerMetadataFoto()`: Get photo metadata without downloading
  - **See `DESCARGA_FOTOS_GUIDE.md` for complete usage guide**
- `analytics.ts`: Admin analytics dashboard - **API endpoints pending implementation**
  - `obtenerAnalytics()`: Get all analytics data (KPIs, sales, top products)
  - **See `ANALYTICS_ENDPOINTS_SPEC.md` for backend specification**
- `checkout.ts`: Stripe payment integration
- `products.ts`, `orders.ts`: Servicios legacy (usar packages.ts y categories.ts en su lugar)

**Mock Data** (modo desarrollo):
- Located in `src/test-data/`: `product-mockdata.ts`, `order-mockdata.ts`, `admi-mockItems.ts`, `admi-mockOrders.ts`
- Reemplazar llamadas a mock data con servicios de `src/services/` cuando el backend esté disponible

**API Backend Real** (documentada en `API_REAL_DOCUMENTATION.md`):
- **Paquetes**: `GET/POST/PUT/DELETE /api/paquetes[/:id]` - Gestión completa de paquetes
  - Endpoint especial: `GET /api/paquetes/categoria/:categoriaId` - Paquetes por categoría
- **Categorías**: `GET/POST/PUT/DELETE /api/categorias[/:id]` - Gestión de categorías
- **Autenticación**:
  - `POST /api/auth/login/cliente` - Login de clientes
  - `POST /api/auth/login/admin` - Login de administradores
  - `POST /api/admin/registro` - Registro de administradores
- **Pedidos**: `POST /api/pedidos` - Crear pedidos
- **Fotos**: `POST /api/fotos/upload` - Upload de fotos a S3 (multipart/form-data)
- Swagger disponible en: `http://localhost:3001/api-docs`

**Payment Integration** (planificada en `CART_AND_ORDERS_ARCHITECTURE.md`):
- Stripe Checkout integration with webhooks
- Cart flow: LocalStorage (Zustand) → Stripe Checkout → Webhook creates order → Image upload
- Requires: `stripe`, `@stripe/stripe-js` packages and environment variables

### Custom Hooks

**useHistory** (`src/hooks/useHistory.ts`):
- Command pattern implementation for undo/redo
- State: `history: Command[]`, `index: number`
- Methods: `execute(command)`, `undo()`, `redo()`, `reset()`, `canUndo`, `canRedo`
- Command interface: `{ undo: () => void, redo: () => void }`

**useToast** (`src/hooks/useToast.tsx`):
- Toast notification system
- Methods: `success()`, `error()`, `warning()`, `info()`, `showToast()`, `removeToast()`
- Returns array of `toasts` with auto-removal after duration (default 4000ms)

**useAddresses** (`src/hooks/useAddresses.ts`):
- Address management with full CRUD operations
- Integrates with `auth-store` for user context
- Methods: `createAddress()`, `updateAddress()`, `deleteAddress()`, `setDefaultAddress()`, `refetch()`
- Returns: `addresses`, `loading`, `error` states

**useCanvasState** (`src/hooks/useCanvasState.ts`):
- Canvas state management for photo editor
- Handles canvas transformations and image state

### Data Interfaces

**Key Types** (`src/interfaces/`):
- `ShopItem` / `ProductSections` - Product catalogue structure
- `CartItem` / `CartTotals` - Shopping cart (prices include IVA, no separate tax calculation)
- `UserOrder` - Customer order view (status: "Enviado" | "En reparto" | "Entregado")
- `AdmiOrder` - Admin order view (includes "Imprimiendo" | "Empaquetado" | "Archivado" states)
- `OrderItem` - Individual order line items
- `itemPackages` - Admin product management

### Protected Routes & Authentication

- Authentication implemented via `auth-store` Zustand store
- Login pages:
  - `/login` - Public/customer login
  - `/admin/login` - Admin login
  - `/store/login` - Store employee login
- Protected routes use `ProtectedRoute.tsx` component to check authentication
- User sessions persisted in Zustand store
- Role-based access control enforced for admin and store routes
- Unauthorized access redirects to `/unauthorized` page

## Deployment

**Production URL**: Desplegado en Vercel
**Backend API**: Railway (URL protegida mediante proxy de Next.js)
**Documentación completa**: Ver `VERCEL_DEPLOYMENT.md`

Para hacer deploy en Vercel:
1. Conecta el repositorio GitHub: `Aquetzalli19/fotogifty-front-prod`
2. Configura la variable de entorno: `NEXT_PUBLIC_API_URL` (URL de Railway)
3. Vercel auto-detecta Next.js 15 y ejecuta `npm run build`

**Importante**: La URL del backend NUNCA se expone al cliente gracias al proxy configurado en `next.config.ts`.

## Additional Documentation

### Deployment & API
- `VERCEL_DEPLOYMENT.md` - Guía completa de deployment en Vercel con configuración de seguridad
- `docs/API_ORDENES_BACKEND.md` - Documentación de API de órdenes del backend
- `API_REAL_DOCUMENTATION.md` - Referencia completa de API con ejemplos
- `BACKEND_API_DOCS.md` - Documentación adicional del backend
- `MIGRATION_GUIDE.md` - Guía para migrar de mock data a API real

### Architecture & Flow
- `CART_AND_ORDERS_ARCHITECTURE.md` - Arquitectura completa del flujo de carrito y órdenes
- `docs/STRIPE_PAYMENT_SPECIFICATION.md` - Especificación de integración de Stripe

### Editor & Features
- `EDITOR_TYPE_USAGE.md` - Guía completa de sistema de editores (Standard/Calendar/Polaroid)
- `CALENDAR_AREA_CONFIG.md` - Cómo configurar el área de foto en calendarios (52% top configurable)
- `DESCARGA_FOTOS_GUIDE.md` - Guía completa del sistema de descarga de fotos con DPI (Admin/Store only)
- `ANALYTICS_ENDPOINTS_SPEC.md` - Especificación de endpoints de analytics para el backend

## Important Notes

### Backend & API
- **API Conectada**: Backend en Railway - Ver `API_REAL_DOCUMENTATION.md` para detalles completos
- **Página de Prueba**: Visita `/test-api` para probar la conexión con la API
- **Convención de Nombres**: La API usa snake_case (`categoria_id`) mientras el frontend usa camelCase
- **Image Storage**: Photos stored in AWS S3 bucket `fotogifty.s3.us-east-1.amazonaws.com/fotos/**`
- **Signed URLs**: S3 download URLs expire in 1 hour, must be refreshed for new downloads

### Architecture
- **Editor Types**: 3 editors auto-detected by category name: Standard, Calendar, Polaroid
- **Multiple Instances**: `customization-store` handles multiple customizations per cart item (e.g., 3 photos for quantity=3)
- **DPI Embedding**: All exported photos have 300 DPI metadata embedded via `png-dpi.ts`
- **Route Groups**: Uses Next.js route groups `(presentation)` for shared layouts without affecting URL paths

### Permissions & Roles
- **Photo Downloads**: ONLY Admin and Store roles can download photos (enforced in frontend + backend)
- **User Types**: `cliente` (customer), `admin`, `super_admin`, `store` (point-of-sale)
- **Protected Routes**: Use `auth-store` to check authentication and role-based access

### Performance & UX
- **Canvas Transformations**: Uses MIT-licensed code from Igor Zinken (`src/lib/canvas-utils.ts:62-130`)
- **Pricing**: All product prices include IVA (16% Mexican tax) - no additional tax calculation at checkout
- **Mock Data**: Disponible en `src/test-data/` como fallback durante desarrollo
- **Pixel Effects**: Sepia and other pixel manipulation effects are intensive for large images
- **Mobile Support**: Touch events supported for canvas manipulation in all editors
- **Notificaciones**: Via `useToast` hook - usa `success()`, `error()`, `warning()`, `info()`
- **Batch Downloads**: 500-800ms delay between downloads to avoid browser saturation

## Common Issues & Solutions

### Build Errors en Vercel

Si el build falla en Vercel por warnings de ESLint/TypeScript:
- Los errores críticos deben corregirse en el código
- Los warnings no deberían bloquear el build (configurado para permitirlos)
- Revisa logs en Vercel Dashboard para errores específicos

### Problemas de CORS

Si ves errores de CORS:
- Verifica que estés usando `/api/*` en el código (NO la URL completa de Railway)
- El proxy de Next.js (`next.config.ts`) maneja CORS automáticamente
- En desarrollo: proxy redirige a `localhost:3001`
- En producción: proxy redirige a Railway

### Variables de Entorno

- `.env.local` NO se commitea (está en `.gitignore`)
- Usa `.env.example` como plantilla
- En Vercel: configura `NEXT_PUBLIC_API_URL` en Dashboard
- Reinicia el servidor de desarrollo después de cambiar variables de entorno
