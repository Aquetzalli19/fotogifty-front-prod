# Product Page CMS - Backend Specification

## Overview

This document specifies the backend API required for the Product Page Content Management System. It follows the same pattern as the Landing Page CMS (`/api/landing-content`).

The Product Page CMS manages 6 sections of marketing content shared across **all** product detail pages. These are NOT per-product — they are global marketing sections (e.g., "Why Choose FotoGifty", paper types, sizes table).

## Database Schema

### Tables

```sql
-- Main sections (6 fixed rows, one per section_key)
CREATE TABLE product_page_sections (
  id SERIAL PRIMARY KEY,
  section_key VARCHAR(50) UNIQUE NOT NULL,
  titulo VARCHAR(255),
  subtitulo TEXT,
  descripcion TEXT,
  imagen_principal_url VARCHAR(500),
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Slides: images, cards, paper types, services, product types
CREATE TABLE product_page_slides (
  id SERIAL PRIMARY KEY,
  section_key VARCHAR(50) NOT NULL REFERENCES product_page_sections(section_key),
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

-- Options: features per paper type, table rows
CREATE TABLE product_page_options (
  id SERIAL PRIMARY KEY,
  section_key VARCHAR(50) NOT NULL REFERENCES product_page_sections(section_key),
  slide_id INT REFERENCES product_page_slides(id) ON DELETE CASCADE,
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
```

### Section Keys

| section_key | Description | slide.tipo |
|---|---|---|
| `gallery` | Image mosaic gallery | `gallery_image` |
| `why_choose` | Value proposition cards | `value_card` |
| `paper_types` | Paper type tabs with features | `paper_type` |
| `print_services` | Service cards | `service_card` |
| `product_types` | Product type showcase | `product_type` |
| `sizes_table` | Sizes comparison table | _(no slides)_ |

### Slide Types

| tipo | Fields used |
|---|---|
| `gallery_image` | imagen_url, titulo (as alt text), descripcion (CSS span classes) |
| `value_card` | titulo, descripcion, icono (Lucide icon name e.g. "Shield") |
| `paper_type` | titulo, descripcion, imagen_url. Has child options (features) via slide_id |
| `service_card` | titulo, descripcion, imagen_url |
| `product_type` | titulo, descripcion, imagen_url |

### Option Usage

| section_key | slide_id | Fields |
|---|---|---|
| `paper_types` | References parent slide | texto = feature text |
| `sizes_table` | NULL | texto = size, texto_secundario = dimensions, texto_terciario = resolution, texto_cuarto = editor type, texto_quinto = price |

## REST API Endpoints

Base URL: `/api/product-page-content`

### Sections

```
GET    /sections
       → Returns all sections with nested slides and options
       → Response: { success: true, data: Section[] }
       → Each section includes: { ...section_fields, slides: Slide[], options: Option[] }

GET    /sections/:sectionKey
       → Returns one section with its slides and options
       → Response: { success: true, data: Section }

PUT    /sections/:sectionKey
       → Update section fields (titulo, subtitulo, descripcion, imagen_principal_url, activo)
       → Body: { titulo?: string, subtitulo?: string, ... }
       → Response: { success: true, data: Section (with slides and options) }

PATCH  /sections/:sectionKey/toggle
       → Toggle activo field
       → Response: { success: true, data: { activo: boolean } }
```

### Slides

```
POST   /slides
       → Create a new slide
       → Body: { section_key, tipo, titulo?, descripcion?, imagen_url?, icono?, orden? }
       → Response: { success: true, data: Slide }

PUT    /slides/:id
       → Update a slide
       → Body: { titulo?, descripcion?, imagen_url?, icono?, orden?, activo? }
       → Response: { success: true, data: Slide }

DELETE /slides/:id
       → Delete a slide (cascades to associated options)
       → Response: { success: true }

PUT    /slides/reorder
       → Reorder slides within a section
       → Body: { section_key: string, slide_ids: number[] }
       → Response: { success: true }
```

### Options

```
POST   /options
       → Create a new option
       → Body: { section_key, slide_id?, texto, texto_secundario?, texto_terciario?, texto_cuarto?, texto_quinto?, orden? }
       → Response: { success: true, data: Option }

PUT    /options/:id
       → Update an option
       → Body: { texto?, texto_secundario?, texto_terciario?, texto_cuarto?, texto_quinto?, orden?, activo? }
       → Response: { success: true, data: Option }

DELETE /options/:id
       → Delete an option
       → Response: { success: true }

PUT    /options/reorder
       → Reorder options within a section
       → Body: { section_key: string, option_ids: number[] }
       → Response: { success: true }
```

### Image Upload

```
POST   /upload
       → Upload image to S3
       → Body: FormData { section_key, image_type ('main' | 'slide'), imagen: File }
       → Response: { success: true, data: { url: string } }
```

## Seed Data

Insert the 6 sections with their initial content matching the current static data:

```sql
-- Sections
INSERT INTO product_page_sections (section_key, titulo, subtitulo, orden, activo) VALUES
('gallery', 'Imprime Tus Mejores Momentos', 'Cada foto cuenta una historia. Nosotros la imprimimos con la calidad que merece.', 1, true),
('why_choose', 'Por Qué Elegir FotoGifty', 'Nos dedicamos a transformar tus recuerdos digitales en impresiones de la más alta calidad.', 2, true),
('paper_types', 'Tipos de Papel', 'Elige el acabado perfecto para cada ocasión. Todos nuestros papeles son de grado profesional.', 3, true),
('print_services', 'Nuestros Servicios de Impresión', 'Ofrecemos una variedad de productos para que tus recuerdos cobren vida.', 4, true),
('product_types', 'Nuestros Productos', 'Tres estilos únicos para dar vida a tus fotos favoritas.', 5, true),
('sizes_table', 'Tamaños y Opciones', 'Encuentra el tamaño perfecto para cada momento. Todos con impresión a 300 DPI.', 6, true);

-- Gallery slides
INSERT INTO product_page_slides (section_key, tipo, titulo, descripcion, imagen_url, orden) VALUES
('gallery', 'gallery_image', 'Impresión de foto profesional', 'col-span-2 row-span-2', '/slide1.jpg', 1),
('gallery', 'gallery_image', 'Foto impresa de alta calidad', '', '/slide2.jpg', 2),
('gallery', 'gallery_image', 'Detalle de impresión fotográfica', '', '/slide3.jpg', 3),
('gallery', 'gallery_image', 'Colección de fotos impresas', '', '/slide4.jpg', 4),
('gallery', 'gallery_image', 'Producto de impresión', '', '/SingleProduct.jpg', 5),
('gallery', 'gallery_image', 'Ejemplo de foto impresa', 'col-span-2', '/product-slider/slide1.jpg', 6);

-- Why Choose slides
INSERT INTO product_page_slides (section_key, tipo, titulo, descripcion, icono, orden) VALUES
('why_choose', 'value_card', 'Calidad Profesional', 'Impresiones en papel fotográfico premium con tecnología de última generación para colores vibrantes y detalles nítidos.', 'Award', 1),
('why_choose', 'value_card', 'Personalización Total', 'Editor integrado con filtros, ajustes y efectos para que cada foto quede exactamente como la imaginas.', 'Palette', 2),
('why_choose', 'value_card', 'Envío a Todo México', 'Recibe tus impresiones en la puerta de tu casa con envío seguro y rastreable a cualquier parte del país.', 'Truck', 3),
('why_choose', 'value_card', 'Pago 100% Seguro', 'Transacciones protegidas con Stripe. Tu información financiera siempre está segura con nosotros.', 'Shield', 4),
('why_choose', 'value_card', 'Entrega Rápida', 'Procesamos tu pedido en tiempo récord para que disfrutes tus fotos impresas lo antes posible.', 'Clock', 5),
('why_choose', 'value_card', 'Garantía de Satisfacción', 'Si no estás satisfecho con la calidad de impresión, te reimprimimos sin costo adicional.', 'HeartHandshake', 6);

-- Paper Types slides (IDs will be auto-generated; use them for options below)
INSERT INTO product_page_slides (section_key, tipo, titulo, descripcion, imagen_url, orden) VALUES
('paper_types', 'paper_type', 'Lustre', 'El acabado preferido por fotógrafos profesionales. Ofrece una textura suave con un brillo sutil que reduce reflejos y resalta los detalles de la imagen.', '/slide1.jpg', 1),
('paper_types', 'paper_type', 'Mate', 'Acabado sin brillo que ofrece una apariencia sofisticada y artística. Perfecto para fotos en blanco y negro y fotografía artística.', '/slide2.jpg', 2),
('paper_types', 'paper_type', 'Brillante', 'El acabado clásico con brillo intenso que hace que los colores resalten al máximo. Ideal para fotos coloridas y vibrantes.', '/slide3.jpg', 3);

-- Paper type features (options with slide_id referencing each paper type slide)
-- Lustre features (slide_id = ID of Lustre slide)
INSERT INTO product_page_options (section_key, slide_id, texto, orden) VALUES
('paper_types', /* lustre_id */, 'Textura semi-mate elegante', 1),
('paper_types', /* lustre_id */, 'Reduce reflejos y huellas', 2),
('paper_types', /* lustre_id */, 'Ideal para retratos y paisajes', 3),
('paper_types', /* lustre_id */, 'Colores ricos y naturales', 4),
('paper_types', /* lustre_id */, 'Resistente al desgaste', 5);

-- Mate features
INSERT INTO product_page_options (section_key, slide_id, texto, orden) VALUES
('paper_types', /* mate_id */, 'Sin reflejos ni brillos', 1),
('paper_types', /* mate_id */, 'Apariencia artística y elegante', 2),
('paper_types', /* mate_id */, 'Perfecto para fotos B&N', 3),
('paper_types', /* mate_id */, 'Fácil de enmarcar', 4),
('paper_types', /* mate_id */, 'Textura suave al tacto', 5);

-- Brillante features
INSERT INTO product_page_options (section_key, slide_id, texto, orden) VALUES
('paper_types', /* brillante_id */, 'Colores ultra vibrantes', 1),
('paper_types', /* brillante_id */, 'Brillo intenso y llamativo', 2),
('paper_types', /* brillante_id */, 'Contraste máximo', 3),
('paper_types', /* brillante_id */, 'Ideal para fotos a color', 4),
('paper_types', /* brillante_id */, 'El clásico favorito', 5);

-- Print Services slides
INSERT INTO product_page_slides (section_key, tipo, titulo, descripcion, imagen_url, orden) VALUES
('print_services', 'service_card', 'Impresiones Estándar', 'Fotos impresas en múltiples tamaños con la calidad que tus recuerdos merecen.', '/slide1.jpg', 1),
('print_services', 'service_card', 'Calendarios Personalizados', 'Crea calendarios únicos con tus fotos favoritas para cada mes del año.', '/slide2.jpg', 2),
('print_services', 'service_card', 'Fotos Estilo Polaroid', 'El encanto retro de las polaroid con la calidad de impresión moderna.', '/slide3.jpg', 3),
('print_services', 'service_card', 'Paquetes Especiales', 'Combina diferentes tamaños y estilos en un solo pedido con descuentos exclusivos.', '/slide4.jpg', 4);

-- Product Types slides
INSERT INTO product_page_slides (section_key, tipo, titulo, descripcion, imagen_url, orden) VALUES
('product_types', 'product_type', 'Impresiones Estándar', 'Disponibles en múltiples tamaños, desde 4×6 hasta 8×10. Perfectas para enmarcar o regalar.', '/slide1.jpg', 1),
('product_types', 'product_type', 'Calendarios', '12 meses con tus fotos favoritas. Personaliza cada mes con tu editor integrado.', '/Calendar.png', 2),
('product_types', 'product_type', 'Polaroid', 'El estilo retro que nunca pasa de moda. Marco blanco clásico con espacio para texto.', '/polaroid/Polaroid.png', 3);

-- Sizes Table options
INSERT INTO product_page_options (section_key, slide_id, texto, texto_secundario, texto_terciario, texto_cuarto, texto_quinto, orden) VALUES
('sizes_table', NULL, '4×6"', '10 × 15 cm', '300 DPI', 'Estándar', '$15.00', 1),
('sizes_table', NULL, '5×7"', '13 × 18 cm', '300 DPI', 'Estándar', '$25.00', 2),
('sizes_table', NULL, '8×10"', '20 × 25 cm', '300 DPI', 'Estándar', '$45.00', 3),
('sizes_table', NULL, 'Polaroid', '7.6 × 7.6 cm', '300 DPI', 'Polaroid', '$12.00', 4),
('sizes_table', NULL, 'Calendario', '21.6 × 28 cm', '300 DPI', 'Calendario', '$99.00', 5);
```

**Note:** Replace `/* lustre_id */`, `/* mate_id */`, `/* brillante_id */` with the actual auto-generated IDs from the paper_types slides insert.

## Response Format

All endpoints should return:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error description"
}
```

## GET /sections Response Example

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "section_key": "gallery",
      "titulo": "Imprime Tus Mejores Momentos",
      "subtitulo": "Cada foto cuenta una historia...",
      "descripcion": null,
      "imagen_principal_url": null,
      "orden": 1,
      "activo": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "slides": [
        {
          "id": 1,
          "section_key": "gallery",
          "tipo": "gallery_image",
          "titulo": "Impresión de foto profesional",
          "descripcion": "col-span-2 row-span-2",
          "imagen_url": "/slide1.jpg",
          "icono": null,
          "orden": 1,
          "activo": true
        }
      ],
      "options": []
    }
  ]
}
```

## Next.js Proxy

Add to `next.config.ts` rewrites (if not using a catch-all pattern):

```javascript
{
  source: '/api/product-page-content/:path*',
  destination: `${process.env.NEXT_PUBLIC_API_URL}/product-page-content/:path*`
}
```

## Frontend Integration

The frontend service is at `src/services/product-page-content.ts`. It currently uses `USE_MOCK_DATA = true` with in-memory defaults. Set to `false` when backend endpoints are deployed.

Frontend mapper at `src/lib/mappers/product-page-mapper.ts` handles `snake_case` ↔ `camelCase` conversion.
