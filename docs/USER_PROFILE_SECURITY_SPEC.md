# Especificación de Backend: Seguridad de Perfil de Usuario

## Resumen del Problema

Actualmente, los formularios de edición de email y contraseña en el perfil de usuario no verifican correctamente la contraseña actual del usuario antes de permitir cambios. Esto representa un riesgo de seguridad.

## Objetivo

Implementar endpoints que:
1. Verifiquen la contraseña actual del usuario antes de permitir cambios sensibles
2. Actualicen el email del usuario con verificación de identidad
3. Mantengan la funcionalidad existente de cambio de contraseña

---

## Endpoints Requeridos

### 1. Verificar Contraseña (NUEVO)

#### `POST /api/usuarios/:id/verify-password`

Verifica si la contraseña proporcionada es correcta para el usuario.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Validaciones de Seguridad:**
- El `id` en la URL debe coincidir con el usuario del token JWT
- Rate limiting recomendado: 5 intentos por minuto

**Request Body:**
```json
{
  "password": "contraseña_actual"
}
```

**Response 200 (Contraseña correcta):**
```json
{
  "success": true,
  "data": {
    "valid": true
  }
}
```

**Response 200 (Contraseña incorrecta):**
```json
{
  "success": true,
  "data": {
    "valid": false
  }
}
```

**Response 401 (No autorizado):**
```json
{
  "success": false,
  "message": "No autorizado para verificar la contraseña de este usuario"
}
```

**Response 429 (Demasiados intentos):**
```json
{
  "success": false,
  "message": "Demasiados intentos. Por favor, espera un momento."
}
```

---

### 2. Actualizar Email con Verificación (NUEVO)

#### `PUT /api/usuarios/:id/email`

Actualiza el email del usuario, requiriendo la contraseña actual para verificar identidad.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Validaciones:**
- El `id` en la URL debe coincidir con el usuario del token JWT
- La contraseña actual debe ser correcta
- El nuevo email debe ser un formato válido
- El nuevo email no debe estar en uso por otro usuario

**Request Body:**
```json
{
  "email": "nuevo@correo.com",
  "currentPassword": "contraseña_actual"
}
```

**Response 200 (Éxito):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "nuevo@correo.com",
    "telefono": "+52 55 1234 5678",
    "tipo": "cliente",
    "fecha_creacion": "2024-01-15T10:30:00Z"
  },
  "message": "Email actualizado correctamente"
}
```

**Response 400 (Contraseña incorrecta):**
```json
{
  "success": false,
  "message": "Contraseña incorrecta"
}
```

**Response 400 (Email en uso):**
```json
{
  "success": false,
  "message": "Este correo electrónico ya está registrado"
}
```

**Response 400 (Email inválido):**
```json
{
  "success": false,
  "message": "Formato de correo electrónico inválido"
}
```

---

### 3. Cambiar Contraseña (EXISTENTE - Verificar implementación)

#### `PUT /api/usuarios/:id/password`

Este endpoint ya debería existir. Verificar que:
1. Valida que la contraseña actual sea correcta ANTES de cambiarla
2. Retorna error apropiado si la contraseña actual es incorrecta

**Request Body (esperado):**
```json
{
  "currentPassword": "contraseña_actual",
  "newPassword": "nueva_contraseña_123!"
}
```

**Response 400 si contraseña actual es incorrecta:**
```json
{
  "success": false,
  "message": "Contraseña actual incorrecta"
}
```

---

## Implementación Sugerida (Pseudocódigo)

### Verificar Contraseña

```javascript
async function verifyPassword(req, res) {
  const { id } = req.params;
  const { password } = req.body;
  const authenticatedUserId = req.user.id; // Del JWT

  // Verificar que el usuario solo puede verificar su propia contraseña
  if (parseInt(id) !== authenticatedUserId) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado para verificar la contraseña de este usuario'
    });
  }

  // Obtener usuario de la base de datos
  const user = await Usuario.findById(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Usuario no encontrado'
    });
  }

  // Comparar contraseña con hash almacenado
  const isValid = await bcrypt.compare(password, user.password_hash);

  return res.json({
    success: true,
    data: { valid: isValid }
  });
}
```

### Actualizar Email

```javascript
async function updateEmail(req, res) {
  const { id } = req.params;
  const { email, currentPassword } = req.body;
  const authenticatedUserId = req.user.id;

  // Verificar autorización
  if (parseInt(id) !== authenticatedUserId) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado'
    });
  }

  // Obtener usuario
  const user = await Usuario.findById(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Usuario no encontrado'
    });
  }

  // Verificar contraseña actual
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Contraseña incorrecta'
    });
  }

  // Verificar que el email no esté en uso
  const existingUser = await Usuario.findByEmail(email);
  if (existingUser && existingUser.id !== parseInt(id)) {
    return res.status(400).json({
      success: false,
      message: 'Este correo electrónico ya está registrado'
    });
  }

  // Actualizar email
  const updatedUser = await Usuario.update(id, { email });

  return res.json({
    success: true,
    data: updatedUser,
    message: 'Email actualizado correctamente'
  });
}
```

---

## Consideraciones de Seguridad

### Rate Limiting

Implementar rate limiting para prevenir ataques de fuerza bruta:

```javascript
// Ejemplo con express-rate-limit
const verifyPasswordLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5, // 5 intentos
  message: {
    success: false,
    message: 'Demasiados intentos. Por favor, espera un momento.'
  }
});

app.post('/api/usuarios/:id/verify-password', verifyPasswordLimiter, verifyPassword);
```

### Logging

Registrar intentos de verificación de contraseña para auditoría:

```javascript
// Log de intentos fallidos
console.log(`[SECURITY] Failed password verification attempt for user ${id} from IP ${req.ip}`);
```

### Tokens

Considerar invalidar tokens existentes después de:
- Cambio de contraseña (forzar re-login)
- Cambio de email (opcional)

---

## Frontend - Cambios Realizados

Los siguientes archivos fueron modificados:

### `src/services/usuarios.ts`
- ✅ Agregada función `verificarContraseña(id, password)`
- ✅ Agregada función `actualizarEmailCliente(id, newEmail, currentPassword)`

### `src/components/user/main/edit-modal/EmailEdit.tsx`
- ✅ Ahora verifica la contraseña con el backend antes de habilitar edición
- ✅ Envía la contraseña actual junto con el nuevo email
- ✅ Muestra estados de carga durante verificación y envío
- ✅ Muestra errores apropiados cuando la contraseña es incorrecta

### `src/components/user/main/edit-modal/PasswordEdit.tsx`
- ✅ Ahora verifica la contraseña con el backend antes de habilitar edición
- ✅ Muestra estados de carga durante verificación y envío
- ✅ Muestra errores apropiados cuando la contraseña es incorrecta

---

## Testing

### Casos de Prueba

1. **Verificación de contraseña correcta**
   - Input: contraseña válida
   - Expected: `{ success: true, data: { valid: true } }`

2. **Verificación de contraseña incorrecta**
   - Input: contraseña inválida
   - Expected: `{ success: true, data: { valid: false } }`

3. **Actualización de email exitosa**
   - Input: email nuevo válido + contraseña correcta
   - Expected: Usuario actualizado con nuevo email

4. **Actualización de email con contraseña incorrecta**
   - Input: email nuevo + contraseña incorrecta
   - Expected: Error 400 "Contraseña incorrecta"

5. **Actualización de email en uso**
   - Input: email de otro usuario + contraseña correcta
   - Expected: Error 400 "Este correo electrónico ya está registrado"

6. **Cambio de contraseña con contraseña actual incorrecta**
   - Input: contraseña actual incorrecta + nueva contraseña
   - Expected: Error 400 "Contraseña actual incorrecta"

---

## Prioridad de Implementación

1. **CRÍTICO**: `POST /api/usuarios/:id/verify-password`
2. **CRÍTICO**: `PUT /api/usuarios/:id/email`
3. **VERIFICAR**: `PUT /api/usuarios/:id/password` (ya debería existir)

---

Documento creado: 2024
Versión: 1.0
