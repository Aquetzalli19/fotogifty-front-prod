# Guía de Implementación Backend - Landing Page CMS

## Resumen

Esta guía detalla cómo implementar el backend para el CMS de la Landing Page de FotoGifty. El sistema permite editar el contenido de 11 secciones de la landing page desde el panel de administración.

---

## Índice

1. [Requisitos Previos](#1-requisitos-previos)
2. [Modelo de Base de Datos](#2-modelo-de-base-de-datos)
3. [Estructura del Proyecto](#3-estructura-del-proyecto)
4. [Implementación de Endpoints](#4-implementación-de-endpoints)
5. [Subida de Imágenes a S3](#5-subida-de-imágenes-a-s3)
6. [Autenticación y Autorización](#6-autenticación-y-autorización)
7. [Migración de Datos Iniciales](#7-migración-de-datos-iniciales)
8. [Testing](#8-testing)
9. [Conexión con el Frontend](#9-conexión-con-el-frontend)

---

## 1. Requisitos Previos

### Tecnologías Necesarias
- **Node.js** 18+
- **Express.js** o framework similar
- **PostgreSQL** (recomendado) o MySQL
- **AWS S3** para almacenamiento de imágenes
- **Multer** para manejo de archivos

### Dependencias NPM
```bash
npm install express pg multer aws-sdk uuid sharp
npm install -D @types/express @types/multer
```

---

## 2. Modelo de Base de Datos

### Diagrama ER

```
┌─────────────────────┐
│  landing_sections   │
├─────────────────────┤
│ id (PK)             │
│ section_key (UNIQUE)│◄──────┐
│ titulo              │       │
│ subtitulo           │       │
│ descripcion         │       │
│ texto_primario      │       │
│ texto_secundario    │       │
│ color_primario      │       │
│ color_secundario    │       │
│ color_gradiente_*   │       │
│ imagen_principal_url│       │
│ imagen_fondo_url    │       │
│ boton_texto         │       │
│ boton_color         │       │
│ boton_enlace        │       │
│ configuracion_extra │       │
│ orden               │       │
│ activo              │       │
│ created_at          │       │
│ updated_at          │       │
└─────────────────────┘       │
                              │
┌─────────────────────┐       │
│   landing_slides    │       │
├─────────────────────┤       │
│ id (PK)             │       │
│ section_key (FK)    │───────┤
│ tipo                │       │
│ titulo              │       │
│ descripcion         │       │
│ imagen_url          │       │
│ orden               │       │
│ activo              │       │
│ created_at          │       │
│ updated_at          │       │
└─────────────────────┘       │
                              │
┌─────────────────────┐       │
│   landing_options   │       │
├─────────────────────┤       │
│ id (PK)             │       │
│ section_key (FK)    │───────┘
│ texto               │
│ orden               │
│ activo              │
│ created_at          │
│ updated_at          │
└─────────────────────┘
```

### Scripts SQL de Creación

```sql
-- ===========================================
-- TABLA: landing_sections
-- ===========================================
CREATE TABLE landing_sections (
  id SERIAL PRIMARY KEY,
  section_key VARCHAR(50) UNIQUE NOT NULL,
  titulo VARCHAR(255),
  subtitulo TEXT,
  descripcion TEXT,
  texto_primario TEXT,
  texto_secundario TEXT,
  color_primario VARCHAR(9),          -- #RRGGBB o #RRGGBBAA
  color_secundario VARCHAR(9),
  color_gradiente_inicio VARCHAR(9),
  color_gradiente_medio VARCHAR(9),
  color_gradiente_fin VARCHAR(9),
  imagen_principal_url VARCHAR(500),
  imagen_fondo_url VARCHAR(500),
  boton_texto VARCHAR(100),
  boton_color VARCHAR(9),
  boton_enlace VARCHAR(255),
  configuracion_extra JSONB,          -- Para config del carrusel
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para ordenamiento
CREATE INDEX idx_landing_sections_orden ON landing_sections(orden);

-- Constraint para valores válidos de section_key
ALTER TABLE landing_sections ADD CONSTRAINT chk_section_key
CHECK (section_key IN (
  'hero', 'extensions', 'product_slider', 'legend', 'calendars',
  'single_product', 'prints', 'polaroids_banner', 'polaroids_single',
  'polaroids_collage', 'platform_showcase'
));

-- ===========================================
-- TABLA: landing_slides
-- ===========================================
CREATE TABLE landing_slides (
  id SERIAL PRIMARY KEY,
  section_key VARCHAR(50) NOT NULL,
  tipo VARCHAR(30) NOT NULL,
  titulo VARCHAR(255),
  descripcion TEXT,
  imagen_url VARCHAR(500) NOT NULL,
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_slides_section
    FOREIGN KEY (section_key)
    REFERENCES landing_sections(section_key)
    ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_landing_slides_section ON landing_slides(section_key);
CREATE INDEX idx_landing_slides_orden ON landing_slides(section_key, orden);

-- Constraint para tipos válidos
ALTER TABLE landing_slides ADD CONSTRAINT chk_slide_tipo
CHECK (tipo IN ('hero_slide', 'product_slide', 'collage_image'));

-- ===========================================
-- TABLA: landing_options
-- ===========================================
CREATE TABLE landing_options (
  id SERIAL PRIMARY KEY,
  section_key VARCHAR(50) NOT NULL,
  texto VARCHAR(255) NOT NULL,
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_options_section
    FOREIGN KEY (section_key)
    REFERENCES landing_sections(section_key)
    ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_landing_options_section ON landing_options(section_key);
CREATE INDEX idx_landing_options_orden ON landing_options(section_key, orden);

-- ===========================================
-- TRIGGER: Actualizar updated_at
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_landing_sections_updated_at
    BEFORE UPDATE ON landing_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_landing_slides_updated_at
    BEFORE UPDATE ON landing_slides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_landing_options_updated_at
    BEFORE UPDATE ON landing_options
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 3. Estructura del Proyecto

```
backend/
├── src/
│   ├── controllers/
│   │   └── landingContentController.js
│   ├── models/
│   │   ├── LandingSection.js
│   │   ├── LandingSlide.js
│   │   └── LandingOption.js
│   ├── routes/
│   │   └── landingContentRoutes.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── services/
│   │   ├── landingContentService.js
│   │   └── s3Service.js
│   └── utils/
│       └── validators.js
├── migrations/
│   ├── 001_create_landing_tables.sql
│   └── 002_seed_landing_data.sql
└── config/
    └── s3.js
```

---

## 4. Implementación de Endpoints

### 4.1 Rutas (routes/landingContentRoutes.js)

```javascript
const express = require('express');
const router = express.Router();
const landingController = require('../controllers/landingContentController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { uploadMiddleware } = require('../middleware/upload');

// ============================================
// SECCIONES
// ============================================

// GET /api/landing-content/sections - Obtener todas las secciones (público para landing)
router.get('/sections', landingController.getAllSections);

// GET /api/landing-content/sections/:sectionKey - Obtener sección específica
router.get('/sections/:sectionKey', landingController.getSectionByKey);

// PUT /api/landing-content/sections/:sectionKey - Actualizar sección (admin)
router.put('/sections/:sectionKey', authMiddleware, adminOnly, landingController.updateSection);

// PATCH /api/landing-content/sections/:sectionKey/toggle - Toggle activo (admin)
router.patch('/sections/:sectionKey/toggle', authMiddleware, adminOnly, landingController.toggleSection);

// ============================================
// SLIDES
// ============================================

// POST /api/landing-content/slides - Crear slide (admin)
router.post('/slides', authMiddleware, adminOnly, uploadMiddleware.single('imagen'), landingController.createSlide);

// PUT /api/landing-content/slides/:id - Actualizar slide (admin)
router.put('/slides/:id', authMiddleware, adminOnly, uploadMiddleware.single('imagen'), landingController.updateSlide);

// DELETE /api/landing-content/slides/:id - Eliminar slide (admin)
router.delete('/slides/:id', authMiddleware, adminOnly, landingController.deleteSlide);

// PUT /api/landing-content/slides/reorder - Reordenar slides (admin)
router.put('/slides/reorder', authMiddleware, adminOnly, landingController.reorderSlides);

// ============================================
// OPTIONS
// ============================================

// POST /api/landing-content/options - Crear opción (admin)
router.post('/options', authMiddleware, adminOnly, landingController.createOption);

// PUT /api/landing-content/options/:id - Actualizar opción (admin)
router.put('/options/:id', authMiddleware, adminOnly, landingController.updateOption);

// DELETE /api/landing-content/options/:id - Eliminar opción (admin)
router.delete('/options/:id', authMiddleware, adminOnly, landingController.deleteOption);

// PUT /api/landing-content/options/reorder - Reordenar opciones (admin)
router.put('/options/reorder', authMiddleware, adminOnly, landingController.reorderOptions);

// ============================================
// UPLOAD DE IMÁGENES
// ============================================

// POST /api/landing-content/upload - Subir imagen (admin)
router.post('/upload', authMiddleware, adminOnly, uploadMiddleware.single('imagen'), landingController.uploadImage);

module.exports = router;
```

### 4.2 Controlador (controllers/landingContentController.js)

```javascript
const landingService = require('../services/landingContentService');
const s3Service = require('../services/s3Service');

// ============================================
// SECCIONES
// ============================================

/**
 * GET /sections
 * Obtener todas las secciones con slides y options
 */
exports.getAllSections = async (req, res) => {
  try {
    const sections = await landingService.getAllSectionsWithRelations();

    res.json({
      success: true,
      data: sections
    });
  } catch (error) {
    console.error('Error getting sections:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las secciones'
    });
  }
};

/**
 * GET /sections/:sectionKey
 * Obtener una sección específica
 */
exports.getSectionByKey = async (req, res) => {
  try {
    const { sectionKey } = req.params;
    const section = await landingService.getSectionByKey(sectionKey);

    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Sección no encontrada',
        code: 'SECTION_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: section
    });
  } catch (error) {
    console.error('Error getting section:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la sección'
    });
  }
};

/**
 * PUT /sections/:sectionKey
 * Actualizar una sección
 */
exports.updateSection = async (req, res) => {
  try {
    const { sectionKey } = req.params;
    const updateData = req.body;

    // Validar que la sección existe
    const existing = await landingService.getSectionByKey(sectionKey);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Sección no encontrada',
        code: 'SECTION_NOT_FOUND'
      });
    }

    const updated = await landingService.updateSection(sectionKey, updateData);

    res.json({
      success: true,
      data: updated,
      message: 'Sección actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar la sección'
    });
  }
};

/**
 * PATCH /sections/:sectionKey/toggle
 * Toggle estado activo de una sección
 */
exports.toggleSection = async (req, res) => {
  try {
    const { sectionKey } = req.params;

    const section = await landingService.getSectionByKey(sectionKey);
    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Sección no encontrada'
      });
    }

    const newStatus = !section.section.activo;
    await landingService.updateSection(sectionKey, { activo: newStatus });

    res.json({
      success: true,
      data: { activo: newStatus },
      message: newStatus ? 'Sección activada' : 'Sección desactivada'
    });
  } catch (error) {
    console.error('Error toggling section:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cambiar estado de la sección'
    });
  }
};

// ============================================
// SLIDES
// ============================================

/**
 * POST /slides
 * Crear un nuevo slide
 */
exports.createSlide = async (req, res) => {
  try {
    const { section_key, tipo, titulo, descripcion, orden } = req.body;

    // Validar sección
    const section = await landingService.getSectionByKey(section_key);
    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Sección no encontrada'
      });
    }

    // Subir imagen a S3 si se proporcionó
    let imagen_url = req.body.imagen_url;
    if (req.file) {
      imagen_url = await s3Service.uploadImage(
        req.file,
        `landing/${section_key}/slides`
      );
    }

    if (!imagen_url) {
      return res.status(400).json({
        success: false,
        error: 'La imagen es requerida'
      });
    }

    const slide = await landingService.createSlide({
      section_key,
      tipo,
      titulo,
      descripcion,
      imagen_url,
      orden: orden || await landingService.getNextSlideOrder(section_key)
    });

    res.status(201).json({
      success: true,
      data: slide,
      message: 'Slide creado exitosamente'
    });
  } catch (error) {
    console.error('Error creating slide:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear el slide'
    });
  }
};

/**
 * PUT /slides/:id
 * Actualizar un slide
 */
exports.updateSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Subir nueva imagen si se proporcionó
    if (req.file) {
      const slide = await landingService.getSlideById(id);
      if (slide) {
        updateData.imagen_url = await s3Service.uploadImage(
          req.file,
          `landing/${slide.section_key}/slides`
        );
        // Opcional: eliminar imagen anterior de S3
        // await s3Service.deleteImage(slide.imagen_url);
      }
    }

    const updated = await landingService.updateSlide(id, updateData);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Slide no encontrado'
      });
    }

    res.json({
      success: true,
      data: updated,
      message: 'Slide actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error updating slide:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el slide'
    });
  }
};

/**
 * DELETE /slides/:id
 * Eliminar un slide
 */
exports.deleteSlide = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await landingService.deleteSlide(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Slide no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Slide eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting slide:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar el slide'
    });
  }
};

/**
 * PUT /slides/reorder
 * Reordenar slides
 */
exports.reorderSlides = async (req, res) => {
  try {
    const { section_key, slide_ids } = req.body;

    await landingService.reorderSlides(section_key, slide_ids);

    res.json({
      success: true,
      message: 'Orden actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error reordering slides:', error);
    res.status(500).json({
      success: false,
      error: 'Error al reordenar slides'
    });
  }
};

// ============================================
// OPTIONS
// ============================================

/**
 * POST /options
 * Crear una nueva opción
 */
exports.createOption = async (req, res) => {
  try {
    const { section_key, texto, orden } = req.body;

    // Validar sección
    const section = await landingService.getSectionByKey(section_key);
    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Sección no encontrada'
      });
    }

    const option = await landingService.createOption({
      section_key,
      texto,
      orden: orden || await landingService.getNextOptionOrder(section_key)
    });

    res.status(201).json({
      success: true,
      data: option,
      message: 'Opción creada exitosamente'
    });
  } catch (error) {
    console.error('Error creating option:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear la opción'
    });
  }
};

/**
 * PUT /options/:id
 * Actualizar una opción
 */
exports.updateOption = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updated = await landingService.updateOption(id, updateData);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Opción no encontrada'
      });
    }

    res.json({
      success: true,
      data: updated,
      message: 'Opción actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error updating option:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar la opción'
    });
  }
};

/**
 * DELETE /options/:id
 * Eliminar una opción
 */
exports.deleteOption = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await landingService.deleteOption(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Opción no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Opción eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting option:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la opción'
    });
  }
};

/**
 * PUT /options/reorder
 * Reordenar opciones
 */
exports.reorderOptions = async (req, res) => {
  try {
    const { section_key, option_ids } = req.body;

    await landingService.reorderOptions(section_key, option_ids);

    res.json({
      success: true,
      message: 'Orden actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error reordering options:', error);
    res.status(500).json({
      success: false,
      error: 'Error al reordenar opciones'
    });
  }
};

// ============================================
// UPLOAD
// ============================================

/**
 * POST /upload
 * Subir imagen genérica para landing
 */
exports.uploadImage = async (req, res) => {
  try {
    const { section_key, image_type } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionó ninguna imagen'
      });
    }

    const url = await s3Service.uploadImage(
      req.file,
      `landing/${section_key}/${image_type}`
    );

    res.json({
      success: true,
      data: { url },
      message: 'Imagen subida exitosamente'
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      error: 'Error al subir la imagen'
    });
  }
};
```

### 4.3 Servicio (services/landingContentService.js)

```javascript
const pool = require('../config/database');

// ============================================
// SECCIONES
// ============================================

/**
 * Obtener todas las secciones con sus slides y options
 */
exports.getAllSectionsWithRelations = async () => {
  const sectionsResult = await pool.query(`
    SELECT * FROM landing_sections
    ORDER BY orden ASC
  `);

  const sections = [];

  for (const section of sectionsResult.rows) {
    const slidesResult = await pool.query(`
      SELECT * FROM landing_slides
      WHERE section_key = $1
      ORDER BY orden ASC
    `, [section.section_key]);

    const optionsResult = await pool.query(`
      SELECT * FROM landing_options
      WHERE section_key = $1
      ORDER BY orden ASC
    `, [section.section_key]);

    sections.push({
      ...section,
      slides: slidesResult.rows,
      options: optionsResult.rows
    });
  }

  return sections;
};

/**
 * Obtener sección por key con relaciones
 */
exports.getSectionByKey = async (sectionKey) => {
  const sectionResult = await pool.query(`
    SELECT * FROM landing_sections
    WHERE section_key = $1
  `, [sectionKey]);

  if (sectionResult.rows.length === 0) {
    return null;
  }

  const section = sectionResult.rows[0];

  const slidesResult = await pool.query(`
    SELECT * FROM landing_slides
    WHERE section_key = $1
    ORDER BY orden ASC
  `, [sectionKey]);

  const optionsResult = await pool.query(`
    SELECT * FROM landing_options
    WHERE section_key = $1
    ORDER BY orden ASC
  `, [sectionKey]);

  return {
    section,
    slides: slidesResult.rows,
    options: optionsResult.rows
  };
};

/**
 * Actualizar sección
 */
exports.updateSection = async (sectionKey, data) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  // Campos permitidos para actualizar
  const allowedFields = [
    'titulo', 'subtitulo', 'descripcion', 'texto_primario', 'texto_secundario',
    'color_primario', 'color_secundario', 'color_gradiente_inicio',
    'color_gradiente_medio', 'color_gradiente_fin', 'imagen_principal_url',
    'imagen_fondo_url', 'boton_texto', 'boton_color', 'boton_enlace',
    'configuracion_extra', 'activo'
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = $${paramCount}`);
      values.push(field === 'configuracion_extra' ? JSON.stringify(data[field]) : data[field]);
      paramCount++;
    }
  }

  if (fields.length === 0) {
    return this.getSectionByKey(sectionKey);
  }

  values.push(sectionKey);

  const result = await pool.query(`
    UPDATE landing_sections
    SET ${fields.join(', ')}
    WHERE section_key = $${paramCount}
    RETURNING *
  `, values);

  return result.rows[0];
};

// ============================================
// SLIDES
// ============================================

exports.getSlideById = async (id) => {
  const result = await pool.query(`
    SELECT * FROM landing_slides WHERE id = $1
  `, [id]);
  return result.rows[0];
};

exports.createSlide = async (data) => {
  const result = await pool.query(`
    INSERT INTO landing_slides (section_key, tipo, titulo, descripcion, imagen_url, orden)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [data.section_key, data.tipo, data.titulo, data.descripcion, data.imagen_url, data.orden]);
  return result.rows[0];
};

exports.updateSlide = async (id, data) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  const allowedFields = ['titulo', 'descripcion', 'imagen_url', 'orden', 'activo'];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = $${paramCount}`);
      values.push(data[field]);
      paramCount++;
    }
  }

  if (fields.length === 0) return null;

  values.push(id);

  const result = await pool.query(`
    UPDATE landing_slides
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `, values);

  return result.rows[0];
};

exports.deleteSlide = async (id) => {
  const result = await pool.query(`
    DELETE FROM landing_slides WHERE id = $1 RETURNING *
  `, [id]);
  return result.rows[0];
};

exports.getNextSlideOrder = async (sectionKey) => {
  const result = await pool.query(`
    SELECT COALESCE(MAX(orden), 0) + 1 as next_order
    FROM landing_slides WHERE section_key = $1
  `, [sectionKey]);
  return result.rows[0].next_order;
};

exports.reorderSlides = async (sectionKey, slideIds) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (let i = 0; i < slideIds.length; i++) {
      await client.query(`
        UPDATE landing_slides SET orden = $1
        WHERE id = $2 AND section_key = $3
      `, [i + 1, slideIds[i], sectionKey]);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// ============================================
// OPTIONS
// ============================================

exports.createOption = async (data) => {
  const result = await pool.query(`
    INSERT INTO landing_options (section_key, texto, orden)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [data.section_key, data.texto, data.orden]);
  return result.rows[0];
};

exports.updateOption = async (id, data) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  const allowedFields = ['texto', 'orden', 'activo'];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = $${paramCount}`);
      values.push(data[field]);
      paramCount++;
    }
  }

  if (fields.length === 0) return null;

  values.push(id);

  const result = await pool.query(`
    UPDATE landing_options
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `, values);

  return result.rows[0];
};

exports.deleteOption = async (id) => {
  const result = await pool.query(`
    DELETE FROM landing_options WHERE id = $1 RETURNING *
  `, [id]);
  return result.rows[0];
};

exports.getNextOptionOrder = async (sectionKey) => {
  const result = await pool.query(`
    SELECT COALESCE(MAX(orden), 0) + 1 as next_order
    FROM landing_options WHERE section_key = $1
  `, [sectionKey]);
  return result.rows[0].next_order;
};

exports.reorderOptions = async (sectionKey, optionIds) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (let i = 0; i < optionIds.length; i++) {
      await client.query(`
        UPDATE landing_options SET orden = $1
        WHERE id = $2 AND section_key = $3
      `, [i + 1, optionIds[i], sectionKey]);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
```

---

## 5. Subida de Imágenes a S3

### 5.1 Configuración S3 (config/s3.js)

```javascript
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

module.exports = s3;
```

### 5.2 Servicio S3 (services/s3Service.js)

```javascript
const s3 = require('../config/s3');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'fotogifty';
const MAX_WIDTH = 2000;
const MAX_HEIGHT = 2000;

/**
 * Subir imagen a S3
 * @param {Object} file - Archivo de multer
 * @param {string} folder - Carpeta destino (ej: 'landing/hero/slides')
 * @returns {string} URL de la imagen
 */
exports.uploadImage = async (file, folder) => {
  try {
    // Procesar imagen con sharp (resize si es muy grande)
    let processedBuffer = file.buffer;

    const metadata = await sharp(file.buffer).metadata();

    if (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT) {
      processedBuffer = await sharp(file.buffer)
        .resize(MAX_WIDTH, MAX_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toBuffer();
    }

    // Generar nombre único
    const extension = file.originalname.split('.').pop();
    const filename = `${uuidv4()}.${extension}`;
    const key = `${folder}/${filename}`;

    // Subir a S3
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: processedBuffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };

    await s3.upload(params).promise();

    // Retornar URL pública
    return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Error al subir imagen a S3');
  }
};

/**
 * Eliminar imagen de S3
 * @param {string} url - URL completa de la imagen
 */
exports.deleteImage = async (url) => {
  try {
    // Extraer key de la URL
    const urlParts = url.split('.amazonaws.com/');
    if (urlParts.length < 2) return;

    const key = urlParts[1];

    await s3.deleteObject({
      Bucket: BUCKET_NAME,
      Key: key
    }).promise();
  } catch (error) {
    console.error('Error deleting from S3:', error);
    // No lanzar error - la eliminación es opcional
  }
};
```

### 5.3 Middleware Upload (middleware/upload.js)

```javascript
const multer = require('multer');

// Configuración de multer para memoria (buffer)
const storage = multer.memoryStorage();

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Use JPG, PNG o WebP'), false);
  }
};

// Límite de tamaño: 5MB
const limits = {
  fileSize: 5 * 1024 * 1024
};

exports.uploadMiddleware = multer({
  storage,
  fileFilter,
  limits
});
```

---

## 6. Autenticación y Autorización

### 6.1 Middleware Auth (middleware/auth.js)

```javascript
const jwt = require('jsonwebtoken');

/**
 * Verificar token JWT
 */
exports.authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación requerido'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token inválido o expirado'
    });
  }
};

/**
 * Solo permitir admins
 */
exports.adminOnly = (req, res, next) => {
  if (!req.user || !['admin', 'super_admin'].includes(req.user.tipo)) {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado. Se requiere rol de administrador'
    });
  }
  next();
};
```

---

## 7. Migración de Datos Iniciales

### 7.1 Script de Seed (migrations/002_seed_landing_data.sql)

```sql
-- ===========================================
-- DATOS INICIALES PARA landing_sections
-- ===========================================

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

-- Product Slider Section
INSERT INTO landing_sections (section_key, texto_primario, texto_secundario, color_primario, configuracion_extra, orden, activo)
VALUES (
  'product_slider',
  'papel lustre profesional',
  ', que realza los colores y los detalles con un acabado elegante y duradero.',
  '#E04F8B',
  '{"autoplay": true, "autoplaySpeed": 3000, "transitionSpeed": 500, "infinite": true}',
  3,
  true
);

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
INSERT INTO landing_sections (section_key, titulo, subtitulo, descripcion, color_secundario, orden, activo)
VALUES (
  'calendars',
  'Calendarios',
  'Perfectas para enmarcar, regalar o conservar en álbumes.',
  'Nuestras photo prints transforman tus recuerdos digitales en piezas tangibles que perduran en el tiempo.',
  '#F5A524',
  5,
  true
);

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
INSERT INTO landing_sections (section_key, titulo, subtitulo, descripcion, imagen_principal_url, color_primario, orden, activo)
VALUES (
  'prints',
  'Prints',
  'Perfectas para enmarcar, regalar o conservar en álbumes.',
  'Nuestras photo prints transforman tus recuerdos digitales en piezas tangibles que perduran en el tiempo.',
  '/slide1.jpg',
  '#E04F8B',
  7,
  true
);

-- Polaroids Banner Section
INSERT INTO landing_sections (section_key, texto_primario, texto_secundario, color_primario, orden, activo)
VALUES (
  'polaroids_banner',
  'papel lustre profesional',
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

-- Platform Showcase Section
INSERT INTO landing_sections (section_key, texto_primario, texto_secundario, imagen_principal_url, imagen_fondo_url, color_primario, color_gradiente_inicio, color_gradiente_medio, color_gradiente_fin, orden, activo)
VALUES (
  'platform_showcase',
  'Edita, envía y recibe tu pedido.',
  'Todo desde la comodidad de tu casa.',
  '/MainUser.png',
  '/MainUser.png',
  '#E04F8B',
  '#0891B2B3',
  '#FCD34DB3',
  '#EC4899B3',
  11,
  true
);

-- ===========================================
-- DATOS INICIALES PARA landing_slides
-- ===========================================

-- Hero Slides
INSERT INTO landing_slides (section_key, tipo, imagen_url, orden, activo) VALUES
  ('hero', 'hero_slide', '/slide1.jpg', 1, true),
  ('hero', 'hero_slide', '/slide2.jpg', 2, true),
  ('hero', 'hero_slide', '/slide3.jpg', 3, true),
  ('hero', 'hero_slide', '/slide4.jpg', 4, true);

-- Product Slider Slides
INSERT INTO landing_slides (section_key, tipo, titulo, descripcion, imagen_url, orden, activo) VALUES
  ('product_slider', 'product_slide', 'Pack 50 5x7', 'Impresas en papel lustre profesional con revelado tradicional.', '/product-slider/slide1.jpg', 1, true),
  ('product_slider', 'product_slide', 'Pack 50 5x7', 'Impresas en papel lustre profesional con revelado tradicional.', '/product-slider/slide1.jpg', 2, true),
  ('product_slider', 'product_slide', 'Pack 50 5x7', 'Impresas en papel lustre profesional con revelado tradicional.', '/product-slider/slide1.jpg', 3, true),
  ('product_slider', 'product_slide', 'Pack 50 5x7', 'Impresas en papel lustre profesional con revelado tradicional.', '/product-slider/slide1.jpg', 4, true);

-- Calendars Collage Images
INSERT INTO landing_slides (section_key, tipo, imagen_url, orden, activo) VALUES
  ('calendars', 'collage_image', '/slide3.jpg', 1, true),
  ('calendars', 'collage_image', '/slide3.jpg', 2, true),
  ('calendars', 'collage_image', '/slide3.jpg', 3, true),
  ('calendars', 'collage_image', '/slide3.jpg', 4, true);

-- Polaroids Collage Images
INSERT INTO landing_slides (section_key, tipo, imagen_url, orden, activo) VALUES
  ('polaroids_collage', 'collage_image', '/slide3.jpg', 1, true),
  ('polaroids_collage', 'collage_image', '/slide3.jpg', 2, true),
  ('polaroids_collage', 'collage_image', '/slide3.jpg', 3, true),
  ('polaroids_collage', 'collage_image', '/slide3.jpg', 4, true);

-- ===========================================
-- DATOS INICIALES PARA landing_options
-- ===========================================

-- Extensions Options
INSERT INTO landing_options (section_key, texto, orden, activo) VALUES
  ('extensions', 'Pack 50 Prints 4x6', 1, true),
  ('extensions', 'Pack 50 Prints 5x7', 2, true),
  ('extensions', 'Pack 100 Prints 4x6', 3, true);

-- Calendars Options
INSERT INTO landing_options (section_key, texto, orden, activo) VALUES
  ('calendars', 'Calendario 12 meses', 1, true),
  ('calendars', 'Calendario personalizado', 2, true),
  ('calendars', 'Calendario familiar', 3, true);

-- Prints Options
INSERT INTO landing_options (section_key, texto, orden, activo) VALUES
  ('prints', 'Pack 50 Prints 4x6', 1, true),
  ('prints', 'Pack 100 Prints 4x6', 2, true),
  ('prints', 'Pack 50 Prints 5x7', 3, true);

-- Polaroids Collage Options
INSERT INTO landing_options (section_key, texto, orden, activo) VALUES
  ('polaroids_collage', 'Pack 50 Polaroids', 1, true),
  ('polaroids_collage', 'Pack 100 Polaroids', 2, true),
  ('polaroids_collage', 'Pack 25 Polaroids', 3, true);
```

---

## 8. Testing

### 8.1 Pruebas con cURL

```bash
# Obtener todas las secciones
curl http://localhost:3001/api/landing-content/sections

# Obtener sección específica
curl http://localhost:3001/api/landing-content/sections/hero

# Actualizar sección (requiere auth)
curl -X PUT http://localhost:3001/api/landing-content/sections/hero \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"titulo": "Nuevo Título", "boton_color": "#FF0000"}'

# Toggle sección
curl -X PATCH http://localhost:3001/api/landing-content/sections/hero/toggle \
  -H "Authorization: Bearer <TOKEN>"

# Crear slide
curl -X POST http://localhost:3001/api/landing-content/slides \
  -H "Authorization: Bearer <TOKEN>" \
  -F "section_key=hero" \
  -F "tipo=hero_slide" \
  -F "imagen=@/path/to/image.jpg"

# Reordenar slides
curl -X PUT http://localhost:3001/api/landing-content/slides/reorder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"section_key": "hero", "slide_ids": [3, 1, 4, 2]}'
```

---

## 9. Conexión con el Frontend

### 9.1 Variables de Entorno del Backend

```env
# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/fotogifty

# JWT
JWT_SECRET=tu_secreto_super_seguro

# AWS S3
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=fotogifty

# Server
PORT=3001
```

### 9.2 Registrar Rutas en Express

```javascript
// app.js o index.js
const express = require('express');
const cors = require('cors');
const landingContentRoutes = require('./routes/landingContentRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/landing-content', landingContentRoutes);

// Otras rutas existentes...
app.use('/api/paquetes', paquetesRoutes);
app.use('/api/categorias', categoriasRoutes);
// etc.

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
```

### 9.3 Activar API Real en Frontend

Cuando el backend esté listo, cambiar en `src/services/landing-content.ts`:

```typescript
// Cambiar de:
const USE_MOCK_DATA = true;

// A:
const USE_MOCK_DATA = false;
```

---

## Resumen de Endpoints

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/landing-content/sections` | Obtener todas las secciones | No |
| GET | `/api/landing-content/sections/:key` | Obtener sección específica | No |
| PUT | `/api/landing-content/sections/:key` | Actualizar sección | Admin |
| PATCH | `/api/landing-content/sections/:key/toggle` | Toggle activo | Admin |
| POST | `/api/landing-content/slides` | Crear slide | Admin |
| PUT | `/api/landing-content/slides/:id` | Actualizar slide | Admin |
| DELETE | `/api/landing-content/slides/:id` | Eliminar slide | Admin |
| PUT | `/api/landing-content/slides/reorder` | Reordenar slides | Admin |
| POST | `/api/landing-content/options` | Crear opción | Admin |
| PUT | `/api/landing-content/options/:id` | Actualizar opción | Admin |
| DELETE | `/api/landing-content/options/:id` | Eliminar opción | Admin |
| PUT | `/api/landing-content/options/reorder` | Reordenar opciones | Admin |
| POST | `/api/landing-content/upload` | Subir imagen | Admin |

---

## Checklist de Implementación

- [ ] Crear tablas en la base de datos
- [ ] Ejecutar script de seed con datos iniciales
- [ ] Implementar servicio de base de datos
- [ ] Implementar controlador
- [ ] Configurar S3 y servicio de upload
- [ ] Configurar middleware de autenticación
- [ ] Registrar rutas en Express
- [ ] Probar endpoints con cURL
- [ ] Activar `USE_MOCK_DATA = false` en frontend
- [ ] Probar integración completa
