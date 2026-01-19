# Guía de Diagnóstico - Sistema de Documentos Legales

## ✅ Estado de los Endpoints (Verificado)

### Endpoint Público
```bash
GET /api/legal-documents/active/terms
GET /api/legal-documents/active/privacy
```

**Respuesta actual del backend**:
```json
{
  "success": false,
  "message": "No se encontró un documento activo de tipo terms"
}
```

✅ **Funcionando correctamente** - El endpoint responde, solo no hay documentos creados.

### Endpoints Protegidos (Requieren Admin Token)
```bash
GET    /api/legal-documents           # Listar todos
POST   /api/legal-documents           # Crear
PUT    /api/legal-documents/:id       # Actualizar
DELETE /api/legal-documents/:id       # Eliminar
POST   /api/legal-documents/:id/activate  # Activar (cambió a POST)
```

✅ **Protección funcionando** - Requiere autenticación de admin.

---

## 🔍 Diagnóstico del Problema

El "error de respuesta de la API" que estás viendo es porque **NO hay documentos legales creados en la base de datos**.

### Solución: Crear Documentos Legales

#### Opción 1: Desde el Panel de Admin (Recomendado)

1. **Inicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

2. **Accede al panel de admin**:
   - Ir a: `http://localhost:3000/admin/login`
   - Iniciar sesión con credenciales de admin

3. **Navega a Documentos Legales**:
   - Ir a: `http://localhost:3000/admin/legal-documents`
   - O hacer clic en "Documentos Legales" en el navbar de admin

4. **Crear documento de Términos**:
   - Clic en "Nuevo Documento"
   - Tipo: `Términos y Condiciones`
   - Título: `Términos y Condiciones de Uso`
   - Versión: `1.0.0`
   - Contenido (HTML):
     ```html
     <h1>Términos y Condiciones</h1>
     <p>Este es un documento de prueba.</p>
     <h2>1. Aceptación de los términos</h2>
     <p>Al usar nuestro servicio, aceptas estos términos...</p>
     ```
   - Marcar: ✅ Activar documento inmediatamente
   - Guardar

5. **Crear documento de Privacidad**:
   - Repetir el proceso con tipo `Aviso de Privacidad`

#### Opción 2: Usando cURL (Requiere Admin Token)

Primero, obtén tu token de admin desde el localStorage después de hacer login en el panel de admin:

```javascript
// En la consola del navegador después de login
console.log(localStorage.getItem('auth_token'))
```

Luego crea el documento:

```bash
# Reemplaza YOUR_ADMIN_TOKEN con tu token real
curl -X POST "https://fotogifty-back-bun-production-2eb3.up.railway.app/api/legal-documents" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "terms",
    "titulo": "Términos y Condiciones de Uso",
    "contenido": "<h1>Términos y Condiciones</h1><p>Contenido...</p>",
    "version": "1.0.0",
    "activo": true
  }'
```

---

## 🧪 Verificar que Todo Funciona

### 1. Verificar Creación (Backend)

```bash
# Verificar que el documento activo existe
curl -X GET "https://fotogifty-back-bun-production-2eb3.up.railway.app/api/legal-documents/active/terms"
```

**Respuesta esperada**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "tipo": "terms",
    "titulo": "Términos y Condiciones de Uso",
    "contenido": "<h1>...",
    "version": "1.0.0",
    "activo": true,
    "fecha_creacion": "2026-01-18...",
    "fecha_actualizacion": "2026-01-18..."
  }
}
```

### 2. Verificar en el Frontend

1. **Páginas públicas**:
   - Ir a: `http://localhost:3000/terms`
   - Ir a: `http://localhost:3000/privacy`
   - Deberían mostrar los documentos (con HTML sanitizado)

2. **Signup**:
   - Ir a: `http://localhost:3000/signup`
   - Los links "términos y condiciones" y "aviso de privacidad" deberían funcionar
   - Al registrarse con checkbox marcado, envía `acepto_terminos: true`

3. **Panel Admin**:
   - Ir a: `http://localhost:3000/admin/legal-documents`
   - Ver listado de documentos
   - Probar editar, activar/desactivar, eliminar

---

## 📊 Flujo de Datos (Frontend ↔ Backend)

### Crear Documento

**Frontend envía** (inglés):
```json
{
  "type": "terms",
  "title": "Términos...",
  "content": "<h1>...",
  "version": "1.0",
  "isActive": true
}
```

**Mapper transforma a** (español):
```json
{
  "tipo": "terms",
  "titulo": "Términos...",
  "contenido": "<h1>...",
  "version": "1.0",
  "activo": true
}
```

**Backend responde** (español):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "tipo": "terms",
    "titulo": "Términos...",
    "contenido": "<h1>...",
    "version": "1.0",
    "activo": true,
    "fecha_creacion": "...",
    "fecha_actualizacion": "..."
  }
}
```

**Mapper transforma a** (inglés):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "type": "terms",
    "title": "Términos...",
    "content": "<h1>...",
    "version": "1.0",
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## ⚠️ Errores Comunes

### Error: "No se encontró un documento activo de tipo X"

**Causa**: No hay documentos creados en la BD o ninguno está activo.

**Solución**: Crear documentos desde el panel de admin y activarlos.

### Error: "Acceso denegado. No se proporcionó token de autenticación"

**Causa**: Intentando acceder a endpoints protegidos sin estar autenticado.

**Solución**:
- Hacer login en `/admin/login` primero
- El token se guarda automáticamente en localStorage
- El `apiClient` lo incluye automáticamente en las peticiones

### Error: "Conversion of type X to type Y may be a mistake"

**Causa**: Error de TypeScript en los mappers (ya resuelto).

**Solución**: Ya corregido con `as unknown as never[]` en el código.

---

## 🎯 Checklist de Verificación

- [ ] Backend de Railway está corriendo
- [ ] Variable `NEXT_PUBLIC_API_URL` configurada en `.env.local`
- [ ] Servidor de desarrollo Next.js corriendo (`npm run dev`)
- [ ] Login de admin exitoso en `/admin/login`
- [ ] Documentos legales creados desde `/admin/legal-documents`
- [ ] Al menos un documento de cada tipo activado
- [ ] Páginas `/terms` y `/privacy` muestran contenido
- [ ] Signup envía `acepto_terminos: true` al backend

---

## 🚀 Estado Actual

✅ **Endpoints funcionando correctamente**
✅ **Mappers implementados y funcionando**
✅ **Seguridad XSS implementada (DOMPurify)**
✅ **Navbar de admin actualizado**
✅ **Build exitoso sin errores**

⚠️ **Pendiente**: Crear documentos legales en la base de datos

---

## 📞 Soporte

Si después de crear los documentos sigues viendo errores, verifica:

1. **Consola del navegador** (F12 → Console):
   - Buscar errores de red
   - Verificar respuesta de la API

2. **Network tab** (F12 → Network):
   - Ver qué está enviando el frontend
   - Ver qué está respondiendo el backend

3. **Logs del servidor**:
   ```bash
   # En tu terminal donde corre npm run dev
   # Buscar errores de peticiones API
   ```

Si necesitas ayuda adicional, comparte:
- El error exacto que ves en la consola
- La respuesta de la API en el Network tab
- Los pasos que seguiste
