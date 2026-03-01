# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FotoGifty is a **Next.js 15 photo printing e-commerce platform** with an integrated canvas-based photo editor. Users upload photos, customize them in one of three editor types (Standard, Calendar, Polaroid), and order prints. The app serves four user roles: public visitors, authenticated customers (`cliente`), administrators (`admin`/`super_admin`), and point-of-sale employees (`store`).

## Development Commands

```bash
npm run dev      # Start dev server with Turbopack on http://localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint (Next.js core-web-vitals + TypeScript rules)
```

No test framework is configured. There are manual test pages at `/test` and `/test-api`.

## Environment Setup

Copy `.env.example` to `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api   # Backend API URL (proxied via next.config.ts rewrites)

# Optional store info shown in delivery method UI:
NEXT_PUBLIC_STORE_NAME=
NEXT_PUBLIC_STORE_ADDRESS=
NEXT_PUBLIC_STORE_CITY=
NEXT_PUBLIC_STORE_STATE=
NEXT_PUBLIC_STORE_ZIP=
NEXT_PUBLIC_STORE_PHONE=
NEXT_PUBLIC_STORE_HOURS=
```

All frontend code uses `/api` as the base URL (see `src/lib/config.ts`). Next.js rewrites in `next.config.ts` proxy `/api/*` requests to the backend, avoiding CORS issues and hiding the backend URL from the client.

## Architecture

### Routing (Next.js App Router)

Route groups organize layouts without affecting URL paths:

- `src/app/(presentation)/` — Public pages: landing, login, signup, forgot-password, terms, privacy
- `src/app/user/` — Authenticated user area: product catalogue, editor, cart, order-success, profile, backlog
  - `(presentation)/` sub-group shares NavBar/Footer layout
  - `editor/page.tsx` — Photo editor (no shared layout wrapper)
- `src/app/admin/` — Admin dashboard: order delivery, inventory, categories, users, analytics, legal docs, landing content, store settings, footer settings, order states
- `src/app/store/` — Point-of-sale interface with separate login
- `src/app/login/` — Login routing for admin and store roles

Protected routes use `src/components/ProtectedRoute.tsx` which checks `auth-store` for authentication and role.

### State Management (Zustand)

All stores are in `src/stores/` and persist to localStorage:

| Store | localStorage Key | Purpose |
|---|---|---|
| `auth-store.ts` | `auth-storage` | User session, token, role. Methods: `login()`, `logout()`, `updateUserData()` |
| `cart-store.ts` | `shopping-cart-storage-final` | Cart items, quantities, totals. Syncs to backend via debounced `temp-cart` service (2s). **Prices include IVA (16% tax) — no separate tax calculation.** |
| `customization-store.ts` | `customization-storage` | Per-item photo editor state: transformations, effects, filters, canvas styling. Supports multiple instances per item (qty=3 → 3 customizations). |
| `cart-step-store.ts` | `cart-step-storage` | Checkout flow step tracking (step 1–N) |

**Sync-before-logout pattern**: NavBar calls explicit backend sync on both cart and customizations _before_ calling `logout()`. Always use this pattern when clearing stores.

**Hydration pattern**: `auth-store` exposes `_hasHydrated` flag. Components that render auth-dependent content must wait for it via `useEffect` to avoid SSR/hydration mismatch.

### API Layer

- **HTTP client**: `src/lib/api-client.ts` — Class-based `ApiClient` with auto auth headers from `localStorage('auth_token')`, JSON handling, error handling, FormData support
- **Services**: `src/services/` — One file per domain (packages, categories, auth, orders, users, fotos, checkout, analytics, legal-documents, landing-content, etc.)
- **Data mappers**: `src/lib/mappers/` — Transform between API snake_case and frontend camelCase
- **API naming convention**: Backend uses Spanish endpoint names (`/api/paquetes`, `/api/pedidos`, `/api/categorias`, `/api/usuarios`, `/api/direcciones`)
- **Swagger**: Available at `http://localhost:3001/api-docs` when backend is running

### Photo Editor System

Three editor types, auto-detected from category name in `src/lib/category-utils.ts`:
- "calendario"/"calendar" → Calendar editor (template-based, 12-month, photo area at 52% top)
- "polaroid" → Polaroid editor (frame with caption area)
- Everything else → Standard editor (configurable canvas dimensions)

All editors share `TransformTab`, `AdjustTab`, `BackgroundTab` components from `src/components/editor-components/`. Key capabilities:
- Transformations: scale, rotation, mirror, position (drag + touch support)
- Effects: brightness, contrast, saturation, sepia (pixel manipulation)
- Canvas styling: background color, border color/width
- Export: PNG with 300 DPI metadata via `src/lib/png-dpi.ts`
- Undo/redo: Command pattern via `useHistory` hook (`execute()`, `undo()`, `redo()`, `canUndo`, `canRedo`, `reset()`)

**Canvas orientation vs image rotation**: Canvas orientation swaps the print dimensions (portrait ↔ landscape). Image rotation only rotates the photo within the canvas.

**Live vs committed state**: Editor components use two callbacks — `onLiveChange` (slider drag → direct state, no undo entry) and `onCommit` (slider release → `execute()` adds to undo history). This prevents bloating the undo stack with intermediate drag values.

**Canvas rendering pipeline** (`src/lib/canvas-operations.ts`):
1. Draw template/background
2. `ctx.clip()` to photo area
3. Draw blurred background fill within clip region (Calendar: done on canvas, not CSS)
4. Draw sharp photo on top within clip
5. Draw template _again_ on top for overlay effect (calendar text/borders over photo)
6. Apply CSS filters (effects)

**WYSIWYG / export accuracy**: Preview zoom is separate from export canvas size. A `scaleFactor` (`exportDimensions / previewDimensions`) scales position transforms for high-res output; scale itself is NOT multiplied by the factor. Always export at 300 DPI regardless of preview zoom.

#### Copy/Instance Management

- Each package has a `maxCopies` limit (e.g., 5 prints of 4×6).
- `getTotalCopiesUsed(cartItemId)` in `customization-store` validates the running total.
- Standard/Polaroid: each saved image slot counts toward the limit; copy count badges shown in cart previews.
- Calendar: 12 months = 1 complete calendar; copy count is irrelevant for calendars.
- `getInstanceProgress(cartItemId)` returns completion percentage across all instances for a cart item.

#### Image Memory Management

- Original images stored as data URLs in localStorage.
- Thumbnails: 500×500px JPEG at 0.92 quality, stored as base64 (cart previews only).
- `renderedImageSrc` is **never** stored in localStorage to prevent `QuotaExceededError`.
- Rendered canvases are generated on-demand when uploading to the backend.

### Terms & Conditions Blocking

- `useTermsAcceptance` hook (`checkTermsStatus()`, `acceptTerms()`) handles all terms state.
- Cart checkout is blocked until the user accepts the current version.
- Backend returns 400/403 if terms version is outdated; the cart page parses the error and surfaces the acceptance modal.
- The modal receives `termsStatus.termsDocument` for inline display.

### Key Patterns

- **Import alias**: `@/*` → `./src/*`
- **UI components**: shadcn/ui (Radix UI primitives) in `src/components/ui/`
- **Forms**: react-hook-form + Zod schemas in `src/validations/`
- **Styling**: Tailwind CSS 4 with Raleway and Poppins fonts; dark mode via next-themes
- **Derived state**: Use `useMemo` for filtering/sorting — never `useState` + `useEffect`
- **Editor state updates**: Live changes (slider drag) → direct state; committed changes (slider release) → `execute()` for undo/redo
- **Backward compatibility**: When loading persisted data, always provide defaults for fields that may not exist in older stored data (e.g., `transformations?.rotation || 0`)
- **Image processing order**: translate to center → rotate → scale → draw → apply CSS filters
- **Thumbnails**: 500x500px JPEG at 0.92 quality for cart previews, stored as base64 in localStorage

### Key Libraries

- **Stripe**: `@stripe/react-stripe-js` + `@stripe/stripe-js` for payment
- **Recharts**: Admin analytics charts
- **xlsx**: Admin spreadsheet export
- **Embla Carousel**: Product/landing carousels
- **Sonner**: Toast notifications
- **react-color** + **color**: Color pickers and manipulation in editor
- **isomorphic-dompurify**: XSS protection for user-generated content
- **lenis**: Smooth scroll on landing pages
- **motion**: Animations

### Images

Remote image sources configured in `next.config.ts`:
- AWS S3: `fotogifty.s3.us-east-1.amazonaws.com` (product photos, user uploads)
- Google Images: `encrypted-tbn0.gstatic.com` (legacy)

S3 download URLs are signed and expire in 1 hour.

## Deployment

- **Frontend**: Vercel (auto-detects Next.js, runs `npm run build`)
- **Backend**: Railway (URL hidden via Next.js proxy)
- **Repo**: `Aquetzalli19/fotogifty-front-prod` on GitHub
- Configure `NEXT_PUBLIC_API_URL` in Vercel environment variables

See `docs/VERCEL_DEPLOYMENT.md` for full deployment guide.

## Additional Documentation

Detailed docs in `docs/` directory:
- `CART_AND_ORDERS_ARCHITECTURE.md` — Cart flow and order lifecycle
- `STRIPE_PAYMENT_SPECIFICATION.md` — Payment integration spec
- `EDITOR_TYPE_USAGE.md` — Editor type system guide
- `API_REAL_DOCUMENTATION.md` — Full API reference with examples
- `BACKEND_API_DOCS.md`, `API_ORDENES_BACKEND.md` — Backend API docs
- `CALENDAR_TEMPLATES_BACKEND_SPEC.md`, `CALENDAR_AREA_CONFIG.md` — Calendar editor specs
- `BACKEND_TERMS_IMPLEMENTATION_GUIDE.md`, `TERMS_ACCEPTANCE_FLOW_DIAGRAM.md` — Terms flow
- `LANDING_CMS_BACKEND_SPEC.md` — CMS spec for landing page content
- `VERCEL_DEPLOYMENT.md` — Full deployment guide
