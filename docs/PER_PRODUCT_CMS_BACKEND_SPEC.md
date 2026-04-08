# Per-Product CMS Backend Specification

## Overview

Extends the existing global product page CMS to support **per-product (paquete) content overrides**. Each product can customize any of the 6 marketing sections independently, with fallback to global content.

### Fallback Chain
```
Per-producto → Global CMS → Static defaults (frontend only)
```

## Database Schema

### New Tables (3 tables parallel to the global ones)

The global tables (`product_page_sections`, `product_page_slides`, `product_page_options`) are NOT modified.

```sql
CREATE TABLE paquete_page_sections (
  id SERIAL PRIMARY KEY,
  paquete_id INT NOT NULL REFERENCES paquetes_predefinidos(id) ON DELETE CASCADE,
  section_key VARCHAR(50) NOT NULL,
  titulo VARCHAR(255),
  subtitulo TEXT,
  descripcion TEXT,
  imagen_principal_url VARCHAR(500),
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (paquete_id, section_key)
);

CREATE TABLE paquete_page_slides (
  id SERIAL PRIMARY KEY,
  paquete_id INT NOT NULL REFERENCES paquetes_predefinidos(id) ON DELETE CASCADE,
  section_key VARCHAR(50) NOT NULL,
  tipo VARCHAR(30) NOT NULL,
  titulo VARCHAR(255),
  descripcion TEXT,
  imagen_url VARCHAR(500),
  icono VARCHAR(50),
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_paquete_slides_section ON paquete_page_slides(paquete_id, section_key);

CREATE TABLE paquete_page_options (
  id SERIAL PRIMARY KEY,
  paquete_id INT NOT NULL REFERENCES paquetes_predefinidos(id) ON DELETE CASCADE,
  section_key VARCHAR(50) NOT NULL,
  slide_id INT REFERENCES paquete_page_slides(id) ON DELETE CASCADE,
  texto VARCHAR(255) NOT NULL,
  texto_secundario VARCHAR(255),
  texto_terciario VARCHAR(255),
  texto_cuarto VARCHAR(255),
  texto_quinto VARCHAR(255),
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_paquete_options_section ON paquete_page_options(paquete_id, section_key);
```

**Notes**:
- `ON DELETE CASCADE` on `paquete_id`: deleting a paquete auto-cleans its CMS data
- `UNIQUE(paquete_id, section_key)` on sections: max one override per section per paquete
- `slide_id` references `paquete_page_slides` (NOT global slides)
- No seed data — tables start empty, everything inherits from global

## API Endpoints

Base: `/api/paquetes/:paqueteId/page-content`

### Merged Content (Public)

```
GET /api/paquetes/:paqueteId/page-content/merged
```

Returns all 6 sections with fallback applied per-section.

**Merge logic** (per `section_key`):
1. Look up `paquete_page_sections` for this `paquete_id` + `section_key`
2. If exists → return per-product data (with its slides/options from `paquete_page_*` tables)
3. If not → return global data from `product_page_sections` (with global slides/options)

**Response** (same format as `GET /api/product-page-content/sections`):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "section_key": "gallery",
      "titulo": "...",
      "subtitulo": "...",
      "activo": true,
      "slides": [...],
      "options": [],
      "_source": "per_product"
    }
  ]
}
```

The `_source` field (`"per_product"` or `"global"`) is informational for the admin UI.

### Override Status (Admin, requires auth)

```
GET /api/paquetes/:paqueteId/page-content/status
```

Response:
```json
{
  "success": true,
  "data": [
    { "section_key": "gallery", "has_override": true },
    { "section_key": "why_choose", "has_override": false },
    ...
  ]
}
```

### Sections CRUD (Admin, requires auth)

```
GET    /api/paquetes/:paqueteId/page-content/sections
       → Only sections with per-product overrides

PUT    /api/paquetes/:paqueteId/page-content/sections/:sectionKey
       → Create or update override (upsert)
       → Body: { titulo?, subtitulo?, descripcion?, imagen_principal_url?, activo? }
       → Response: { success: true, data: SectionComplete }

DELETE /api/paquetes/:paqueteId/page-content/sections/:sectionKey
       → Delete override → reverts to global
       → Cascade: deletes associated slides and options
       → Response: { success: true, message: "Sección revertida a global" }

PATCH  /api/paquetes/:paqueteId/page-content/sections/:sectionKey/toggle
       → Toggle activo
       → Response: { success: true, data: { activo: boolean } }
```

### Slides CRUD (Admin)

```
POST   /api/paquetes/:paqueteId/page-content/slides
       → Body: { section_key, tipo, titulo?, descripcion?, imagen_url?, icono?, orden? }

PUT    /api/paquetes/:paqueteId/page-content/slides/:slideId
       → Body: { titulo?, descripcion?, imagen_url?, icono?, orden?, activo? }

DELETE /api/paquetes/:paqueteId/page-content/slides/:slideId

PUT    /api/paquetes/:paqueteId/page-content/slides/reorder
       → Body: { section_key, slide_ids: number[] }
```

### Options CRUD (Admin)

```
POST   /api/paquetes/:paqueteId/page-content/options
       → Body: { section_key, slide_id?, texto, texto_secundario?, ..., orden? }

PUT    /api/paquetes/:paqueteId/page-content/options/:optionId

DELETE /api/paquetes/:paqueteId/page-content/options/:optionId

PUT    /api/paquetes/:paqueteId/page-content/options/reorder
       → Body: { section_key, option_ids: number[] }
```

### Clone from Global

```
POST /api/paquetes/:paqueteId/page-content/clone-from-global
     → Body: { section_keys?: string[] }  // null = clone all
     → Copies global sections as per-product overrides
     → If override already exists, replaces it
     → Remaps slide_ids in options when cloning
     → Response: { success: true, data: SectionComplete[], message: "N secciones clonadas" }
```

### Image Upload

```
POST /api/paquetes/:paqueteId/page-content/upload
     → FormData: { section_key, image_type ('main'|'slide'), imagen: File }
     → S3 path: paquetes/{paqueteId}/page-content/{section_key}/{filename}
     → Response: { success: true, data: { url: string } }
```

## Section Keys

Same 6 section keys as global:
- `gallery` — Image gallery
- `why_choose` — Value cards
- `paper_types` — Paper type tabs with features
- `print_services` — Service cards
- `product_types` — Product type showcase
- `sizes_table` — Sizes/options table

## Clone Logic Detail

When cloning from global:

1. For each `section_key` to clone:
   a. Read the global `product_page_sections` row
   b. INSERT/UPSERT into `paquete_page_sections`
   c. Read global `product_page_slides` for that section
   d. INSERT into `paquete_page_slides`, recording old→new ID mapping
   e. Read global `product_page_options` for that section
   f. INSERT into `paquete_page_options`, remapping `slide_id` using the ID mapping from step d

2. If a per-product override already exists for a section being cloned:
   - DELETE existing per-product slides and options for that section
   - Then clone fresh from global

## Response Format

All responses follow the existing pattern:
```json
{
  "success": true|false,
  "data": ...,
  "message": "...",
  "error": "..."  // only on failure
}
```

Section data includes nested slides and options, same structure as global endpoints.
