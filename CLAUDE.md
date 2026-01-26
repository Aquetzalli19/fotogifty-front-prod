# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FotoGifty is a Next.js 15 photo printing e-commerce platform with an integrated photo editor. The application supports three main user roles: public visitors, authenticated users, and administrators.

## Development Commands

```bash
# Install dependencies (first time setup)
npm install

# Start development server with Turbopack (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

**Default Ports**:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001` (proxied through `/api/*` in frontend)

**Key Dependencies**:
- Next.js 15.5.9 (App Router with Turbopack)
- React 19.1.0
- TypeScript 5
- Zustand 5.0.8 (state management)
- Zod 4.1.8 (validation)
- Tailwind CSS 4.1.12
- shadcn/ui components (Radix UI primitives)

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
  - `/` - Landing page with marketing sections
  - `/login` - Public/customer login
  - `/signup` - Customer registration
  - `/forgot-password` - Password recovery flow with identity verification
  - Layout includes NavBar, Footer, and ThemeProvider

- **User routes** (`/app/user/`): Authenticated user interface
  - `/user/(presentation)/page.tsx` - Product catalogue
  - `/user/(presentation)/profile/page.tsx` - User profile management
  - `/user/(presentation)/backlog/page.tsx` - Order history
  - `/user/editor/page.tsx` - Photo editor (Standard/Calendar/Polaroid)
  - `/user/cart/page.tsx` - Shopping cart
  - `/user/order-success/page.tsx` - Order confirmation page after successful payment

- **Admin routes** (`/app/admin/`): Admin dashboard
  - `/admin/(delivercontrol)/` - Order tracking and delivery management
  - `/admin/itemcontrol/` - Product inventory management
  - `/admin/addItem/` - Add new products to catalogue
  - `/admin/categories/` - Category management
  - `/admin/users/` - User management
  - `/admin/legal-documents/` - Legal documents management (terms, policies)
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
  - **Customization Data Structure**:
    - `transformations`: `{ scale, rotation, posX, posY }` (+ mirrorX/Y for Standard)
    - `effects`: `{ brightness, contrast, saturation, sepia }`
    - `selectedFilter`: `"none" | "blackwhite" | "sepia"`
    - `canvasStyle`: `{ borderColor, borderWidth, backgroundColor }`
  - **Backward Compatibility**: Normalizes old data without rotation/effects with default values
- `src/stores/order-success-store.ts`: Manages order success state after payment completion
  - Persists order details temporarily for success page display
  - Cleared after user navigates away from success page

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
   - **Full editing capabilities (same as Standard Editor)**:
     - Transformations: scale, rotation, position (X/Y with sliders and drag)
     - Effects: brightness, contrast, saturation, sepia
     - Filters: Original, B/N, Sepia
     - Canvas styling: border color, border width, background color
   - Export: Cropped photo area only (without template) for backend printing
   - Rendering utilities: `src/lib/calendar-render-utils.ts`

3. **Polaroid Editor** (`src/components/editor-components/PolaroidEditor.tsx`):
   - Polaroid-style frame with white border and caption area
   - **Full editing capabilities (same as Standard Editor)**:
     - Transformations: scale, rotation, position within polaroid frame
     - Effects: brightness, contrast, saturation, sepia
     - Filters: Original, B/N, Sepia
     - Frame customization: border color, border width, background color
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
  - `compressCanvas()`: Generates high-quality thumbnails (500x500px, JPEG 0.92 quality) for cart previews
- `src/lib/canvas-operations.ts`: Canvas manipulation helpers
- `src/lib/png-dpi.ts`: Embed 300 DPI metadata in PNG files
- `src/lib/image-compression.ts`: Compress images for upload

**Shared Editor Components** (`src/components/editor-components/`):
- `TransformTab.tsx`: Reusable transformation controls with live preview
  - **Canvas Orientation** (optional control):
    - Portrait/Landscape toggle buttons
    - Changes the orientation of the entire canvas (swaps width/height)
    - Different from image rotation - this rotates the print canvas itself
    - Applies to Standard, Calendar, and Polaroid editors
  - **Scale slider**: 0.1 to 3x with 0.05 step
  - **Image Rotation controls** (rotates only the image, not the canvas):
    - Quick rotation buttons: -90° (left) and +90° (right) with icons
    - Numeric input: Manual rotation entry (-180° to 180°) with auto-normalization
    - Live preview while typing
    - All rotation values normalized to -180° to 180° range
  - **Position sliders**: X/Y with dynamic range based on canvas size
- `AdjustTab.tsx`: Reusable adjustment controls (brightness, contrast, saturation, sepia, filters)
- `BackgroundTab.tsx`: Reusable styling controls (border color/width, background color)
- `EditorDisclaimer.tsx`: Legal disclaimer shown before editor usage
  - Warns users that FotoGifty is not responsible for editing quality
  - Confirms that prints will match preview exactly (WYSIWYG)
  - Reminds users to review work before submitting
  - **Shown EVERY TIME** the user opens an editor (not persisted)
- These tabs are used by all three editors (Standard, Calendar, Polaroid) for consistent UX

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
  - `src/validations/user-schema.ts` - User data validation (signup, profile editing)
  - `src/validations/forgot-password-schema.ts` - Password recovery validation
  - `src/validations/item-package-schema.ts` - Product validation
  - `src/validations/address-schema.ts` - Address validation
  - `src/validations/legal-schema.ts` - Legal document validation
  - **Password Requirements**: Minimum 8 characters, at least 1 number, 1 special character

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
- `orders.ts`: Order management - **Conectado a API real**
  - `obtenerPedidos()`, `obtenerPedidoPorId()`, `obtenerPedidosPorUsuario()`
  - `crearPedido()`, `actualizarEstadoPedido()`, `eliminarPedido()`
- `users.ts`: User management - **Conectado a API real**
  - `obtenerUsuarios()`, `obtenerUsuarioPorId()`, `actualizarUsuario()`, `eliminarUsuario()`
  - `obtenerDireccionesPorUsuario()`, `crearDireccion()`, `actualizarDireccion()`, `eliminarDireccion()`, `establecerDireccionPredeterminada()`
- `legal.ts`: Legal documents management - **Conectado a API real**
  - `obtenerDocumentosLegales()`, `crearDocumentoLegal()`, `actualizarDocumentoLegal()`, `eliminarDocumentoLegal()`
- `password-recovery.ts`: Password recovery system - **Conectado a API real**
  - `solicitarRecuperacion()`: Request password reset with identity verification
  - `verificarIdentidad()`: Verify user identity with DOB
  - `restablecerContrasena()`: Reset password with new credentials
- `products.ts`: Servicios legacy (usar packages.ts en su lugar)

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
- **Pedidos**: `GET/POST/PUT/DELETE /api/pedidos[/:id]` - Gestión de pedidos
- **Usuarios**: `GET/PUT/DELETE /api/usuarios[/:id]` - Gestión de usuarios
- **Direcciones**: `GET/POST/PUT/DELETE /api/direcciones[/:id]` - Gestión de direcciones de envío
- **Documentos Legales**: `GET/POST/PUT/DELETE /api/legal-documents[/:id]` - Términos y condiciones, políticas
- **Recuperación de Contraseña**:
  - `POST /api/password-recovery/request` - Solicitar recuperación
  - `POST /api/password-recovery/verify` - Verificar identidad con fecha de nacimiento
  - `POST /api/password-recovery/reset` - Restablecer contraseña
- **Fotos**:
  - `POST /api/fotos/upload` - Upload de fotos a S3 (multipart/form-data)
  - `GET /api/fotos/download/:id` - Get signed S3 URL (expires in 1 hour)
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

## Git Workflow

**Main Branch**: `main` (production branch)
**Production Repository**: `Aquetzalli19/fotogifty-front-prod` (GitHub)

**Important Git Practices**:
- Always create feature branches for new work
- Commit messages should be clear and descriptive
- Keep commits focused on single logical changes
- Test changes locally before pushing

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

### User Management & Security
- `docs/PASSWORD_RECOVERY_FLOW.md` - Password recovery system with DOB verification
- `docs/LEGAL_DOCUMENTS_FEATURE.md` - Legal documents management (terms, policies)

## Important Notes

### Backend & API
- **API Conectada**: Backend en Railway - Ver `API_REAL_DOCUMENTATION.md` para detalles completos
- **Página de Prueba**: Visita `/test-api` para probar la conexión con la API
- **Convención de Nombres**: La API usa snake_case (`categoria_id`) mientras el frontend usa camelCase
  - Data mappers in `src/lib/mappers/` handle transformations between API and frontend formats
- **Image Storage**: Photos stored in AWS S3 bucket `fotogifty.s3.us-east-1.amazonaws.com/fotos/**`
- **Signed URLs**: S3 download URLs expire in 1 hour, must be refreshed for new downloads

### Architecture
- **Editor Types**: 3 editors auto-detected by category name: Standard, Calendar, Polaroid
  - All editors now share the same editing capabilities (rotation, effects, filters, styling)
  - Implemented via shared components: `TransformTab`, `AdjustTab`, `BackgroundTab`
- **Canvas Orientation vs Image Rotation**:
  - **Canvas Orientation**: Changes the entire print canvas from portrait to landscape (or vice versa)
    - Swaps canvas width and height (e.g., 2400×3600 → 3600×2400)
    - Affects the print output dimensions
    - Controlled by portrait/landscape buttons in TransformTab
    - Forces canvas re-render via useEffect dependencies on `canvasOrientation`
  - **Image Rotation**: Only rotates the image inside the canvas
    - Canvas dimensions remain unchanged
    - Controlled by rotation slider and quick rotation buttons
- **Multiple Instances**: `customization-store` handles multiple customizations per cart item (e.g., 3 photos for quantity=3)
- **DPI Embedding**: All exported photos have 300 DPI metadata embedded via `png-dpi.ts`
- **Route Groups**: Uses Next.js route groups `(presentation)` for shared layouts without affecting URL paths
- **Order Sorting**: Admin and Store pages support sorting orders by date (newest/oldest) using `useMemo` pattern for derived state

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
- **Cart Preview Quality**: High-quality thumbnails for better visual fidelity
  - Standard/Polaroid: 500x500px at JPEG 0.92 quality
  - Calendar: 600x900px at JPEG 0.92 quality
  - Stored in localStorage as base64 data URLs
- **React Patterns**:
  - Use `useMemo` for derived state (filtering, sorting) - NOT separate `useState` + `useEffect`
  - Live updates in editors use direct state setters (no history)
  - Committed changes use `execute()` from `useHistory` hook for undo/redo support

## Development Best Practices

### React State Management
- **Derived State**: Always use `useMemo` for computed/filtered data, NEVER store in separate state
  - Example: Filtering orders by status → use `useMemo`, not `useState` + `useEffect`
  - This prevents stale closures and unnecessary re-renders
- **Editor State**:
  - Live updates (slider dragging) → direct state updates without history
  - Committed changes (slider release) → use `execute()` with undo/redo commands

### Component Patterns
- **Backward Compatibility**: When adding new fields to stored data (localStorage/Zustand):
  - Provide default values when loading old data
  - Example: `transformations?.rotation || 0` for data saved before rotation was added
- **Shared Components**: Reuse `TransformTab`, `AdjustTab`, `BackgroundTab` across editors
  - Pass handlers as props, don't duplicate logic

### TypeScript & Interfaces
- When updating interfaces in `customization-store.ts`, also update:
  1. Component local interfaces (e.g., `SavedPolaroid`, `MonthPhoto`)
  2. Data normalization code in `useEffect` (for backward compatibility)
  3. Save/export functions to include new fields

### Image Processing
- **Compression**: Always compress images before storing in localStorage
  - Use `compressAndResizeImage()` from `src/lib/image-compression.ts`
  - Target size: 1000px max dimension, 0.85 quality for photos
- **Canvas Rendering**: Apply transformations in correct order:
  1. Translate to center point
  2. Rotate
  3. Scale
  4. Draw image
  5. Apply filters (CSS filter property)

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

### Debugging Techniques

**For State Issues:**
- Add `console.log` with emojis for visibility:
  - `console.log('🔄 useMemo ejecutándose - sortOrder:', sortOrder);`
  - `console.log('📦 Total de pedidos:', allOrders.length);`
  - `console.log('📅 Primer pedido:', sorted[0]);`

**For Canvas/Editor Issues:**
- Check browser console for transformation values
- Verify image loading: `img.onload` and `img.onerror`
- Test on different zoom levels to isolate rendering issues
- Use `renderCanvas()` dependency array carefully - include all state that affects rendering

**For TypeScript Errors:**
- When adding fields to interfaces, update ALL locations:
  1. Store interface (`customization-store.ts`)
  2. Component interfaces
  3. Default values in initialization
  4. Normalization code for backward compatibility
  5. Save/export functions
