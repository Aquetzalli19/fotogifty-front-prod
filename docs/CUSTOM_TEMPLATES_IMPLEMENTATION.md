# 📋 CUSTOM TEMPLATES IMPLEMENTATION - COMPLETE GUIDE

## 🎯 Overview

This document describes the complete implementation of the **Custom PNG Template System** for FotoGifty, which allows administrators to upload custom templates instead of using hardcoded ones.

**⚠️ IMPORTANT RESTRICTION**: The template upload feature is **ONLY available for Polaroid and Calendar editors**. For Standard editors (prints/enlargements), administrators must manually specify canvas dimensions.

---

## 📌 EDITOR TYPE RESTRICTIONS

The template upload feature behaves differently based on the product category:

### **Standard Editor** (Prints/Enlargements)
- ❌ **NO template upload available**
- ✅ Dimension fields (width/height) are **always visible and required**
- 🎨 Used for: Print photos, enlargements, standard products
- 📐 Canvas size: Manually specified by admin

### **Calendar Editor**
- ✅ **Template upload available (optional)**
- 📁 If template uploaded: dimensions auto-calculated, fields hidden
- 📏 If NO template: uses default calendar templates, fields visible
- 🎨 Used for: Calendar products (12-month layouts)

### **Polaroid Editor**
- ✅ **Template upload available (optional)**
- 📁 If template uploaded: dimensions auto-calculated, fields hidden
- 📏 If NO template: uses default polaroid frame, fields visible
- 🎨 Used for: Polaroid-style prints with frames

### **Visual Indicator**
When creating a package, admins see a colored badge indicating the detected editor type:
- 🔵 **Blue**: Standard (Impresiones/Ampliaciones)
- 🟣 **Purple**: Calendar
- 🩷 **Pink**: Polaroid

---

## ✅ COMPLETED FEATURES

### **Phase 1: Admin Interface** (Commit: 251702e)
- ✅ Template uploader component with PNG validation
- ✅ Automatic dimension calculation from PNG resolution
- ✅ Hide width/height inputs when template is uploaded
- ✅ Backend integration for multi-file upload

### **Phase 2: Dynamic Editors** (Commit: cde8b77)
- ✅ PolaroidEditor loads templates dynamically from packages
- ✅ CalendarEditor loads templates dynamically from packages
- ✅ Canvas dimensions calculated from template
- ✅ Fallback to default templates if no custom template exists

---

## 🏗️ ARCHITECTURE

### Frontend Components

```
src/
├── components/admin/
│   └── TemplateUploader.tsx          # PNG upload with dimension calculation
├── components/editor-components/
│   ├── PolaroidEditor.tsx             # Modified for dynamic templates
│   └── CalendarEditor.tsx             # Modified for dynamic templates
├── services/
│   └── packages.ts                    # Added template_url to Paquete interface
├── interfaces/
│   └── admi-items.ts                  # Added template_url to itemPackages
└── lib/mappers/
    └── package-mapper.ts              # Maps template_url from API
```

### Backend Components (Already Implemented)

```
src/
├── domain/entities/
│   └── paquete.entity.ts              # Added template_url property
├── infrastructure/
│   ├── repositories/
│   │   └── prisma-paquete.repository.ts  # Maps template_url
│   ├── controllers/
│   │   └── paquete.controller.ts      # Handles template upload + dimension extraction
│   └── routes/
│       └── paquete.routes.ts          # upload.fields() for multiple files
├── application/use-cases/
│   ├── crear-paquete.use-case.ts      # Accepts template_url
│   └── actualizar-paquete.use-case.ts # Merges template_url
└── prisma/
    └── schema.prisma                  # Added template_url field
```

---

## 📊 DATABASE SCHEMA

### Table: `paquetes_predefinidos`

```sql
CREATE TABLE paquetes_predefinidos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  categoria_id INT NOT NULL,
  descripcion TEXT,
  cantidad_fotos INT NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  estado BOOLEAN DEFAULT TRUE,
  resolucion_foto INT NOT NULL,      -- DPI (e.g., 300)
  ancho_foto DECIMAL(10,2) NOT NULL, -- Width in inches (e.g., 4.00)
  alto_foto DECIMAL(10,2) NOT NULL,  -- Height in inches (e.g., 6.00)
  imagen_url VARCHAR(500),           -- Product preview image
  template_url VARCHAR(500),         -- 🆕 Custom PNG template
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🔄 DATA FLOW

### 1. Admin Creates Package with Custom Template

```
┌─────────────────┐
│  Admin UI       │
│  addItem/page   │
└────────┬────────┘
         │ 1. Selects PNG file
         │
         ▼
┌─────────────────┐
│ TemplateUploader│
│  Component      │
└────────┬────────┘
         │ 2. Validates PNG
         │ 3. Calculates dimensions
         │    width = pixels / DPI
         │
         ▼
┌─────────────────┐
│  Backend API    │
│ POST /paquetes  │
└────────┬────────┘
         │ 4. Validates PNG (MIME)
         │ 5. Extracts dimensions with sharp
         │ 6. Uploads to S3 (templates/)
         │ 7. Saves template_url to DB
         │
         ▼
┌─────────────────┐
│   Database      │
│ template_url    │
│ ancho_foto      │
│ alto_foto       │
└─────────────────┘
```

### 2. User Opens Editor with Custom Template

```
┌─────────────────┐
│  User selects   │
│  package        │
└────────┬────────┘
         │ packageId in URL params
         │
         ▼
┌─────────────────┐
│ PolaroidEditor  │
│ CalendarEditor  │
└────────┬────────┘
         │ useEffect(() => {
         │   loadPackage(packageId)
         │ })
         │
         ▼
┌─────────────────┐
│  Backend API    │
│ GET /paquetes/:id
└────────┬────────┘
         │ Returns:
         │ - template_url
         │ - ancho_foto (inches)
         │ - alto_foto (inches)
         │ - resolucion_foto (DPI)
         │
         ▼
┌─────────────────┐
│  Editor State   │
│ templateUrl     │
│ POLAROID_WIDTH  │
│ POLAROID_HEIGHT │
└────────┬────────┘
         │ Calculates:
         │ width_px = inches × DPI
         │ height_px = inches × DPI
         │
         ▼
┌─────────────────┐
│  Canvas Render  │
│ Correct size!   │
└─────────────────┘
```

---

## 💻 CODE EXAMPLES

### TemplateUploader Component

```tsx
<TemplateUploader
  value={templateUrl}
  onChange={(url, dimensions) => {
    setTemplateUrl(url);
    setHasTemplate(url !== '');
    // Auto-fill form fields
    form.setValue('photoWidth', dimensions.width);
    form.setValue('photoHeight', dimensions.height);
  }}
  resolution={300} // DPI
/>
```

### PolaroidEditor - Dynamic Loading

```tsx
// Load package template
useEffect(() => {
  const loadPackageTemplate = async () => {
    const response = await obtenerPaquetePorId(parseInt(packageId));
    if (response.success && response.data?.template_url) {
      setTemplateUrl(response.data.template_url);

      // Calculate pixel dimensions
      const widthPx = Math.round(
        response.data.ancho_foto * response.data.resolucion_foto
      );
      const heightPx = Math.round(
        response.data.alto_foto * response.data.resolucion_foto
      );

      setPolaroidWidth(widthPx);
      setPolaroidHeight(heightPx);
    }
  };
  loadPackageTemplate();
}, [packageId]);
```

### CalendarEditor - Dynamic Loading

```tsx
// Override month templates if custom template exists
useEffect(() => {
  const loadPackageTemplate = async () => {
    const response = await obtenerPaquetePorId(parseInt(packageId));
    if (response.success && response.data?.template_url) {
      const templates: Record<number, string> = {};
      for (let i = 1; i <= 12; i++) {
        templates[i] = response.data.template_url;
      }
      setMonthCalendarFiles(templates);
    }
  };
  loadPackageTemplate();
}, [packageId]);
```

---

## 🧪 TESTING GUIDE

### Test Case 0: Editor Type Detection
**Expected:** Correct editor type detected and appropriate UI shown
1. Go to `/admin/addItem`
2. Select category "Impresiones" → Should show blue badge "Estándar"
3. Template uploader should be HIDDEN
4. Dimension fields should be VISIBLE
5. Select category "Calendario" → Should show purple badge "Calendario"
6. Template uploader should be VISIBLE
7. Select category "Polaroid" → Should show pink badge "Polaroid"
8. Template uploader should be VISIBLE

### Test Case 1: Create Package Without Template
**Expected:** Uses default hardcoded templates
1. Go to `/admin/addItem`
2. Fill form WITHOUT uploading template
3. Save package
4. Open editor → Should use `/polaroid/Polaroid.png`

### Test Case 2: Create Package With Custom Template
**Expected:** Uses uploaded template with correct dimensions
1. Go to `/admin/addItem`
2. Upload PNG template (e.g., 2400x3600px)
3. Verify dimensions auto-calculate (8x12 inches @ 300 DPI)
4. Save package
5. Open editor → Should use custom template
6. Canvas should be 2400x3600px

### Test Case 3: Edit Existing Package Template
**Expected:** Can update template, old data preserved
1. Go to `/admin/itemcontrol`
2. Edit existing package
3. Upload new template
4. Save
5. Verify new template loads in editor

### Test Case 4: Backward Compatibility
**Expected:** Old packages still work
1. Open editor with old packageId (no template_url)
2. Should fallback to default template
3. No errors in console

### Test Case 5: Calendar Multi-Month
**Expected:** Same template for all 12 months
1. Create calendar package with custom template
2. Open calendar editor
3. Switch between months
4. All months should use same custom template

### Test Case 6: Standard Editor (No Template Feature)
**Expected:** Template uploader never appears for standard products
1. Go to `/admin/addItem`
2. Select category "Impresiones" or "Ampliaciones"
3. Verify blue badge shows "Estándar (Impresiones/Ampliaciones)"
4. Template uploader should NOT be visible
5. Width and height fields should ALWAYS be visible
6. Fill in dimensions manually (e.g., 4x6 inches)
7. Save package
8. Verify package works with standard editor

---

## 🔧 CONFIGURATION

### Supported Template Formats
- **Format:** PNG only (for transparency support)
- **Max Size:** 10MB
- **Recommended DPI:** 300
- **Recommended Dimensions:**
  - Polaroid: 1200x1800px (4x6 inches)
  - Calendar: 2400x3600px (8x12 inches)

### S3 Storage Structure
```
fotogifty-bucket/
├── productos/          # Product preview images
└── templates/          # Custom PNG templates
    ├── template-1.png
    ├── template-2.png
    └── ...
```

### Environment Variables
```env
# No additional env vars needed
# Uses existing S3 configuration
```

---

## 🐛 TROUBLESHOOTING

### Issue: Template not loading in editor
**Solution:** Check browser console for:
- 404 errors → template_url might be invalid
- CORS errors → S3 bucket CORS misconfigured
- TypeErrors → packageId missing from URL params

### Issue: Dimensions incorrect
**Solution:**
- Verify DPI in package settings (should be 300)
- Check calculation: `pixels = inches × DPI`
- Ensure template PNG has correct pixel dimensions

### Issue: Fallback template not loading
**Solution:**
- Verify `/polaroid/Polaroid.png` exists in `/public`
- Check `/calendarios2026/` folder exists
- Ensure default templates are not deleted

### Issue: Template uploader not showing
**Solution:**
- Check the selected category name
- Only "Calendario", "Calendar", and "Polaroid" categories show the uploader
- For "Impresiones", "Ampliaciones", or other categories: template feature is disabled by design
- Verify category name matches pattern in `getEditorType()` function

### Issue: Dimension fields not visible for Standard editor
**Solution:**
- This is correct behavior - dimensions should ALWAYS be visible for Standard editor
- If they're hidden, check that editorType is correctly detected
- Verify the conditional logic: `(editorType === 'standard' || !hasTemplate)`

---

## 📈 FUTURE ENHANCEMENTS

### Potential Improvements
- [ ] Multiple templates per package (e.g., different per month)
- [ ] Template preview in package list
- [ ] Template library/gallery for reuse
- [ ] Template versioning
- [ ] Crop/resize tool in uploader
- [ ] Template validation (photo area detection)

---

## 👥 TEAM COLLABORATION

### Frontend Responsibilities
- Component development ✅
- UI/UX for template upload ✅
- Editor adaptation ✅
- Testing

### Backend Responsibilities
- Database migration ✅
- S3 upload handling ✅
- Dimension extraction with sharp ✅
- API endpoint updates ✅

---

## 📝 CHANGELOG

### Version 1.2.0 (Current - 2026-02-11)
- ✅ **CRITICAL FIX**: Changed from base64 data URLs to actual S3 file upload
- ✅ **FEATURE**: Template uploader now conditional based on editor type
- ✅ Visual indicator for detected editor type (color-coded badges)
- ✅ Restricted template feature to Polaroid and Calendar only
- ✅ Standard editor always shows dimension fields (no template support)

### Version 1.1.0 (2026-02-11)
- ✅ Fixed template upload to use File objects instead of base64
- ✅ Added proper FormData multi-file upload (imagen + template)
- ✅ Backend integration verified and working

### Version 1.0.0 (Initial Release)
- ✅ Initial implementation of custom template system
- ✅ PNG upload with validation
- ✅ Automatic dimension calculation
- ✅ Dynamic editor loading
- ✅ Backward compatibility maintained

---

## 📞 SUPPORT

For questions or issues:
1. Check this documentation first
2. Review commit messages: 251702e (Phase 1), cde8b77 (Phase 2)
3. Check browser console for errors
4. Verify backend logs for S3 upload issues

---

**Document Version:** 1.0.0
**Last Updated:** 2026-02-11
**Implemented By:** Claude Sonnet 4.5 + Team
