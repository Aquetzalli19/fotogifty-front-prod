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
- `NEXT_PUBLIC_API_URL`: URL base del backend API (requerida para peticiones HTTP)
- Stripe keys (futuro): `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

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

- **Admin routes** (`/app/admin/` and `/app/admi/`): Admin dashboard
  - **Note**: Both `/admin/` and `/admi/` directories exist - `/admi/` is the active implementation
  - `/admi/(delivercontrol)/` - Order tracking and delivery management
  - `/admi/itemcontrol/` - Product inventory management
  - `/admi/addItem/` - Add new products to catalogue

### State Management

**Zustand stores**:
- `src/stores/cart-store.ts`: Shopping cart with IVA (16% tax) calculation
  - Persisted to localStorage as `shopping-cart-storage-final`
  - Handles item quantities, totals, and cart operations
- `src/stores/auth-store.ts`: Authentication state management
  - Stores user data, token, and authentication status
  - Methods: `login()`, `logout()`, `updateUserData()`
- `src/stores/cart-step-store.ts`: Shopping cart checkout flow state

### Key Features

**Photo Editor** (`src/app/user/editor/page.tsx`):
- Canvas-based image editing with 800x600 dimensions
- Mobile-first responsive design with touch event support for canvas manipulation
- Implements Command pattern for undo/redo via `useHistory` hook (`src/hooks/useHistory.ts`)
- Transformations: scale, rotation, mirror (X/Y), position (drag/drop and touch)
- Effects: brightness, contrast, saturation, sepia (custom pixel manipulation)
- Canvas styling: background color, border color/width
- Uses `src/lib/canvas-utils.ts` for transformation matrix operations (MIT licensed from Igor Zinken)
- Export format: PNG via `canvas.toDataURL("image/png")`
- Zoom support: 0.1x to 2x

**Component Organization**:
- `src/components/landing-page/`: Marketing sections
- `src/components/user/`: User-facing features (navbar, profile, product catalogue, cart)
- `src/components/admi/`: Admin components (OrderCard, ItemCard, dialogs)
- `src/components/ui/`: shadcn/ui components (16 Radix UI-based components)
- `src/components/editor-components/`: Photo editor tabs (TransformTab, AdjustTab, BackgroundTab, FilterPreview, DownloadPreview)

### Styling & UI

- **TailwindCSS** with custom configuration (`tailwind.config.js` via `@tailwindcss/postcss`)
- **Fonts**: Raleway (primary) and Poppins from Google Fonts
- **Dark mode**: next-themes with system preference support
- **UI Library**: Radix UI primitives + custom shadcn/ui components
- **Animations**: Framer Motion via `motion` package and Lenis for smooth scrolling

### Forms & Validation

- **react-hook-form** + **@hookform/resolvers** for form handling
- **Zod v4.1.8** for schema validation
  - `src/validations/user-schema.ts` - User data validation
  - `src/validations/item-package-schema.ts` - Product validation

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

**Servicios de API** (`src/services/`):
- `packages.ts`: Gestión de paquetes (productos) - **Conectado a API real**
  - `obtenerTodosPaquetes()`, `obtenerPaquetePorId()`, `obtenerPaquetesPorCategoria()`
  - `crearPaquete()`, `actualizarPaquete()`, `eliminarPaquete()`
- `categories.ts`: Gestión de categorías - **Conectado a API real**
  - `obtenerTodasCategorias()`, `obtenerCategoriaPorId()`
  - `crearCategoria()`, `actualizarCategoria()`, `eliminarCategoria()`
- `auth.ts`: Autenticación - **Conectado a API real**
  - `loginCliente()`, `loginAdmin()`, `registroAdmin()`
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
- `CartItem` / `CartTotals` - Shopping cart with IVA (16% tax)
- `UserOrder` - Customer order view (status: "Enviado" | "En reparto" | "Entregado")
- `AdmiOrder` - Admin order view (includes "Imprimiendo" | "Empaquetado" | "Archivado" states)
- `OrderItem` - Individual order line items
- `itemPackages` - Admin product management

### Protected Routes & Authentication

- Authentication implemented via `auth-store` Zustand store
- Login pages: `/admin/login` and `/store/login` for different user types
- Protected routes check authentication state before rendering
- User sessions persisted in Zustand store (not in localStorage by default)
- Admin routes require admin-type authentication

## Additional Documentation

- `docs/API_ORDENES_BACKEND.md` - Orders API backend documentation
- `API_REAL_DOCUMENTATION.md` - Complete API reference with examples
- `CART_AND_ORDERS_ARCHITECTURE.md` - Full cart and orders flow architecture
- `MIGRATION_GUIDE.md` - Guide for migrating from mock data to real API
- `BACKEND_API_DOCS.md` - Additional backend API documentation

## Important Notes

- **API Conectada**: Backend corriendo en `http://localhost:3001` - Ver `API_REAL_DOCUMENTATION.md` para detalles completos
- **Página de Prueba**: Visita `http://localhost:3000/test-api` para probar la conexión con la API
- **Convención de Nombres**: La API usa snake_case (`categoria_id`) mientras el frontend usa camelCase
- Duplicate admin routes exist (`/admin/` and `/admi/`) - `/admi/` is the active implementation
- The photo editor uses canvas transformations based on Igor Zinken's MIT-licensed code (`src/lib/canvas-utils.ts:62-130`)
- IVA (tax) rate is hardcoded at 16% in `cart-store.ts:6`
- Mock data still available in `src/test-data/` for fallback during development
- Sepia and other pixel-manipulation effects are performance-intensive for large images
- Mobile touch events are supported for canvas manipulation in the photo editor
- Toast notifications via `useToast` hook - use `success()`, `error()`, `warning()`, `info()` methods
- Address management fully integrated with backend via `useAddresses` hook
