# Especificación de Endpoints - Recuperación de Contraseña

## Resumen

Este documento especifica los endpoints necesarios en el backend para implementar el sistema de recuperación de contraseña que ya está implementado en el frontend.

**Frontend implementado**: `/forgot-password` (proceso de 2 pasos)
**Endpoints requeridos**:
1. `POST /api/auth/verificar-identidad` - Verificar email + teléfono
2. `POST /api/auth/recuperar-password` - Cambiar contraseña

---

## 1. POST /api/auth/verificar-identidad

### Descripción
Verifica que el email y teléfono proporcionados correspondan a un usuario registrado en el sistema.

### Request Body
```json
{
  "email": "usuario@ejemplo.com",
  "telefono": "5512345678"
}
```

**Tipos de datos**:
- `email`: String (email válido, requerido)
- `telefono`: String (solo dígitos, 10+ caracteres, requerido)

### Response

**Éxito (200 OK)**:
```json
{
  "success": true,
  "message": "Identidad verificada correctamente"
}
```

**Error - Datos no coinciden (404 Not Found)**:
```json
{
  "success": false,
  "message": "Los datos no coinciden con nuestros registros"
}
```

**Error - Validación (400 Bad Request)**:
```json
{
  "success": false,
  "message": "Email o teléfono inválido"
}
```

### Lógica de Negocio

```javascript
async function verificarIdentidad(email, telefono) {
  // 1. Validar formato de email
  if (!validarEmail(email)) {
    return { success: false, message: "Email inválido" };
  }

  // 2. Validar formato de teléfono (solo dígitos, mínimo 10)
  if (!validarTelefono(telefono)) {
    return { success: false, message: "Teléfono inválido" };
  }

  // 3. Buscar usuario en la base de datos
  const usuario = await buscarUsuarioPorEmail(email);

  // 4. Verificar que existe
  if (!usuario) {
    return {
      success: false,
      message: "Los datos no coinciden con nuestros registros"
    };
  }

  // 5. Verificar que el teléfono coincide
  if (usuario.telefono !== telefono) {
    return {
      success: false,
      message: "Los datos no coinciden con nuestros registros"
    };
  }

  // 6. Identidad verificada exitosamente
  return {
    success: true,
    message: "Identidad verificada correctamente"
  };
}
```

### Consideraciones de Seguridad

⚠️ **IMPORTANTE - Rate Limiting**:
- Limitar a **5 intentos por IP cada 15 minutos**
- Prevenir ataques de fuerza bruta para adivinar combinaciones email+teléfono

⚠️ **IMPORTANTE - Mensajes genéricos**:
- NO revelar si el email existe o no (evitar enumeración de usuarios)
- Usar siempre el mensaje: "Los datos no coinciden con nuestros registros"
- NO diferenciar entre "email no existe" vs "teléfono incorrecto"

⚠️ **IMPORTANTE - Logging**:
- Registrar intentos fallidos con IP y timestamp
- Alertar si hay múltiples intentos fallidos desde la misma IP

---

## 2. POST /api/auth/recuperar-password

### Descripción
Cambia la contraseña del usuario después de verificar nuevamente su identidad.

### Request Body
```json
{
  "email": "usuario@ejemplo.com",
  "telefono": "5512345678",
  "nueva_password": "nuevaContraseña123"
}
```

**Tipos de datos**:
- `email`: String (email válido, requerido)
- `telefono`: String (solo dígitos, 10+ caracteres, requerido)
- `nueva_password`: String (mínimo 8 caracteres, requerido)

### Response

**Éxito (200 OK)**:
```json
{
  "success": true,
  "message": "Contraseña cambiada exitosamente"
}
```

**Error - Datos no coinciden (404 Not Found)**:
```json
{
  "success": false,
  "message": "Los datos no coinciden con nuestros registros"
}
```

**Error - Validación (400 Bad Request)**:
```json
{
  "success": false,
  "message": "La contraseña debe tener al menos 8 caracteres"
}
```

### Lógica de Negocio

```javascript
async function recuperarPassword(email, telefono, nueva_password) {
  // 1. VERIFICAR IDENTIDAD NUEVAMENTE (CRÍTICO)
  const verificacion = await verificarIdentidad(email, telefono);
  if (!verificacion.success) {
    return verificacion; // Retornar error de verificación
  }

  // 2. Validar requisitos de la nueva contraseña
  if (nueva_password.length < 8) {
    return {
      success: false,
      message: "La contraseña debe tener al menos 8 caracteres"
    };
  }

  // OPCIONAL: Validaciones adicionales de contraseña
  // - Mayúsculas/minúsculas
  // - Números
  // - Caracteres especiales

  // 3. Buscar usuario
  const usuario = await buscarUsuarioPorEmail(email);

  // 4. Hashear la nueva contraseña
  const passwordHasheada = await hashPassword(nueva_password);

  // 5. Actualizar contraseña en la base de datos
  await actualizarPassword(usuario.id, passwordHasheada);

  // 6. OPCIONAL pero RECOMENDADO: Invalidar sesiones activas
  await invalidarSesionesUsuario(usuario.id);

  // 7. OPCIONAL: Enviar email de confirmación
  await enviarEmailCambioPassword(usuario.email);

  // 8. OPCIONAL: Registrar evento de auditoría
  await registrarEvento({
    tipo: 'password_changed',
    usuario_id: usuario.id,
    metodo: 'recuperacion',
    timestamp: new Date()
  });

  return {
    success: true,
    message: "Contraseña cambiada exitosamente"
  };
}
```

### Consideraciones de Seguridad

⚠️ **CRÍTICO - Re-verificación**:
- SIEMPRE re-verificar email + teléfono en este endpoint
- NO confiar solo en que el frontend ya verificó
- Un atacante podría llamar directamente a este endpoint

⚠️ **CRÍTICO - Hashing de contraseña**:
- Usar **bcrypt**, **argon2** o **scrypt** (NUNCA almacenar en texto plano)
- Ejemplo con bcrypt: `bcrypt.hash(password, 10)`

⚠️ **IMPORTANTE - Rate Limiting**:
- Limitar a **3 intentos por email cada 15 minutos**
- Más restrictivo que el endpoint de verificación

⚠️ **RECOMENDADO - Invalidar sesiones**:
- Al cambiar la contraseña, cerrar todas las sesiones activas del usuario
- Forzar re-login con la nueva contraseña

⚠️ **RECOMENDADO - Notificación**:
- Enviar email al usuario confirmando el cambio de contraseña
- Si el usuario no solicitó el cambio, puede reaccionar rápidamente

⚠️ **RECOMENDADO - Auditoría**:
- Registrar todos los cambios de contraseña en una tabla de auditoría
- Incluir: timestamp, IP, método (recuperación vs cambio normal)

---

## Estrategia de Implementación

### Paso 1: Preparar la Base de Datos

**Verificar que la tabla de usuarios tenga**:
- `email` (único, indexado)
- `telefono` (string)
- `password` (hasheada)

**OPCIONAL - Crear tabla de auditoría**:
```sql
CREATE TABLE password_change_log (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL,
  metodo VARCHAR(50), -- 'recuperacion' | 'cambio_normal'
  ip_address VARCHAR(45),
  timestamp TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
```

**OPCIONAL - Crear tabla de rate limiting**:
```sql
CREATE TABLE rate_limit_verificacion (
  id SERIAL PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  email VARCHAR(255),
  intentos INT DEFAULT 1,
  ultimo_intento TIMESTAMP DEFAULT NOW(),
  bloqueado_hasta TIMESTAMP
);
```

### Paso 2: Implementar Funciones Auxiliares

```javascript
// Validar email
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Validar teléfono
function validarTelefono(telefono) {
  const regex = /^[0-9]{10,}$/;
  return regex.test(telefono);
}

// Hashear contraseña
async function hashPassword(password) {
  const bcrypt = require('bcrypt');
  return await bcrypt.hash(password, 10);
}

// Verificar rate limiting
async function verificarRateLimit(ip, email, limite, ventana) {
  // Implementar lógica de rate limiting
  // Retornar true si se excedió el límite
}
```

### Paso 3: Implementar Endpoints

**Usando Express.js como ejemplo**:

```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

// POST /api/auth/verificar-identidad
router.post('/auth/verificar-identidad', async (req, res) => {
  try {
    const { email, telefono } = req.body;

    // Validación de entrada
    if (!email || !telefono) {
      return res.status(400).json({
        success: false,
        message: "Email y teléfono son requeridos"
      });
    }

    // Rate limiting
    const rateLimitExcedido = await verificarRateLimit(
      req.ip,
      email,
      5, // 5 intentos
      15 * 60 * 1000 // 15 minutos
    );

    if (rateLimitExcedido) {
      return res.status(429).json({
        success: false,
        message: "Demasiados intentos. Intenta de nuevo más tarde."
      });
    }

    // Validar formato
    if (!validarEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Email inválido"
      });
    }

    if (!validarTelefono(telefono)) {
      return res.status(400).json({
        success: false,
        message: "Teléfono inválido"
      });
    }

    // Buscar usuario
    const usuario = await db.query(
      'SELECT id, telefono FROM usuarios WHERE email = $1',
      [email]
    );

    // Verificar existencia y teléfono
    if (!usuario.rows[0] || usuario.rows[0].telefono !== telefono) {
      // Registrar intento fallido
      await registrarIntentoFallido(req.ip, email);

      return res.status(404).json({
        success: false,
        message: "Los datos no coinciden con nuestros registros"
      });
    }

    // Éxito
    return res.status(200).json({
      success: true,
      message: "Identidad verificada correctamente"
    });

  } catch (error) {
    console.error('Error en verificar-identidad:', error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
});

// POST /api/auth/recuperar-password
router.post('/auth/recuperar-password', async (req, res) => {
  try {
    const { email, telefono, nueva_password } = req.body;

    // Validación de entrada
    if (!email || !telefono || !nueva_password) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos"
      });
    }

    // Rate limiting (más restrictivo)
    const rateLimitExcedido = await verificarRateLimit(
      req.ip,
      email,
      3, // 3 intentos
      15 * 60 * 1000 // 15 minutos
    );

    if (rateLimitExcedido) {
      return res.status(429).json({
        success: false,
        message: "Demasiados intentos. Intenta de nuevo más tarde."
      });
    }

    // RE-VERIFICAR IDENTIDAD (CRÍTICO)
    const usuario = await db.query(
      'SELECT id, telefono FROM usuarios WHERE email = $1',
      [email]
    );

    if (!usuario.rows[0] || usuario.rows[0].telefono !== telefono) {
      return res.status(404).json({
        success: false,
        message: "Los datos no coinciden con nuestros registros"
      });
    }

    // Validar requisitos de contraseña
    if (nueva_password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 8 caracteres"
      });
    }

    // Hashear nueva contraseña
    const passwordHasheada = await bcrypt.hash(nueva_password, 10);

    // Actualizar contraseña
    await db.query(
      'UPDATE usuarios SET password = $1 WHERE id = $2',
      [passwordHasheada, usuario.rows[0].id]
    );

    // OPCIONAL: Invalidar sesiones activas
    await db.query(
      'DELETE FROM sesiones WHERE usuario_id = $1',
      [usuario.rows[0].id]
    );

    // OPCIONAL: Registrar evento de auditoría
    await db.query(
      'INSERT INTO password_change_log (usuario_id, metodo, ip_address) VALUES ($1, $2, $3)',
      [usuario.rows[0].id, 'recuperacion', req.ip]
    );

    // OPCIONAL: Enviar email de confirmación
    // await enviarEmailCambioPassword(email);

    // Éxito
    return res.status(200).json({
      success: true,
      message: "Contraseña cambiada exitosamente"
    });

  } catch (error) {
    console.error('Error en recuperar-password:', error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
});

module.exports = router;
```

### Paso 4: Pruebas Manuales con cURL

**Probar verificación de identidad**:
```bash
# Caso exitoso
curl -X POST "http://localhost:3001/api/auth/verificar-identidad" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "telefono": "5512345678"
  }'

# Respuesta esperada:
# {"success":true,"message":"Identidad verificada correctamente"}

# Caso de error - datos incorrectos
curl -X POST "http://localhost:3001/api/auth/verificar-identidad" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "telefono": "0000000000"
  }'

# Respuesta esperada:
# {"success":false,"message":"Los datos no coinciden con nuestros registros"}
```

**Probar cambio de contraseña**:
```bash
# Caso exitoso
curl -X POST "http://localhost:3001/api/auth/recuperar-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "telefono": "5512345678",
    "nueva_password": "nuevaContraseña123"
  }'

# Respuesta esperada:
# {"success":true,"message":"Contraseña cambiada exitosamente"}

# Caso de error - contraseña muy corta
curl -X POST "http://localhost:3001/api/auth/recuperar-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "telefono": "5512345678",
    "nueva_password": "123"
  }'

# Respuesta esperada:
# {"success":false,"message":"La contraseña debe tener al menos 8 caracteres"}
```

### Paso 5: Verificar Integración Frontend-Backend

1. **Iniciar backend**: `npm run dev` (o el comando que uses)
2. **Iniciar frontend**: `npm run dev` en el proyecto Next.js
3. **Probar flujo completo**:
   - Ir a `http://localhost:3000/login`
   - Clic en "¿Olvidaste tu contraseña?"
   - Ingresar email y teléfono registrados
   - Verificar que aparece el paso 2
   - Ingresar nueva contraseña
   - Verificar redirección al login
   - Probar login con la nueva contraseña

---

## Checklist de Implementación

### Backend
- [ ] Crear endpoint `POST /api/auth/verificar-identidad`
- [ ] Crear endpoint `POST /api/auth/recuperar-password`
- [ ] Implementar validaciones de entrada (email, teléfono, contraseña)
- [ ] Implementar rate limiting para ambos endpoints
- [ ] Re-verificar identidad en el endpoint de cambio de contraseña
- [ ] Hashear contraseñas con bcrypt (o similar)
- [ ] (Opcional) Invalidar sesiones activas al cambiar contraseña
- [ ] (Opcional) Enviar email de confirmación
- [ ] (Opcional) Implementar tabla de auditoría
- [ ] Probar endpoints con cURL o Postman

### Frontend
- [x] Crear página `/forgot-password` - **YA IMPLEMENTADO**
- [x] Crear schemas de validación - **YA IMPLEMENTADO**
- [x] Crear servicios de API - **YA IMPLEMENTADO**
- [x] Agregar enlace desde login - **YA IMPLEMENTADO**
- [ ] Probar flujo completo con backend conectado

### Seguridad
- [ ] Implementar rate limiting (5 intentos en 15 min para verificación)
- [ ] Implementar rate limiting (3 intentos en 15 min para cambio)
- [ ] Usar mensajes genéricos (no revelar si el email existe)
- [ ] Hashear contraseñas con algoritmo seguro (bcrypt/argon2)
- [ ] Re-verificar identidad en endpoint de cambio (no confiar en frontend)
- [ ] Logging de intentos fallidos con IP

---

## Mejoras Opcionales (Futuro)

### Verificación por Email (2FA)
En lugar de solo email + teléfono, enviar un código de 6 dígitos al email:

1. Usuario ingresa email
2. Backend genera código aleatorio de 6 dígitos
3. Backend envía código al email
4. Código expira en 15 minutos
5. Usuario ingresa código en el frontend
6. Backend verifica código
7. Usuario ingresa nueva contraseña

**Ventaja**: Más seguro (verifica que el usuario tiene acceso al email)

### Verificación por SMS
Similar a email pero con código SMS al teléfono registrado.

### Preguntas de Seguridad
Agregar preguntas de seguridad personalizadas durante el registro.

### Historial de Contraseñas
Evitar que el usuario reutilice las últimas 5 contraseñas.

---

## Notas Finales

1. **Prioridad de implementación**: Los endpoints básicos son suficientes para MVP. Las mejoras opcionales se pueden agregar después.

2. **Testing**: Probar exhaustivamente con diferentes casos:
   - Email correcto, teléfono incorrecto
   - Email incorrecto, teléfono correcto
   - Ambos incorrectos
   - Contraseñas de diferentes longitudes
   - Rate limiting funcionando correctamente

3. **Deployment**: Asegurarse de que los endpoints estén desplegados en Railway antes de probar con el frontend en producción.

4. **Monitoreo**: Revisar logs regularmente para detectar:
   - Múltiples intentos fallidos desde la misma IP (posible ataque)
   - Patrones inusuales de cambios de contraseña
