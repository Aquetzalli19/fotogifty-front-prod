# Landing Page CMS - Backend Specification

## Overview

This document specifies the backend API endpoints needed for the Landing Page CMS. The system manages editable content for 11 landing page sections (Polaroids is split into 3 sub-sections).

## Data Model

### 1. landing_sections

Main table storing section configuration and content.

```sql
CREATE TABLE landing_sections (
  id SERIAL PRIMARY KEY,
  section_key VARCHAR(50) UNIQUE NOT NULL,
  titulo VARCHAR(255),
  subtitulo TEXT,
  descripcion TEXT,
  texto_primario TEXT,
  texto_secundario TEXT,
  color_primario VARCHAR(7),          -- Hex color (#RRGGBB)
  color_secundario VARCHAR(7),
  color_gradiente_inicio VARCHAR(7),
  color_gradiente_medio VARCHAR(7),
  color_gradiente_fin VARCHAR(7),
  imagen_principal_url VARCHAR(500),
  imagen_fondo_url VARCHAR(500),
  boton_texto VARCHAR(100),
  boton_color VARCHAR(7),
  boton_enlace VARCHAR(255),
  configuracion_extra JSONB,          -- Carousel settings, etc.
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Valid section_key values:
-- 'hero', 'extensions', 'product_slider', 'legend', 'calendars',
-- 'single_product', 'prints', 'polaroids_banner', 'polaroids_single',
-- 'polaroids_collage', 'platform_showcase'
```

### 2. landing_slides

Stores slides/images for carousel sections and collages.

```sql
CREATE TABLE landing_slides (
  id SERIAL PRIMARY KEY,
  section_key VARCHAR(50) NOT NULL REFERENCES landing_sections(section_key),
  tipo VARCHAR(30) NOT NULL,          -- 'hero_slide', 'product_slide', 'collage_image'
  titulo VARCHAR(255),
  descripcion TEXT,
  imagen_url VARCHAR(500) NOT NULL,
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_landing_slides_section ON landing_slides(section_key);
```

### 3. landing_options

Stores size/format options displayed in sections.

```sql
CREATE TABLE landing_options (
  id SERIAL PRIMARY KEY,
  section_key VARCHAR(50) NOT NULL REFERENCES landing_sections(section_key),
  texto VARCHAR(255) NOT NULL,
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_landing_options_section ON landing_options(section_key);
```

---

## REST API Endpoints

Base URL: `/api/landing-content`

### Sections

#### GET /api/landing-content/sections

Get all sections with their slides and options.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "section_key": "hero",
      "titulo": "Imprime y recibe tus fotos",
      "subtitulo": "en pocos clics",
      "descripcion": null,
      "texto_primario": null,
      "texto_secundario": null,
      "color_primario": "#E04F8B",
      "color_secundario": null,
      "color_gradiente_inicio": null,
      "color_gradiente_medio": null,
      "color_gradiente_fin": null,
      "imagen_principal_url": null,
      "imagen_fondo_url": null,
      "boton_texto": "Imprime prints",
      "boton_color": "#F5A524",
      "boton_enlace": "/login",
      "configuracion_extra": {
        "autoplay": true,
        "autoplaySpeed": 3000,
        "transitionSpeed": 3000,
        "infinite": true
      },
      "orden": 1,
      "activo": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "slides": [
        {
          "id": 1,
          "section_key": "hero",
          "tipo": "hero_slide",
          "titulo": null,
          "descripcion": null,
          "imagen_url": "/slide1.jpg",
          "orden": 1,
          "activo": true
        }
      ],
      "options": []
    }
  ]
}
```

#### GET /api/landing-content/sections/:sectionKey

Get a single section by key with its slides and options.

**Parameters:**
- `sectionKey` (path): Section key (e.g., "hero", "extensions")

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "section_key": "hero",
    "titulo": "Imprime y recibe tus fotos",
    "slides": [...],
    "options": [...]
  }
}
```

#### PUT /api/landing-content/sections/:sectionKey

Update a section's content.

**Parameters:**
- `sectionKey` (path): Section key

**Request Body:**
```json
{
  "titulo": "Nuevo título",
  "subtitulo": "Nuevo subtítulo",
  "descripcion": "Nueva descripción",
  "texto_primario": "Texto primario",
  "texto_secundario": "Texto secundario",
  "color_primario": "#E04F8B",
  "color_secundario": "#47BEE5",
  "color_gradiente_inicio": "#06B6D4",
  "color_gradiente_medio": "#FCD34D",
  "color_gradiente_fin": "#EC4899",
  "imagen_principal_url": "/images/main.jpg",
  "imagen_fondo_url": "/images/bg.jpg",
  "boton_texto": "Ordenar ahora",
  "boton_color": "#E04F8B",
  "boton_enlace": "/login",
  "configuracion_extra": {
    "autoplay": true,
    "autoplaySpeed": 5000
  },
  "activo": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "section_key": "hero",
    ...
  },
  "message": "Sección actualizada exitosamente"
}
```

#### PATCH /api/landing-content/sections/:sectionKey/toggle

Toggle section active status.

**Response:**
```json
{
  "success": true,
  "data": {
    "section_key": "hero",
    "activo": false
  },
  "message": "Sección desactivada exitosamente"
}
```

---

### Slides

#### POST /api/landing-content/slides

Create a new slide.

**Request Body (multipart/form-data):**
- `section_key`: string (required)
- `tipo`: string (required) - "hero_slide" | "product_slide" | "collage_image"
- `titulo`: string (optional)
- `descripcion`: string (optional)
- `imagen`: file (required) - Image file (max 5MB, jpg/png/webp)
- `orden`: number (optional, defaults to last position)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "section_key": "hero",
    "tipo": "hero_slide",
    "titulo": null,
    "descripcion": null,
    "imagen_url": "https://fotogifty.s3.amazonaws.com/landing/hero/slide5.jpg",
    "orden": 5,
    "activo": true
  },
  "message": "Slide creado exitosamente"
}
```

#### PUT /api/landing-content/slides/:id

Update a slide.

**Request Body (multipart/form-data):**
- `titulo`: string (optional)
- `descripcion`: string (optional)
- `imagen`: file (optional) - New image to replace existing
- `orden`: number (optional)
- `activo`: boolean (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "section_key": "hero",
    ...
  },
  "message": "Slide actualizado exitosamente"
}
```

#### DELETE /api/landing-content/slides/:id

Delete a slide.

**Response:**
```json
{
  "success": true,
  "message": "Slide eliminado exitosamente"
}
```

#### PUT /api/landing-content/slides/reorder

Reorder slides within a section.

**Request Body:**
```json
{
  "section_key": "hero",
  "slide_ids": [3, 1, 4, 2]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Orden actualizado exitosamente"
}
```

---

### Options

#### POST /api/landing-content/options

Create a new option.

**Request Body:**
```json
{
  "section_key": "extensions",
  "texto": "Pack 100 Prints 4x6",
  "orden": 4
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "section_key": "extensions",
    "texto": "Pack 100 Prints 4x6",
    "orden": 4,
    "activo": true
  },
  "message": "Opción creada exitosamente"
}
```

#### PUT /api/landing-content/options/:id

Update an option.

**Request Body:**
```json
{
  "texto": "Pack 100 Prints 5x7",
  "orden": 2,
  "activo": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    ...
  },
  "message": "Opción actualizada exitosamente"
}
```

#### DELETE /api/landing-content/options/:id

Delete an option.

**Response:**
```json
{
  "success": true,
  "message": "Opción eliminada exitosamente"
}
```

#### PUT /api/landing-content/options/reorder

Reorder options within a section.

**Request Body:**
```json
{
  "section_key": "extensions",
  "option_ids": [2, 1, 3]
}
```

---

### Image Upload

#### POST /api/landing-content/upload

Upload an image for landing page content.

**Request Body (multipart/form-data):**
- `section_key`: string (required)
- `image_type`: string (required) - "main" | "background" | "slide"
- `imagen`: file (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://fotogifty.s3.amazonaws.com/landing/hero/main_1234567890.jpg"
  },
  "message": "Imagen subida exitosamente"
}
```

---

## Initial Data Migration

Insert default data for all 11 sections based on current hardcoded values.

```sql
-- Hero Section
INSERT INTO landing_sections (section_key, titulo, subtitulo, boton_texto, boton_color, boton_enlace, configuracion_extra, orden, activo)
VALUES (
  'hero',
  'Imprime y recibe tus fotos',
  'en pocos clics',
  'Imprime prints',
  '#F5A524',
  '/login',
  '{"autoplay": true, "autoplaySpeed": 3000, "transitionSpeed": 3000, "infinite": true}',
  1,
  true
);

INSERT INTO landing_slides (section_key, tipo, imagen_url, orden, activo)
VALUES
  ('hero', 'hero_slide', '/slide1.jpg', 1, true),
  ('hero', 'hero_slide', '/slide2.jpg', 2, true),
  ('hero', 'hero_slide', '/slide3.jpg', 3, true),
  ('hero', 'hero_slide', '/slide4.jpg', 4, true);

-- Extensions Section
INSERT INTO landing_sections (section_key, titulo, subtitulo, imagen_principal_url, boton_color, orden, activo)
VALUES (
  'extensions',
  'Ampliaciones',
  'Perfectas para enmarcar, regalar o conservar en álbumes.',
  '/slide3.jpg',
  '#E04F8B',
  2,
  true
);

INSERT INTO landing_options (section_key, texto, orden, activo)
VALUES
  ('extensions', 'Pack 50 Prints 4x6', 1, true),
  ('extensions', 'Pack 50 Prints 4x6', 2, true),
  ('extensions', 'Pack 50 Prints 4x6', 3, true);

-- Product Slider Section
INSERT INTO landing_sections (section_key, texto_primario, texto_secundario, configuracion_extra, orden, activo)
VALUES (
  'product_slider',
  'Cada fotografía es impresa en papel lustre profesional',
  ', que realza los colores y los detalles con un acabado elegante y duradero.',
  '{"autoplay": true, "autoplaySpeed": 3000, "infinite": true}',
  3,
  true
);

INSERT INTO landing_slides (section_key, tipo, titulo, descripcion, imagen_url, orden, activo)
VALUES
  ('product_slider', 'product_slide', 'Pack 50 5x7', 'Impresas en papel lustre profesional con revelado tradicional.', '/product-slider/slide1.jpg', 1, true),
  ('product_slider', 'product_slide', 'Pack 50 5x7', 'Impresas en papel lustre profesional con revelado tradicional.', '/product-slider/slide1.jpg', 2, true),
  ('product_slider', 'product_slide', 'Pack 50 5x7', 'Impresas en papel lustre profesional con revelado tradicional.', '/product-slider/slide1.jpg', 3, true),
  ('product_slider', 'product_slide', 'Pack 50 5x7', 'Impresas en papel lustre profesional con revelado tradicional.', '/product-slider/slide1.jpg', 4, true);

-- Legend Section
INSERT INTO landing_sections (section_key, texto_primario, texto_secundario, imagen_fondo_url, color_gradiente_inicio, color_gradiente_medio, color_gradiente_fin, orden, activo)
VALUES (
  'legend',
  'Imprime tus recuerdos',
  '¡Regala sus mejores momentos!',
  '/slide3.jpg',
  '#FCD34D00',
  '#38BDF880',
  '#EC489980',
  4,
  true
);

-- Calendars Section
INSERT INTO landing_sections (section_key, titulo, subtitulo, descripcion, orden, activo)
VALUES (
  'calendars',
  'Calendarios',
  'Perfectas para enmarcar, regalar o conservar en álbumes.',
  'Nuestras photo prints transforman tus recuerdos digitales en piezas tangibles que perduran en el tiempo.',
  5,
  true
);

INSERT INTO landing_slides (section_key, tipo, imagen_url, orden, activo)
VALUES
  ('calendars', 'collage_image', '/slide3.jpg', 1, true),
  ('calendars', 'collage_image', '/slide3.jpg', 2, true),
  ('calendars', 'collage_image', '/slide3.jpg', 3, true),
  ('calendars', 'collage_image', '/slide3.jpg', 4, true);

INSERT INTO landing_options (section_key, texto, orden, activo)
VALUES
  ('calendars', 'Pack 50 Prints 4x6', 1, true),
  ('calendars', 'Pack 50 Prints 4x6', 2, true),
  ('calendars', 'Pack 50 Prints 4x6', 3, true);

-- Single Product Section
INSERT INTO landing_sections (section_key, titulo, imagen_fondo_url, boton_texto, boton_color, boton_enlace, orden, activo)
VALUES (
  'single_product',
  'Pack de 100 fotografías tamaño 4x6',
  '/SingleProduct.jpg',
  'Ordenar',
  '#E04F8B',
  '#',
  6,
  true
);

-- Prints Section
INSERT INTO landing_sections (section_key, titulo, subtitulo, descripcion, imagen_principal_url, orden, activo)
VALUES (
  'prints',
  'Prints',
  'Perfectas para enmarcar, regalar o conservar en álbumes.',
  'Nuestras photo prints transforman tus recuerdos digitales en piezas tangibles que perduran en el tiempo.',
  '/slide1.jpg',
  7,
  true
);

INSERT INTO landing_options (section_key, texto, orden, activo)
VALUES
  ('prints', 'Pack 50 Prints 4x6', 1, true),
  ('prints', 'Pack 50 Prints 4x6', 2, true),
  ('prints', 'Pack 50 Prints 4x6', 3, true);

-- Polaroids Banner Section
INSERT INTO landing_sections (section_key, texto_primario, texto_secundario, color_primario, orden, activo)
VALUES (
  'polaroids_banner',
  'Cada fotografía es impresa en papel lustre profesional',
  ', que realza los colores y los detalles con un acabado elegante y duradero.',
  '#F5A524',
  8,
  true
);

-- Polaroids Single Section
INSERT INTO landing_sections (section_key, titulo, subtitulo, descripcion, imagen_principal_url, boton_color, orden, activo)
VALUES (
  'polaroids_single',
  'Imprime tus recuerdos,',
  'Pack 50 fotos polaroid',
  'consérvalos para siempre.',
  '/slide3.jpg',
  '#47BEE5',
  9,
  true
);

-- Polaroids Collage Section
INSERT INTO landing_sections (section_key, titulo, subtitulo, orden, activo)
VALUES (
  'polaroids_collage',
  'Polaroid Prints',
  'Perfectas para decorar tus espacios, crear murales, álbumes creativos o regalar recuerdos con un estilo único y atemporal.',
  10,
  true
);

INSERT INTO landing_slides (section_key, tipo, imagen_url, orden, activo)
VALUES
  ('polaroids_collage', 'collage_image', '/slide3.jpg', 1, true),
  ('polaroids_collage', 'collage_image', '/slide3.jpg', 2, true),
  ('polaroids_collage', 'collage_image', '/slide3.jpg', 3, true),
  ('polaroids_collage', 'collage_image', '/slide3.jpg', 4, true);

INSERT INTO landing_options (section_key, texto, orden, activo)
VALUES
  ('polaroids_collage', 'Pack 50 Prints 4x6', 1, true),
  ('polaroids_collage', 'Pack 50 Prints 4x6', 2, true),
  ('polaroids_collage', 'Pack 50 Prints 4x6', 3, true);

-- Platform Showcase Section
INSERT INTO landing_sections (section_key, texto_primario, texto_secundario, imagen_principal_url, color_gradiente_inicio, color_gradiente_medio, color_gradiente_fin, orden, activo)
VALUES (
  'platform_showcase',
  'Edita, envía y recibe tu pedido.',
  'Todo desde la comodidad de tu casa.',
  '/MainUser.png',
  '#0891B2B3',
  '#FCD34DB3',
  '#EC4899B3',
  11,
  true
);
```

---

## Error Responses

All endpoints should return consistent error responses:

```json
{
  "success": false,
  "error": "Mensaje de error descriptivo",
  "code": "ERROR_CODE"
}
```

**Common error codes:**
- `SECTION_NOT_FOUND`: Section key doesn't exist
- `SLIDE_NOT_FOUND`: Slide ID doesn't exist
- `OPTION_NOT_FOUND`: Option ID doesn't exist
- `INVALID_IMAGE`: Image file is invalid or too large
- `VALIDATION_ERROR`: Request body validation failed

---

## Image Storage

Images should be stored in S3 with the following path structure:

```
fotogifty.s3.us-east-1.amazonaws.com/landing/{section_key}/{image_type}_{timestamp}.{ext}
```

Example:
- `landing/hero/slide_1704067200.jpg`
- `landing/extensions/main_1704067200.jpg`
- `landing/legend/background_1704067200.jpg`

---

## Security Considerations

1. **Authentication**: All endpoints require admin authentication
2. **Authorization**: Only users with `admin` or `super_admin` role can access
3. **File Validation**:
   - Max file size: 5MB
   - Allowed types: image/jpeg, image/png, image/webp
   - Validate image dimensions (max 4000x4000px)
4. **Input Sanitization**: Sanitize all text inputs to prevent XSS
5. **Rate Limiting**: Limit image uploads to 10 per minute per user

---

## Swagger Documentation

Add these endpoints to the existing Swagger documentation at `/api-docs`.

```yaml
tags:
  - name: Landing Content
    description: CMS endpoints for landing page content management

paths:
  /landing-content/sections:
    get:
      tags: [Landing Content]
      summary: Get all landing page sections
      security:
        - bearerAuth: []
      responses:
        200:
          description: List of sections with slides and options

  /landing-content/sections/{sectionKey}:
    get:
      tags: [Landing Content]
      summary: Get a single section by key
      parameters:
        - name: sectionKey
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Section details
    put:
      tags: [Landing Content]
      summary: Update a section
      parameters:
        - name: sectionKey
          in: path
          required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LandingSectionUpdate'
      responses:
        200:
          description: Updated section

# ... (add remaining endpoints)
```

---

## Frontend Integration Notes

1. **Proxy Configuration**: Endpoints are accessed via `/api/landing-content/*` through Next.js proxy
2. **Caching**: Frontend uses ISR with 60-second revalidation for public landing page
3. **Admin**: Admin panel fetches fresh data on each load
4. **Image URLs**: Can be relative ("/slide1.jpg") or absolute S3 URLs
