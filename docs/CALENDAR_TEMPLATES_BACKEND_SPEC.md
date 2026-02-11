# 📅 CALENDAR TEMPLATES - BACKEND SPECIFICATION

## ✅ STATUS: IMPLEMENTED

**All backend changes have been completed and deployed!** This document now serves as reference documentation for the implemented system.

## 🎯 Overview

This document specifies the backend implementation of the **12-Month Calendar Template System**. Unlike Polaroid templates (single file), calendar templates require **12 separate PNG files** (one per month).

---

## ✅ IMPLEMENTED CHANGES

### Backend Files Modified (7 files)

1. **`prisma/schema.prisma`**
   - ✅ Added `templates_calendario Json?` field to `paquetes_predefinidos` model

2. **`src/domain/entities/paquete.entity.ts`**
   - ✅ Added `templates_calendario?: Record<string, string>` to interface
   - ✅ Updated constructor and `static create()` method

3. **`src/infrastructure/repositories/prisma-paquete.repository.ts`**
   - ✅ Added JSON parsing in `toDomain()` with fallback
   - ✅ Added JSON stringification in `toPrisma()`

4. **`src/application/use-cases/crear-paquete.use-case.ts`**
   - ✅ Added `templates_calendario` parameter
   - ✅ Passed through to `PaqueteEntity.create()`

5. **`src/application/use-cases/actualizar-paquete.use-case.ts`**
   - ✅ Added `templates_calendario` parameter
   - ✅ Implemented merge logic (new months replace, untouched preserved)

6. **`src/infrastructure/controllers/paquete.controller.ts`**
   - ✅ Processing `template_mes_1` through `template_mes_12` in `crearPaquete()`
   - ✅ Processing `template_mes_1` through `template_mes_12` in `updatePaquete()`
   - ✅ PNG mimetype validation
   - ✅ Dimension extraction with sharp
   - ✅ First template sets `ancho_foto`/`alto_foto`
   - ✅ Subsequent templates validated against first (400 error on mismatch)
   - ✅ S3 upload with key: `templates/calendario-mes{N}-{timestamp}.png`

7. **`src/infrastructure/routes/paquete.routes.ts`**
   - ✅ Added `template_mes_1` through `template_mes_12` to `upload.fields()`
   - ✅ File size limit increased from 5MB to 10MB (both POST and PUT)

---

## 📊 DATABASE SCHEMA

### ✅ Implemented: JSON Field (Prisma)

The `paquetes_predefinidos` model now includes:

```prisma
model paquetes_predefinidos {
  // ... existing fields
  templates_calendario Json? // Store as JSON: {"1": "url1", "2": "url2", ..., "12": "url12"}
}
```

**Example data:**
```json
{
  "1": "https://fotogifty.s3.us-east-1.amazonaws.com/templates/calendario-enero-abc123.png",
  "2": "https://fotogifty.s3.us-east-1.amazonaws.com/templates/calendario-febrero-def456.png",
  ...
  "12": "https://fotogifty.s3.us-east-1.amazonaws.com/templates/calendario-diciembre-xyz789.png"
}
```

---

## 📤 API ENDPOINTS

### POST /api/paquetes (Create Package)

**Multipart Form Data:**

```typescript
FormData fields:
- imagen: File (optional) - Product preview image
- template: File (optional) - Polaroid template (single file)
- template_mes_1: File (optional) - Calendar template for January
- template_mes_2: File (optional) - Calendar template for February
- template_mes_3: File (optional) - Calendar template for March
- ...
- template_mes_12: File (optional) - Calendar template for December
- nombre: string
- categoria_id: number
- descripcion: string
- cantidad_fotos: number
- precio: number
- estado: boolean
- resolucion_foto: number
- ancho_foto: number
- alto_foto: number
```

**Backend Logic:**

1. **Detect template type:**
   - If `template` file exists → Polaroid (store in `template_url`)
   - If any `template_mes_X` files exist → Calendar (store in `templates_calendario`)

2. **For Calendar templates:**
   ```javascript
   const calendarTemplates = {};

   for (let mes = 1; mes <= 12; mes++) {
     const file = req.files[`template_mes_${mes}`];
     if (file) {
       // Validate PNG
       if (file.mimetype !== 'image/png') {
         return res.status(400).json({ error: `Template mes ${mes} must be PNG` });
       }

       // Extract dimensions with sharp
       const { width, height } = await sharp(file.buffer).metadata();

       // Verify dimensions match first template (optional but recommended)
       if (mes > 1 && firstTemplateDimensions) {
         if (width !== firstTemplateDimensions.width || height !== firstTemplateDimensions.height) {
           return res.status(400).json({
             error: `Template mes ${mes} dimensions (${width}x${height}) don't match mes 1 (${firstTemplateDimensions.width}x${firstTemplateDimensions.height})`
           });
         }
       }

       // Upload to S3
       const s3Key = `templates/calendario-${paqueteId}-mes${mes}-${Date.now()}.png`;
       await s3.upload({
         Bucket: 'fotogifty',
         Key: s3Key,
         Body: file.buffer,
         ContentType: 'image/png'
       });

       // Store URL
       calendarTemplates[mes] = `https://fotogifty.s3.us-east-1.amazonaws.com/${s3Key}`;

       if (mes === 1) {
         // Use first template for dimension calculation
         ancho_foto = width / resolucion_foto;
         alto_foto = height / resolucion_foto;
         firstTemplateDimensions = { width, height };
       }
     }
   }

   // Save as JSON
   paquete.templates_calendario = JSON.stringify(calendarTemplates);
   ```

3. **Save to database:**
   ```sql
   INSERT INTO paquetes_predefinidos (
     nombre, categoria_id, descripcion, cantidad_fotos, precio, estado,
     resolucion_foto, ancho_foto, alto_foto, imagen_url, template_url, templates_calendario
   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
   ```

---

### PUT /api/paquetes/:id (Update Package)

**Same logic as POST**, but:
- Merge new templates with existing ones
- If a specific `template_mes_X` is uploaded, replace only that month
- Keep existing months that aren't being updated

**Example:**
```javascript
// Load existing templates
const existingTemplates = JSON.parse(paquete.templates_calendario || '{}');

// Update with new files
for (let mes = 1; mes <= 12; mes++) {
  const file = req.files[`template_mes_${mes}`];
  if (file) {
    // Upload new file and update URL
    existingTemplates[mes] = newUrl;
  }
  // If no file for this month, keep existing URL
}

// Save merged result
paquete.templates_calendario = JSON.stringify(existingTemplates);
```

---

### GET /api/paquetes/:id (Get Package)

**Response format:**

```json
{
  "success": true,
  "data": {
    "id": 123,
    "nombre": "Calendario 2026",
    "categoria_id": 2,
    "categoria_nombre": "Calendario",
    "descripcion": "Calendario personalizado",
    "cantidad_fotos": 12,
    "precio": 299.99,
    "estado": true,
    "resolucion_foto": 300,
    "ancho_foto": 8.0,
    "alto_foto": 12.0,
    "imagen_url": "https://...",
    "template_url": null,
    "templates_calendario": {
      "1": "https://fotogifty.s3.us-east-1.amazonaws.com/templates/calendario-enero.png",
      "2": "https://fotogifty.s3.us-east-1.amazonaws.com/templates/calendario-febrero.png",
      ...
      "12": "https://fotogifty.s3.us-east-1.amazonaws.com/templates/calendario-diciembre.png"
    }
  }
}
```

**⚠️ Important:** Return `templates_calendario` as **parsed JSON object**, not as string.

---

## 🔍 VALIDATION RULES

### Required Validations

1. **File Type:**
   - Only PNG files allowed
   - Check MIME type: `image/png`

2. **File Size:**
   - Maximum 10MB per file
   - Frontend already validates, but backend should also check

3. **Dimension Consistency (Optional but Recommended):**
   - All 12 templates should have the same dimensions
   - Example: All must be 2400x3600px
   - If dimensions don't match, return error explaining which month is different

4. **Month Range:**
   - Only accept `template_mes_1` through `template_mes_12`
   - Ignore any other `template_mes_X` fields

### Optional Validations

5. **Complete Set (Optional):**
   - You can optionally require all 12 templates
   - Or allow partial uploads (missing months use defaults)
   - **Recommendation:** Allow partial uploads for flexibility

---

## 📦 S3 STORAGE STRUCTURE

```
fotogifty-bucket/
├── productos/                  # Product preview images
├── templates/                  # Template files
│   ├── polaroid-123.png       # Polaroid templates (single file)
│   ├── calendario-456-mes1-1234567890.png   # Calendar January
│   ├── calendario-456-mes2-1234567891.png   # Calendar February
│   ...
│   └── calendario-456-mes12-1234567901.png  # Calendar December
└── fotos/                      # User-uploaded photos
```

**Naming Convention:**
- Polaroid: `polaroid-{paqueteId}-{timestamp}.png`
- Calendar: `calendario-{paqueteId}-mes{1-12}-{timestamp}.png`

---

## 🧪 TESTING CHECKLIST

### Test Case 1: Create Calendar with All 12 Templates
- ✅ Upload 12 PNG files (one per month)
- ✅ All files uploaded to S3
- ✅ `templates_calendario` JSON contains 12 URLs
- ✅ Dimensions calculated from first template
- ✅ All templates have same dimensions

### Test Case 2: Create Calendar with Partial Templates
- ✅ Upload only 6 templates (e.g., mes 1-6)
- ✅ `templates_calendario` contains 6 URLs
- ✅ Missing months (7-12) not in JSON
- ✅ Frontend uses default templates for missing months

### Test Case 3: Update Calendar - Add Missing Templates
- ✅ Existing package has mes 1-6
- ✅ Update with mes 7-12
- ✅ Final `templates_calendario` has all 12 URLs
- ✅ Original mes 1-6 URLs preserved

### Test Case 4: Update Calendar - Replace One Template
- ✅ Existing package has all 12 templates
- ✅ Update only mes 5
- ✅ Mes 5 URL updated
- ✅ Other 11 months unchanged

### Test Case 5: Dimension Mismatch
- ✅ Upload mes 1: 2400x3600px
- ✅ Upload mes 2: 3000x4000px (different!)
- ✅ Backend returns 400 error
- ✅ Error message explains dimension mismatch

### Test Case 6: Invalid File Type
- ✅ Upload JPG instead of PNG
- ✅ Backend returns 400 error
- ✅ Error message: "Template mes X must be PNG"

### Test Case 7: Mix Polaroid and Calendar Templates
- ✅ Upload both `template` and `template_mes_1`
- ✅ Backend should reject or prioritize one
- ✅ **Recommendation:** Use category to determine which to accept

---

## 🚀 DEPLOYMENT NOTES

### Environment Variables
No new environment variables needed. Uses existing S3 configuration.

### Database Migration
Run migration to add `templates_calendario` column:

```sql
-- Production migration
ALTER TABLE paquetes_predefinidos
ADD COLUMN templates_calendario TEXT DEFAULT NULL;
```

### Backward Compatibility
- Existing packages without `templates_calendario` continue to work
- Frontend falls back to default templates
- `template_url` (Polaroid) remains separate field

---

## 📝 EXAMPLE API RESPONSES

### Polaroid Package (Old Behavior)
```json
{
  "id": 100,
  "template_url": "https://s3.../polaroid-template.png",
  "templates_calendario": null
}
```

### Calendar Package (New Behavior)
```json
{
  "id": 200,
  "template_url": null,
  "templates_calendario": {
    "1": "https://s3.../calendario-enero.png",
    "2": "https://s3.../calendario-febrero.png",
    ...
    "12": "https://s3.../calendario-diciembre.png"
  }
}
```

### Standard Package (No Templates)
```json
{
  "id": 300,
  "template_url": null,
  "templates_calendario": null
}
```

---

## ⚠️ IMPORTANT NOTES

1. **JSON Parsing:** Always parse `templates_calendario` from TEXT to JSON object before sending to frontend
2. **Null Handling:** Return `null` (not empty string) when no templates exist
3. **Dimension Source:** For calendar packages, calculate `ancho_foto` and `alto_foto` from the first uploaded template
4. **Fallback:** Missing months are handled by frontend using default templates
5. **S3 Cleanup:** Consider implementing cleanup for old templates when packages are updated

---

## 🆘 SUPPORT

For questions or issues:
1. Check frontend implementation: `src/components/admin/CalendarTemplateUploader.tsx`
2. Review FormData structure: `src/services/packages.ts` → `crearPaqueteConImagen()`
3. Test with Postman/Thunder Client using multipart/form-data
4. Check S3 upload logs for errors

---

**Document Version:** 1.0.0
**Last Updated:** 2026-02-11
**Frontend Implementation:** Commit dd8047e
