# Guía de Pruebas - Sistema de Recuperación de Contraseña

## Pre-requisitos

- ✅ Backend corriendo en `http://localhost:3001` (o Railway)
- ✅ Frontend corriendo en `http://localhost:3000`
- ✅ Variable de entorno `NEXT_PUBLIC_API_URL` configurada en `.env.local`
- ✅ Al menos un usuario registrado en la base de datos

---

## 1. Pruebas del Backend (API Directa)

### 1.1. Crear un Usuario de Prueba

Si no tienes un usuario, créalo primero:

```bash
curl -X POST "http://localhost:3001/api/usuarios" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan.perez@ejemplo.com",
    "telefono": "5512345678",
    "password": "password123",
    "acepto_terminos": true
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan.perez@ejemplo.com",
    "telefono": "5512345678"
  }
}
```

### 1.2. Probar Verificación de Identidad

**Caso 1: Datos Correctos** ✅

```bash
curl -X POST "http://localhost:3001/api/auth/verificar-identidad" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan.perez@ejemplo.com",
    "telefono": "5512345678"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Identidad verificada correctamente"
}
```

**Caso 2: Email Incorrecto** ❌

```bash
curl -X POST "http://localhost:3001/api/auth/verificar-identidad" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "noexiste@ejemplo.com",
    "telefono": "5512345678"
  }'
```

**Respuesta esperada:**
```json
{
  "success": false,
  "message": "Los datos no coinciden con nuestros registros"
}
```

**Caso 3: Teléfono Incorrecto** ❌

```bash
curl -X POST "http://localhost:3001/api/auth/verificar-identidad" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan.perez@ejemplo.com",
    "telefono": "0000000000"
  }'
```

**Respuesta esperada:**
```json
{
  "success": false,
  "message": "Los datos no coinciden con nuestros registros"
}
```

**Caso 4: Email Inválido** ❌

```bash
curl -X POST "http://localhost:3001/api/auth/verificar-identidad" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "email-invalido",
    "telefono": "5512345678"
  }'
```

**Respuesta esperada:**
```json
{
  "success": false,
  "message": "Email inválido"
}
```

**Caso 5: Teléfono Inválido (letras)** ❌

```bash
curl -X POST "http://localhost:3001/api/auth/verificar-identidad" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan.perez@ejemplo.com",
    "telefono": "55-1234-5678"
  }'
```

**Respuesta esperada:**
```json
{
  "success": false,
  "message": "Teléfono inválido"
}
```

### 1.3. Probar Recuperación de Contraseña

**Caso 1: Cambio Exitoso** ✅

```bash
curl -X POST "http://localhost:3001/api/auth/recuperar-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan.perez@ejemplo.com",
    "telefono": "5512345678",
    "nueva_password": "nuevaPassword456"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Contraseña cambiada exitosamente"
}
```

**Caso 2: Datos Incorrectos** ❌

```bash
curl -X POST "http://localhost:3001/api/auth/recuperar-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan.perez@ejemplo.com",
    "telefono": "0000000000",
    "nueva_password": "nuevaPassword456"
  }'
```

**Respuesta esperada:**
```json
{
  "success": false,
  "message": "Los datos no coinciden con nuestros registros"
}
```

**Caso 3: Contraseña Muy Corta** ❌

```bash
curl -X POST "http://localhost:3001/api/auth/recuperar-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan.perez@ejemplo.com",
    "telefono": "5512345678",
    "nueva_password": "123"
  }'
```

**Respuesta esperada:**
```json
{
  "success": false,
  "message": "La contraseña debe tener al menos 6 caracteres"
}
```

### 1.4. Verificar Login con Nueva Contraseña

```bash
curl -X POST "http://localhost:3001/api/auth/login/cliente" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan.perez@ejemplo.com",
    "password": "nuevaPassword456"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "juan.perez@ejemplo.com",
      "nombre": "Juan",
      "apellido": "Pérez"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

✅ **Si el login funciona, la contraseña fue cambiada exitosamente**

---

## 2. Pruebas del Frontend (Flujo Completo)

### 2.1. Preparación

1. Asegurar que ambos servidores estén corriendo:
   ```bash
   # Terminal 1 - Backend
   cd fotogifty-back-bun
   bun run dev

   # Terminal 2 - Frontend
   cd fotogifty-front-clean-nath-dev
   npm run dev
   ```

2. Verificar `.env.local` del frontend:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

### 2.2. Flujo de Recuperación Completo

**Paso 1: Navegar al Login**
1. Abrir navegador en `http://localhost:3000/login`
2. Verificar que aparece el enlace "¿Olvidaste tu contraseña?"

**Paso 2: Iniciar Recuperación**
1. Clic en "¿Olvidaste tu contraseña?"
2. Verificar redirección a `/forgot-password`
3. Verificar que aparece:
   - Título: "Recuperar Contraseña"
   - Texto: "Ingresa tu correo y teléfono registrados para verificar tu identidad"
   - Indicador de progreso (paso 1 de 2)

**Paso 3: Verificar Identidad (Paso 1)**

**Caso Exitoso:**
1. Ingresar email: `juan.perez@ejemplo.com`
2. Ingresar teléfono: `5512345678`
3. Clic en "Verificar Identidad"
4. **Verificar**:
   - Toast verde: "Identidad verificada correctamente"
   - Avanza automáticamente al paso 2
   - Indicador de progreso muestra paso completado (✓)

**Casos de Error:**
1. Email incorrecto:
   - Ingresar: `noexiste@ejemplo.com`
   - **Verificar**: Toast rojo con "Los datos no coinciden con nuestros registros"
2. Teléfono incorrecto:
   - Ingresar: `0000000000`
   - **Verificar**: Toast rojo con mensaje de error
3. Email inválido:
   - Ingresar: `email-sin-arroba`
   - **Verificar**: Error de validación debajo del campo

**Paso 4: Cambiar Contraseña (Paso 2)**

**Verificar que aparece:**
- Título: "Recuperar Contraseña"
- Texto: "Ingresa tu nueva contraseña"
- Email y teléfono mostrados (solo lectura)
- Campos para nueva contraseña y confirmación
- Botones "Atrás" y "Cambiar Contraseña"

**Caso Exitoso:**
1. Ingresar nueva contraseña: `nuevaPassword789`
2. Confirmar contraseña: `nuevaPassword789`
3. Clic en "Cambiar Contraseña"
4. **Verificar**:
   - Toast verde: "¡Contraseña cambiada exitosamente! Redirigiendo al login..."
   - Redirección automática a `/login` después de 2 segundos

**Casos de Error:**
1. Contraseñas no coinciden:
   - Nueva: `password123`
   - Confirmar: `password456`
   - **Verificar**: Error de validación "Las contraseñas no coinciden"
2. Contraseña muy corta:
   - Nueva: `123`
   - **Verificar**: Error "La contraseña debe tener al menos 8 caracteres"

**Paso 5: Botón "Atrás"**
1. Desde el paso 2, clic en "Atrás"
2. **Verificar**:
   - Regresa al paso 1
   - Formulario se resetea
   - Indicador de progreso vuelve al paso 1

**Paso 6: Login con Nueva Contraseña**
1. En `/login`, ingresar:
   - Email: `juan.perez@ejemplo.com`
   - Contraseña: `nuevaPassword789` (la nueva)
2. Clic en "Inicia sesión"
3. **Verificar**:
   - Toast verde: "Inicio de sesión exitoso"
   - Redirección a `/user`
   - Usuario logueado correctamente

---

## 3. Pruebas de Consola del Navegador

Abrir DevTools (F12) → Console para ver logs detallados.

### 3.1. Verificación de Peticiones API

1. En el tab **Network**, filtrar por "verificar-identidad"
2. Verificar Request Headers:
   ```
   Content-Type: application/json
   ```
3. Verificar Request Payload:
   ```json
   {
     "email": "juan.perez@ejemplo.com",
     "telefono": "5512345678"
   }
   ```
4. Verificar Response:
   ```json
   {
     "success": true,
     "message": "Identidad verificada correctamente"
   }
   ```

### 3.2. Verificación de Errores

Si hay errores, verificar en Console:

**Error de CORS:**
```
Access to fetch at 'http://localhost:3001/api/auth/verificar-identidad'
from origin 'http://localhost:3000' has been blocked by CORS policy
```
**Solución**: Verificar que el proxy de Next.js está configurado correctamente en `next.config.ts`

**Error 404:**
```
POST http://localhost:3000/api/auth/verificar-identidad 404 (Not Found)
```
**Solución**: El endpoint no está implementado en el backend o la ruta es incorrecta

**Error de conexión:**
```
Failed to fetch
```
**Solución**: El backend no está corriendo o la URL es incorrecta

---

## 4. Checklist de Pruebas Completas

### Backend API
- [ ] Usuario de prueba creado
- [ ] Verificación exitosa con datos correctos
- [ ] Verificación falla con email incorrecto
- [ ] Verificación falla con teléfono incorrecto
- [ ] Validación de formato de email funciona
- [ ] Validación de formato de teléfono funciona
- [ ] Recuperación exitosa con datos correctos
- [ ] Recuperación falla con datos incorrectos
- [ ] Validación de longitud de contraseña funciona
- [ ] Login exitoso con nueva contraseña

### Frontend - Flujo Completo
- [ ] Enlace "¿Olvidaste tu contraseña?" visible en login
- [ ] Redirección a `/forgot-password` funciona
- [ ] Paso 1 muestra formulario de verificación
- [ ] Indicador de progreso muestra paso 1
- [ ] Validación de email funciona (frontend)
- [ ] Validación de teléfono funciona (frontend)
- [ ] Toast de éxito aparece en verificación exitosa
- [ ] Toast de error aparece en verificación fallida
- [ ] Avanza automáticamente al paso 2 después de verificación
- [ ] Paso 2 muestra datos verificados (email + teléfono)
- [ ] Paso 2 muestra campos de nueva contraseña
- [ ] Validación de "contraseñas coinciden" funciona
- [ ] Validación de longitud mínima funciona
- [ ] Toast de éxito aparece al cambiar contraseña
- [ ] Redirección automática al login después de cambio
- [ ] Botón "Atrás" regresa al paso 1
- [ ] Login exitoso con nueva contraseña

### Casos Edge
- [ ] Input de teléfono solo permite números (frontend)
- [ ] Email con espacios es rechazado
- [ ] Contraseña muy corta es rechazada (backend)
- [ ] Mensajes de error son genéricos (no revelan si el email existe)
- [ ] Re-verificación funciona en el backend (no confía solo en frontend)

### UX/UI
- [ ] Formularios son responsivos en móvil
- [ ] Iconos se muestran correctamente (Mail, Phone, Lock)
- [ ] Progress indicator se actualiza correctamente
- [ ] Toasts se auto-cierran después de 4 segundos
- [ ] Campos requeridos muestran asterisco o indicador
- [ ] Placeholders son descriptivos
- [ ] Links tienen hover states

---

## 5. Troubleshooting

### Problema: Backend no responde

**Síntomas**: Error "Failed to fetch" o timeout

**Verificar**:
1. Backend está corriendo: `curl http://localhost:3001/api/health`
2. Puerto correcto en `.env.local`
3. Firewall no está bloqueando el puerto

### Problema: CORS errors

**Síntomas**: "blocked by CORS policy" en consola

**Verificar**:
1. El proxy de Next.js está configurado en `next.config.ts`
2. Estás usando `/api/*` en las peticiones (NO `http://localhost:3001/api/*`)
3. Reiniciar el servidor de desarrollo después de cambiar `.env.local`

### Problema: Endpoints retornan 404

**Síntomas**: `POST /api/auth/verificar-identidad 404`

**Verificar**:
1. Los endpoints están registrados en `src/infrastructure/routes/auth.routes.ts`
2. El servidor del backend se reinició después de agregar las rutas
3. La URL es exactamente `/api/auth/verificar-identidad` (sin typos)

### Problema: Validación falla inesperadamente

**Síntomas**: Datos correctos son rechazados

**Verificar**:
1. El teléfono en la BD es exactamente el mismo (sin guiones, espacios, etc.)
2. El email en la BD está en minúsculas (o hacer case-insensitive la búsqueda)
3. Revisar logs del backend para ver el error exacto

### Problema: Contraseña no cambia

**Síntomas**: "Contraseña cambiada exitosamente" pero login falla

**Verificar**:
1. La contraseña está siendo hasheada antes de guardar
2. El `UPDATE` en la BD está funcionando correctamente
3. Probar con un usuario diferente para descartar caché

---

## 6. Logs para Debugging

**Backend - Agregar logs temporales:**

```typescript
// En verificar-identidad.use-case.ts
console.log('[VERIFY] Email recibido:', email);
console.log('[VERIFY] Teléfono recibido:', telefono);
console.log('[VERIFY] Usuario encontrado:', usuario ? 'SÍ' : 'NO');
if (usuario) {
  console.log('[VERIFY] Teléfono en BD:', usuario.telefono);
  console.log('[VERIFY] Coincide?:', usuario.telefono === telefono);
}
```

**Frontend - Ver datos enviados:**

```typescript
// En src/app/(presentation)/forgot-password/page.tsx
console.log('[FRONTEND] Enviando a verificar:', values);
console.log('[FRONTEND] Respuesta recibida:', response);
```

---

## 7. Métricas de Éxito

El sistema está funcionando correctamente si:

✅ Un usuario puede:
1. Olvidar su contraseña
2. Ir a `/forgot-password` desde el login
3. Ingresar email + teléfono correctos
4. Pasar la verificación
5. Ingresar nueva contraseña
6. Recibir confirmación de cambio exitoso
7. Ser redirigido al login
8. Hacer login con la nueva contraseña
9. Acceder a su cuenta normalmente

✅ El sistema rechaza:
1. Email que no existe
2. Teléfono que no coincide con el email
3. Formatos inválidos de email/teléfono
4. Contraseñas muy cortas
5. Contraseñas que no coinciden (confirmación)

✅ Seguridad:
1. No revela si un email existe o no
2. Re-verifica identidad en el backend
3. Hashea las contraseñas correctamente
4. No expone datos sensibles en las respuestas

---

## 8. Siguientes Pasos (Mejoras Futuras)

Una vez que el sistema básico funcione, considera agregar:

- [ ] **Rate limiting**: Limitar intentos de recuperación por IP
- [ ] **Notificación por email**: Enviar email cuando cambia la contraseña
- [ ] **Código de verificación**: Enviar código al email en vez de usar teléfono
- [ ] **Invalidar sesiones**: Cerrar todas las sesiones activas al cambiar contraseña
- [ ] **Auditoría**: Registrar todos los cambios de contraseña en una tabla
- [ ] **Preguntas de seguridad**: Capa adicional de verificación
- [ ] **2FA**: Autenticación de dos factores

---

¡Sistema de Recuperación de Contraseña listo para producción! 🎉
