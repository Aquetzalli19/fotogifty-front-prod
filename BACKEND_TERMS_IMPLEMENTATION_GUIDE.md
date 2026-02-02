# Guía de Implementación - Sistema de Aceptación de Términos (BACKEND)

## Objetivo

Implementar en el backend un sistema completo de versionado y validación de aceptación de términos y condiciones.

---

## Base de Datos

### **Nueva Tabla: `aceptaciones_terminos`**

```sql
CREATE TABLE aceptaciones_terminos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_documento_legal INT NOT NULL,
  version VARCHAR(50) NOT NULL,
  fecha_aceptacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45), -- Opcional: para auditoría
  user_agent TEXT,         -- Opcional: para auditoría

  -- Índices para consultas rápidas
  INDEX idx_usuario_documento (id_usuario, id_documento_legal),
  INDEX idx_fecha (fecha_aceptacion),

  -- Constraint: Una aceptación por usuario por versión
  UNIQUE KEY unique_user_version (id_usuario, id_documento_legal, version),

  -- Foreign keys
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (id_documento_legal) REFERENCES documentos_legales(id) ON DELETE CASCADE
);
```

**Notas:**
- `version`: String para soportar versionado semántico (ej: "1.0.0", "2.1.3")
- `unique_user_version`: Evita duplicados de aceptación
- `CASCADE`: Si se borra un usuario o documento, se borran sus aceptaciones

### **Modificación a Tabla Existente: `usuarios`**

**Opción 1: Usar tabla de aceptaciones (RECOMENDADO)**
No modificar tabla `usuarios`. Confiar en `aceptaciones_terminos`.

**Opción 2: Agregar campo legacy para compatibilidad**
```sql
ALTER TABLE usuarios
ADD COLUMN acepto_terminos_version VARCHAR(50) DEFAULT NULL,
ADD COLUMN acepto_terminos_fecha TIMESTAMP DEFAULT NULL;
```

**Recomendación**: Usar Opción 1 (solo tabla `aceptaciones_terminos`).

---

## Endpoints a Implementar/Modificar

### **1. Verificar Estado de Términos de un Usuario**

```http
GET /api/usuarios/:id/terms-status
```

**Descripción**: Consulta si el usuario tiene pendiente aceptar nuevos términos.

**Headers**:
```
Authorization: Bearer <token>
```

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "needsAcceptance": true,
    "currentVersion": "2.0.0",
    "currentDocumentId": 5,
    "userAcceptedVersion": "1.0.0",
    "userAcceptedDate": "2025-01-15T10:30:00Z",
    "termsDocument": {
      "id": 5,
      "type": "terms",
      "title": "Términos y Condiciones de Uso",
      "content": "Lorem ipsum...",
      "version": "2.0.0",
      "isActive": true,
      "createdAt": "2025-02-01T12:00:00Z",
      "updatedAt": "2025-02-01T12:00:00Z"
    }
  }
}
```

**Response 404** (usuario no existe):
```json
{
  "success": false,
  "error": "USER_NOT_FOUND",
  "message": "Usuario no encontrado"
}
```

**Lógica del Endpoint**:
```javascript
async function getTermsStatus(userId) {
  // 1. Obtener usuario
  const user = await db.query('SELECT * FROM usuarios WHERE id = ?', [userId]);
  if (!user) return 404;

  // 2. Obtener documento legal activo tipo "terms"
  const activeTerms = await db.query(
    'SELECT * FROM documentos_legales WHERE type = ? AND is_active = TRUE ORDER BY created_at DESC LIMIT 1',
    ['terms']
  );

  if (!activeTerms) {
    return { needsAcceptance: false }; // No hay términos configurados
  }

  // 3. Buscar última aceptación del usuario para este documento
  const userAcceptance = await db.query(
    `SELECT version, fecha_aceptacion
     FROM aceptaciones_terminos
     WHERE id_usuario = ? AND id_documento_legal = ?
     ORDER BY fecha_aceptacion DESC
     LIMIT 1`,
    [userId, activeTerms.id]
  );

  // 4. Comparar versiones
  const needsAcceptance = !userAcceptance ||
                          userAcceptance.version !== activeTerms.version;

  return {
    needsAcceptance,
    currentVersion: activeTerms.version,
    currentDocumentId: activeTerms.id,
    userAcceptedVersion: userAcceptance?.version || null,
    userAcceptedDate: userAcceptance?.fecha_aceptacion || null,
    termsDocument: activeTerms,
  };
}
```

---

### **2. Registrar Aceptación de Términos**

```http
POST /api/usuarios/:id/accept-terms
```

**Descripción**: Registra que el usuario aceptó una versión específica de los términos.

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "id_documento_legal": 5,
  "version": "2.0.0",
  "ip_address": "192.168.1.100",  // Opcional
  "user_agent": "Mozilla/5.0..."   // Opcional
}
```

**Response 201 Created**:
```json
{
  "success": true,
  "message": "Términos aceptados correctamente",
  "data": {
    "id": 123,
    "id_usuario": 42,
    "id_documento_legal": 5,
    "version": "2.0.0",
    "fecha_aceptacion": "2025-02-02T15:30:00Z"
  }
}
```

**Response 400** (versión incorrecta):
```json
{
  "success": false,
  "error": "INVALID_VERSION",
  "message": "La versión especificada no coincide con la versión actual del documento"
}
```

**Response 409** (ya aceptado):
```json
{
  "success": false,
  "error": "ALREADY_ACCEPTED",
  "message": "Ya has aceptado esta versión de los términos",
  "data": {
    "fecha_aceptacion": "2025-02-01T10:00:00Z"
  }
}
```

**Lógica del Endpoint**:
```javascript
async function acceptTerms(userId, body, request) {
  const { id_documento_legal, version, ip_address, user_agent } = body;

  // 1. Validar que el usuario existe
  const user = await db.query('SELECT * FROM usuarios WHERE id = ?', [userId]);
  if (!user) return 404;

  // 2. Validar que el documento legal existe y está activo
  const document = await db.query(
    'SELECT * FROM documentos_legales WHERE id = ? AND is_active = TRUE',
    [id_documento_legal]
  );
  if (!document) {
    return { error: 'DOCUMENT_NOT_FOUND', message: 'Documento legal no encontrado o inactivo' };
  }

  // 3. Validar que la versión coincide con la del documento
  if (document.version !== version) {
    return { error: 'INVALID_VERSION', message: 'La versión no coincide' };
  }

  // 4. Verificar si ya aceptó esta versión (por el UNIQUE constraint)
  const existing = await db.query(
    'SELECT * FROM aceptaciones_terminos WHERE id_usuario = ? AND id_documento_legal = ? AND version = ?',
    [userId, id_documento_legal, version]
  );

  if (existing) {
    return { error: 'ALREADY_ACCEPTED', message: 'Ya aceptaste esta versión', status: 409 };
  }

  // 5. Insertar aceptación
  const result = await db.query(
    `INSERT INTO aceptaciones_terminos
     (id_usuario, id_documento_legal, version, ip_address, user_agent, fecha_aceptacion)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [userId, id_documento_legal, version, ip_address || null, user_agent || null]
  );

  // 6. Retornar confirmación
  return {
    success: true,
    data: {
      id: result.insertId,
      id_usuario: userId,
      id_documento_legal,
      version,
      fecha_aceptacion: new Date(),
    }
  };
}
```

---

### **3. Validar Términos en Checkout**

```http
POST /api/checkout
```

**Modificación**: Agregar validación ANTES de crear la sesión de Stripe.

**Validación a Agregar**:
```javascript
async function crearSesionCheckout(body) {
  const { id_usuario } = body;

  // ===== VALIDACIÓN DE TÉRMINOS (NUEVO) =====
  const termsStatus = await getTermsStatus(id_usuario);

  if (termsStatus.needsAcceptance) {
    return {
      status: 403,
      error: 'TERMS_NOT_ACCEPTED',
      message: 'Debes aceptar los nuevos términos y condiciones antes de realizar un pedido',
      data: {
        currentVersion: termsStatus.currentVersion,
        userAcceptedVersion: termsStatus.userAcceptedVersion,
        termsDocumentId: termsStatus.currentDocumentId,
      }
    };
  }
  // ===== FIN VALIDACIÓN =====

  // ... resto del código de checkout ...
}
```

**Response 403**:
```json
{
  "success": false,
  "error": "TERMS_NOT_ACCEPTED",
  "message": "Debes aceptar los nuevos términos y condiciones antes de realizar un pedido",
  "data": {
    "currentVersion": "2.0.0",
    "userAcceptedVersion": "1.0.0",
    "termsDocumentId": 5
  }
}
```

---

### **4. Auto-Versionado al Editar Documentos Legales**

```http
PUT /api/legal-documents/:id
```

**Modificación**: Auto-incrementar versión si el documento está activo y se modifica el contenido.

**Lógica a Agregar**:
```javascript
async function actualizarDocumentoLegal(id, body) {
  const { content, title, version } = body;

  // 1. Obtener documento actual
  const currentDoc = await db.query('SELECT * FROM documentos_legales WHERE id = ?', [id]);
  if (!currentDoc) return 404;

  // 2. Si el documento está activo Y el contenido cambió, incrementar versión automáticamente
  let newVersion = version || currentDoc.version;

  if (currentDoc.is_active && content && content !== currentDoc.content) {
    // Auto-incrementar versión
    newVersion = incrementVersion(currentDoc.version); // "1.0.0" -> "1.1.0"

    console.log(`[TERMS] Documento activo modificado. Versión actualizada: ${currentDoc.version} -> ${newVersion}`);
  }

  // 3. Actualizar documento
  await db.query(
    `UPDATE documentos_legales
     SET title = ?, content = ?, version = ?, updated_at = NOW()
     WHERE id = ?`,
    [title || currentDoc.title, content || currentDoc.content, newVersion, id]
  );

  return { success: true, data: { id, version: newVersion } };
}

// Función helper para incrementar versión semántica
function incrementVersion(currentVersion) {
  const parts = currentVersion.split('.').map(Number);

  // Incrementar versión menor (x.Y.z -> x.(Y+1).z)
  parts[1] = (parts[1] || 0) + 1;

  return parts.join('.');
}
```

**Alternativa: Estrategia de Versionado Manual**

Si prefieres que el admin especifique la versión manualmente:
1. Al editar documento activo, mostrar advertencia en frontend
2. Requerir que el admin ingrese la nueva versión
3. No auto-incrementar

---

### **5. Registrar Aceptación en Signup** (ya parcialmente implementado)

```http
POST /api/usuarios
```

**Modificación**: Después de crear usuario, registrar aceptación de términos.

**Lógica Actual**:
```javascript
async function crearUsuario(body) {
  const { acepto_terminos, ...userData } = body;

  // 1. Crear usuario
  const userId = await db.query('INSERT INTO usuarios SET ?', userData);

  // 2. Si aceptó términos, registrar aceptación (NUEVO)
  if (acepto_terminos) {
    // Obtener documento legal activo tipo "terms"
    const activeTerms = await db.query(
      'SELECT * FROM documentos_legales WHERE type = ? AND is_active = TRUE LIMIT 1',
      ['terms']
    );

    if (activeTerms) {
      await db.query(
        `INSERT INTO aceptaciones_terminos
         (id_usuario, id_documento_legal, version, fecha_aceptacion)
         VALUES (?, ?, ?, NOW())`,
        [userId, activeTerms.id, activeTerms.version]
      );

      console.log(`[TERMS] Usuario ${userId} aceptó términos versión ${activeTerms.version} durante signup`);
    }
  }

  return { success: true, data: { id: userId } };
}
```

---

## Utilidades y Helpers

### **Helper: Comparar Versiones Semánticas**

```javascript
/**
 * Compara dos versiones semánticas (ej: "1.2.3" vs "1.3.0")
 * @returns 1 si v1 > v2, -1 si v1 < v2, 0 si son iguales
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
}

// Uso:
const needsUpdate = compareVersions(currentVersion, userVersion) > 0;
```

### **Middleware: Validar Términos Aceptados**

```javascript
/**
 * Middleware para rutas que requieren términos aceptados
 */
async function requireTermsAccepted(req, res, next) {
  const userId = req.user?.id; // Asumiendo que el user viene del auth middleware

  if (!userId) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const termsStatus = await getTermsStatus(userId);

  if (termsStatus.needsAcceptance) {
    return res.status(403).json({
      success: false,
      error: 'TERMS_NOT_ACCEPTED',
      message: 'Debes aceptar los nuevos términos y condiciones',
      data: {
        currentVersion: termsStatus.currentVersion,
        userAcceptedVersion: termsStatus.userAcceptedVersion,
        termsDocumentId: termsStatus.currentDocumentId,
      }
    });
  }

  next();
}

// Uso:
app.post('/api/checkout', authenticate, requireTermsAccepted, crearSesionCheckout);
app.post('/api/pedidos', authenticate, requireTermsAccepted, crearPedido);
```

---

## Endpoints Opcionales (Extensiones Futuras)

### **Historial de Aceptaciones de un Usuario**

```http
GET /api/usuarios/:id/terms-history
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "documentType": "terms",
      "version": "2.0.0",
      "acceptedAt": "2025-02-02T15:30:00Z"
    },
    {
      "id": 98,
      "documentType": "terms",
      "version": "1.0.0",
      "acceptedAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### **Notificar por Email Términos Actualizados** (Backend)

```http
POST /api/legal-documents/:id/notify-users
```

**Descripción**: Enviar email a todos los usuarios que aún no han aceptado la nueva versión.

**Lógica**:
```javascript
async function notifyUsersOfUpdatedTerms(documentId) {
  // 1. Obtener documento
  const doc = await db.query('SELECT * FROM documentos_legales WHERE id = ?', [documentId]);

  // 2. Obtener usuarios que NO han aceptado esta versión
  const users = await db.query(`
    SELECT DISTINCT u.id, u.email, u.nombre
    FROM usuarios u
    LEFT JOIN aceptaciones_terminos a ON u.id = a.id_usuario AND a.version = ?
    WHERE a.id IS NULL
  `, [doc.version]);

  // 3. Enviar emails en batch
  for (const user of users) {
    await sendEmail({
      to: user.email,
      subject: 'Nuevos Términos y Condiciones - FotoGifty',
      template: 'terms-updated',
      data: {
        nombre: user.nombre,
        version: doc.version,
        link: `${APP_URL}/terms`,
      }
    });
  }

  return { success: true, notifiedUsers: users.length };
}
```

---

## Migraciones de Base de Datos

### **Migración 1: Crear tabla `aceptaciones_terminos`**

```sql
-- migrations/001_create_aceptaciones_terminos.sql
CREATE TABLE IF NOT EXISTS aceptaciones_terminos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_documento_legal INT NOT NULL,
  version VARCHAR(50) NOT NULL,
  fecha_aceptacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,

  INDEX idx_usuario_documento (id_usuario, id_documento_legal),
  INDEX idx_fecha (fecha_aceptacion),
  UNIQUE KEY unique_user_version (id_usuario, id_documento_legal, version),

  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (id_documento_legal) REFERENCES documentos_legales(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### **Migración 2: Migrar datos legacy (si existe campo `acepto_terminos`)**

```sql
-- migrations/002_migrate_legacy_terms_acceptance.sql
-- Solo si existe campo acepto_terminos en tabla usuarios

-- Insertar aceptaciones históricas para usuarios que tienen acepto_terminos = TRUE
INSERT INTO aceptaciones_terminos (id_usuario, id_documento_legal, version, fecha_aceptacion)
SELECT
  u.id,
  (SELECT id FROM documentos_legales WHERE type = 'terms' AND is_active = TRUE LIMIT 1),
  '1.0.0', -- Versión legacy
  u.created_at -- Fecha de creación del usuario como fecha de aceptación
FROM usuarios u
WHERE u.acepto_terminos = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM aceptaciones_terminos a
    WHERE a.id_usuario = u.id
  );
```

---

## Testing Backend

### **Casos de Prueba**

1. **Verificar estado de términos**:
   - Usuario sin aceptaciones → `needsAcceptance: true`
   - Usuario con versión antigua → `needsAcceptance: true`
   - Usuario con versión actual → `needsAcceptance: false`

2. **Registrar aceptación**:
   - Aceptación exitosa → 201 Created
   - Versión incorrecta → 400 Bad Request
   - Ya aceptado → 409 Conflict
   - Documento inactivo → 400 Bad Request

3. **Validación en checkout**:
   - Usuario sin términos aceptados → 403 Forbidden
   - Usuario con términos aceptados → checkout exitoso
   - Admin actualiza términos → usuarios existentes bloqueados

4. **Auto-versionado**:
   - Editar contenido de documento activo → versión incrementada
   - Editar título sin cambiar contenido → versión NO incrementada
   - Editar documento inactivo → versión NO incrementada

### **Tests Automatizados (Jest/Mocha)**

```javascript
describe('Terms Acceptance API', () => {
  it('should return needsAcceptance=true for user without acceptance', async () => {
    const response = await request(app).get('/api/usuarios/1/terms-status');
    expect(response.body.data.needsAcceptance).toBe(true);
  });

  it('should block checkout if terms not accepted', async () => {
    const response = await request(app)
      .post('/api/checkout')
      .send({ id_usuario: 1, items: [...] });
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('TERMS_NOT_ACCEPTED');
  });

  it('should auto-increment version when editing active document', async () => {
    const response = await request(app)
      .put('/api/legal-documents/1')
      .send({ content: 'New content...' });
    expect(response.body.data.version).toBe('1.1.0'); // Incrementado
  });
});
```

---

## Logging y Auditoría

### **Eventos a Loggear**

```javascript
// Aceptación de términos
logger.info('TERMS_ACCEPTED', {
  userId,
  documentId,
  version,
  ip: req.ip,
  timestamp: new Date(),
});

// Checkout bloqueado por términos
logger.warn('CHECKOUT_BLOCKED_TERMS', {
  userId,
  currentVersion,
  userVersion,
  timestamp: new Date(),
});

// Auto-versionado de documento
logger.info('DOCUMENT_VERSION_INCREMENTED', {
  documentId,
  oldVersion,
  newVersion,
  modifiedBy: adminId,
  timestamp: new Date(),
});
```

---

## Consideraciones de Performance

### **Índices Recomendados**
- `idx_usuario_documento` en `aceptaciones_terminos`: Para consultas rápidas de aceptaciones
- `idx_fecha` en `aceptaciones_terminos`: Para reportes y auditoría
- `idx_type_active` en `documentos_legales`: Para obtener documento activo rápidamente

### **Caché (Opcional)**
```javascript
// Cachear documento activo para evitar queries repetidas
const activeTermsCache = new NodeCache({ stdTTL: 3600 }); // 1 hora

async function getActiveTermsDocument() {
  let doc = activeTermsCache.get('active_terms');

  if (!doc) {
    doc = await db.query(
      'SELECT * FROM documentos_legales WHERE type = ? AND is_active = TRUE LIMIT 1',
      ['terms']
    );
    activeTermsCache.set('active_terms', doc);
  }

  return doc;
}

// Invalidar caché al actualizar documento
function onDocumentUpdated(documentId) {
  activeTermsCache.del('active_terms');
}
```

---

## Resumen de Implementación

### **Orden de Implementación Recomendado**

1. ✅ **Crear tabla `aceptaciones_terminos`** (Migración 1)
2. ✅ **Implementar `GET /api/usuarios/:id/terms-status`**
3. ✅ **Implementar `POST /api/usuarios/:id/accept-terms`**
4. ✅ **Modificar `POST /api/checkout`** para validar términos
5. ✅ **Modificar `POST /api/usuarios`** para registrar aceptación en signup
6. ✅ **Implementar auto-versionado en `PUT /api/legal-documents/:id`**
7. ✅ **Crear middleware `requireTermsAccepted`** (opcional)
8. ✅ **Testing completo**

### **Tiempo Estimado**

- **Migración DB**: 30 minutos
- **Endpoint terms-status**: 1-2 horas
- **Endpoint accept-terms**: 1-2 horas
- **Validación en checkout**: 1 hora
- **Modificación signup**: 30 minutos
- **Auto-versionado**: 1 hora
- **Testing**: 2-3 horas

**Total**: ~7-10 horas de desarrollo backend

---

## Checklist Final

- [ ] Tabla `aceptaciones_terminos` creada
- [ ] Endpoint `GET /usuarios/:id/terms-status` implementado
- [ ] Endpoint `POST /usuarios/:id/accept-terms` implementado
- [ ] Validación en `POST /checkout` agregada
- [ ] Registro de aceptación en signup modificado
- [ ] Auto-versionado implementado
- [ ] Índices de BD creados
- [ ] Tests unitarios escritos
- [ ] Tests de integración escritos
- [ ] Logging configurado
- [ ] Documentación de API actualizada (Swagger)
- [ ] Frontend notificado de cambios en API
