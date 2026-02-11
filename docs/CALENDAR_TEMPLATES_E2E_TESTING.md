# 🧪 CALENDAR TEMPLATES - END-TO-END TESTING GUIDE

## ✅ System Status

**Frontend:** ✅ Implemented and deployed
**Backend:** ✅ Implemented and deployed
**Ready for:** Production testing

---

## 🎯 Testing Objectives

This guide covers end-to-end testing of the 12-month calendar template upload system, from admin interface through editor rendering.

---

## 📋 Pre-Testing Checklist

### Backend Verification
- [ ] Database has `templates_calendario` field (Json type)
- [ ] Routes accept `template_mes_1` through `template_mes_12`
- [ ] S3 bucket has `templates/` folder with proper permissions
- [ ] Backend returns templates as parsed JSON object (not string)

### Frontend Verification
- [ ] Build passes: `npm run build`
- [ ] Dev server runs: `npm run dev`
- [ ] Admin can access `/admin/addItem`

### Test Assets Required
Prepare 12 PNG files for testing:
- **Dimensions:** All same size (e.g., 2400x3600px at 300 DPI)
- **Size:** Each under 10MB
- **Format:** PNG with transparency
- **Names:** enero.png, febrero.png, ..., diciembre.png (optional)

---

## 🧪 Test Scenarios

### **Test 1: Create Calendar Package with All 12 Templates**

**Objective:** Verify complete upload flow

**Steps:**
1. Navigate to `/admin/addItem`
2. Select category "Calendario" (or any calendar category)
3. Verify **purple badge** appears: "📝 Tipo de editor: **Calendario**"
4. Scroll to **"Templates de Calendario (12 Meses)"** section
5. Click each month grid item and upload PNG:
   - Enero (January)
   - Febrero (February)
   - ... (all 12 months)
6. Verify after each upload:
   - ✅ Green checkmark appears
   - Preview thumbnail shows
   - Counter updates: "Templates cargados: X/12"
   - Dimensions display correctly
7. After all 12 uploaded:
   - Status shows: "✅ Completo: Los 12 templates están listos"
   - Dimension fields (Ancho/Alto) are **hidden**
8. Fill other form fields:
   - Nombre: "Calendario 2026 Personalizado"
   - Descripción: "Prueba de 12 templates"
   - Cantidad de fotos: 12
   - Precio: 299.99
   - Resolución: 300 DPI
9. Click "Crear paquete"
10. Wait for success message

**Expected Results:**
- ✅ Success message: "Paquete creado exitosamente"
- ✅ Redirects to `/admin/itemcontrol`
- ✅ Package appears in list with correct data

**Backend Verification:**
```bash
# Check database (adjust for your DB tool)
SELECT id, nombre, templates_calendario FROM paquetes_predefinidos WHERE nombre LIKE '%2026%';
```

**Expected DB Data:**
```json
{
  "1": "https://fotogifty.s3.us-east-1.amazonaws.com/templates/calendario-mes1-*.png",
  "2": "https://fotogifty.s3.us-east-1.amazonaws.com/templates/calendario-mes2-*.png",
  ...
  "12": "https://fotogifty.s3.us-east-1.amazonaws.com/templates/calendario-mes12-*.png"
}
```

**S3 Verification:**
- Check S3 bucket `templates/` folder
- Should have 12 files: `calendario-mes1-*.png` through `calendario-mes12-*.png`

---

### **Test 2: Create Calendar Package with Partial Templates (6 months)**

**Objective:** Verify partial upload and fallback behavior

**Steps:**
1. Navigate to `/admin/addItem`
2. Select category "Calendario"
3. Upload only 6 templates (e.g., Enero through Junio)
4. Verify warning message:
   - "⚠️ Advertencia: Faltan 6 templates. Los meses sin template usarán los archivos por defecto del sistema."
5. Dimension fields should be **hidden** (even with partial upload)
6. Complete form and create package

**Expected Results:**
- ✅ Package created successfully
- ✅ Database has 6 URLs (mes 1-6)
- ✅ Missing months (7-12) not in JSON

**Editor Behavior:**
- Months 1-6: Use custom templates
- Months 7-12: Use default templates from `/public/calendarios2026/`

---

### **Test 3: Update Calendar Package - Add Missing Templates**

**Objective:** Verify update/merge behavior

**Steps:**
1. Navigate to `/admin/itemcontrol`
2. Find the package from Test 2 (partial templates)
3. Click "Edit"
4. Scroll to calendar template section
5. Verify existing 6 templates show with previews
6. Upload the missing 6 templates (Julio through Diciembre)
7. Verify counter goes from "6/12" to "12/12"
8. Save changes

**Expected Results:**
- ✅ Success message
- ✅ Database now has all 12 URLs
- ✅ Original 6 URLs preserved (not replaced)
- ✅ New 6 URLs added to JSON

**API Behavior Check:**
```javascript
// Before update
{
  "1": "url1", "2": "url2", ..., "6": "url6"
}

// After update
{
  "1": "url1", "2": "url2", ..., "6": "url6",  // Preserved
  "7": "url7", "8": "url8", ..., "12": "url12" // Added
}
```

---

### **Test 4: Update Calendar Package - Replace One Template**

**Objective:** Verify single template replacement

**Steps:**
1. Edit existing calendar package with all 12 templates
2. Remove template for "Mayo" (May, month 5)
3. Upload new PNG for Mayo
4. Save changes

**Expected Results:**
- ✅ Only month 5 URL updated
- ✅ Other 11 months unchanged
- ✅ New file uploaded to S3
- ✅ Old file remains in S3 (or deleted if cleanup implemented)

---

### **Test 5: Dimension Mismatch Validation**

**Objective:** Verify backend dimension validation

**Steps:**
1. Start creating new calendar package
2. Upload Enero: 2400x3600px
3. Try to upload Febrero: 3000x4000px (different dimensions!)

**Expected Results:**
- ❌ Error message from backend: "Template mes 2 dimensions (3000x4000) don't match mes 1 (2400x3600)"
- ❌ Upload rejected
- ✅ Counter stays at "1/12"
- ✅ User can try again with correct dimensions

---

### **Test 6: Invalid File Type Validation**

**Objective:** Verify PNG-only validation

**Steps:**
1. Start creating new calendar package
2. Try to upload JPG file for Enero

**Expected Results:**
- ❌ Error message: "Solo se permiten archivos PNG"
- ❌ Upload rejected (frontend validation)
- ✅ User can select correct PNG file

---

### **Test 7: File Size Validation**

**Objective:** Verify 10MB limit

**Steps:**
1. Prepare PNG file > 10MB (e.g., very high resolution)
2. Try to upload it for any month

**Expected Results:**
- ❌ Error message: "El archivo no debe superar 10MB"
- ❌ Upload rejected
- ✅ User can compress and retry

---

### **Test 8: Editor Integration - View Custom Templates**

**Objective:** Verify CalendarEditor loads custom templates

**Steps:**
1. Create calendar package with 12 templates (from Test 1)
2. As a customer, go to `/user` (product catalogue)
3. Find the calendar package
4. Click "Personalizar" or add to cart → open editor
5. In CalendarEditor, switch between months

**Expected Results:**
- ✅ All 12 months load custom templates (not default ones)
- ✅ Photo area dimensions match template
- ✅ User can drag/scale photo within template
- ✅ Preview shows template composite correctly

**Visual Verification:**
- Compare rendered template with original PNG
- Check for transparency preservation
- Verify no distortion or scaling issues

---

### **Test 9: Mixed Editor Types in Same Session**

**Objective:** Verify no conflicts between editor types

**Steps:**
1. Create Standard package (print) - no templates
2. Create Polaroid package - single template
3. Create Calendar package - 12 templates
4. Verify all three appear correctly in `/admin/itemcontrol`
5. Edit each one - verify correct interface shows

**Expected Results:**
- ✅ Standard: No template uploader, dimensions visible
- ✅ Polaroid: Single TemplateUploader
- ✅ Calendar: CalendarTemplateUploader with 12 slots

---

### **Test 10: Remove All Calendar Templates**

**Objective:** Verify bulk removal

**Steps:**
1. Edit calendar package with templates
2. Click "Eliminar todos" button
3. Verify all previews cleared
4. Counter shows "0/12"
5. Dimension fields become **visible**
6. Save changes

**Expected Results:**
- ✅ Database field `templates_calendario` becomes `null` or `{}`
- ✅ Package reverts to default calendar templates
- ✅ No orphaned files in S3 (or marked for cleanup)

---

## 🐛 Common Issues & Solutions

### Issue: "Templates cargados: 0/12" but files were uploaded
**Solution:**
- Check browser console for errors
- Verify FormData is sending files correctly
- Check backend logs for upload errors
- Ensure S3 credentials are valid

### Issue: Dimension validation fails incorrectly
**Solution:**
- Use exact same dimensions for all 12 templates
- Re-export all templates from same source file
- Verify DPI metadata is consistent

### Issue: Templates don't appear in editor
**Solution:**
- Check API response has `templates_calendario` as object, not string
- Verify S3 URLs are publicly accessible (or signed correctly)
- Check CORS settings on S3 bucket
- Verify CalendarEditor is loading templates from API

### Issue: Update overwrites existing templates instead of merging
**Solution:**
- Check backend merge logic in `actualizar-paquete.use-case.ts`
- Verify untouched months are preserved
- Test with Postman to isolate frontend vs backend issue

---

## 📊 Success Criteria

All tests should pass with these outcomes:

- ✅ 12 templates upload successfully
- ✅ Partial uploads work with fallback
- ✅ Updates merge correctly (preserve + add)
- ✅ Single template replacement works
- ✅ Dimension validation prevents mismatches
- ✅ File type validation enforced
- ✅ File size limit enforced
- ✅ Editor renders custom templates correctly
- ✅ No conflicts between editor types
- ✅ Bulk removal works cleanly

---

## 🚀 Production Readiness Checklist

Before deploying to production:

- [ ] All 10 test scenarios pass
- [ ] Backend logs show no errors during upload
- [ ] S3 storage costs reviewed (12 files per package)
- [ ] Database performance tested with multiple packages
- [ ] Frontend build size acceptable (CalendarTemplateUploader adds ~2KB)
- [ ] Mobile responsiveness verified (grid layout)
- [ ] Error messages are user-friendly in Spanish
- [ ] Documentation updated with any edge cases found
- [ ] Backup strategy for templates (S3 versioning enabled?)
- [ ] Monitoring/alerts configured for upload failures

---

## 📞 Support

If issues arise during testing:
1. Check browser console for frontend errors
2. Check backend logs for API/S3 errors
3. Review `CALENDAR_TEMPLATES_BACKEND_SPEC.md` for API details
4. Test with Postman/Thunder Client to isolate issue
5. Verify S3 bucket permissions and CORS

---

**Document Version:** 1.0.0
**Last Updated:** 2026-02-11
**Frontend Commit:** dd8047e
**Backend Status:** ✅ Implemented
