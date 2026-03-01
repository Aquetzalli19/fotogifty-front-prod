# Especificación Backend — Eliminación de Cuenta de Usuario

## Endpoint

```
DELETE /api/usuarios/:id
```

Requiere autenticación mediante JWT (`Authorization: Bearer <token>`).

---

## Request

### Headers

| Header          | Valor                        |
|-----------------|------------------------------|
| Authorization   | `Bearer <jwt_token>`         |
| Content-Type    | `application/json`           |

### Path Parameters

| Parámetro | Tipo    | Descripción                       |
|-----------|---------|-----------------------------------|
| `id`      | integer | ID del usuario a eliminar         |

### Body

```json
{
  "password": "string",
  "phoneNumber": "string"
}
```

| Campo         | Tipo   | Requerido | Validación                              |
|---------------|--------|-----------|-----------------------------------------|
| `password`    | string | Sí        | Contraseña actual del usuario           |
| `phoneNumber` | string | Sí        | Teléfono registrado (9–11 dígitos numéricos) |

---

## Respuestas

### 200 OK — Cuenta eliminada exitosamente

```json
{
  "success": true,
  "message": "Cuenta eliminada correctamente"
}
```

### 400 Bad Request — Faltan campos o validación fallida

```json
{
  "success": false,
  "error": "Datos inválidos",
  "details": {
    "password": "Se requiere la contraseña",
    "phoneNumber": "Formato de teléfono inválido"
  }
}
```

### 401 Unauthorized — Contraseña o teléfono incorrectos

```json
{
  "success": false,
  "error": "Credenciales incorrectas. Verifica tu contraseña y número de teléfono."
}
```

### 403 Forbidden — El token no corresponde al usuario del path `:id`

```json
{
  "success": false,
  "error": "No tienes permiso para eliminar esta cuenta"
}
```

### 404 Not Found — El usuario ya fue eliminado o no existe

```json
{
  "success": false,
  "error": "Usuario no encontrado"
}
```

### 409 Conflict — El usuario tiene pedidos pendientes de pago o en proceso activo

```json
{
  "success": false,
  "error": "No puedes eliminar tu cuenta mientras tengas pedidos activos. Espera a que sean completados o cancélalos primero."
}
```

---

## Estrategia de Anonimización

La eliminación de cuenta NO borra las filas del usuario en la base de datos para preservar la integridad referencial de los pedidos. En su lugar, se aplica anonimización:

### Datos eliminados (null o vacíos)

| Campo           | Acción                        |
|-----------------|-------------------------------|
| `email`         | `usuario_eliminado_{id}@eliminado.local` (único, no funcional) |
| `password_hash` | Eliminado / reemplazado con hash inválido |
| `nombre`        | `[eliminado]`                 |
| `apellido`      | `[eliminado]`                 |
| `telefono`      | `null`                        |
| `foto_perfil`   | `null`                        |
| `refresh_tokens`| Todos revocados               |

### Datos anonimizados (preservados para auditoría)

| Tabla      | Campo        | Acción                                      |
|------------|--------------|---------------------------------------------|
| `pedidos`  | `usuario_id` | Se mantiene la referencia (foreign key)      |
| `pedidos`  | —            | Se registra como `[usuario_eliminado_{id}]`  |
| `direcciones` | —         | Eliminadas completamente                    |

### Paso a paso en la transacción

```sql
BEGIN TRANSACTION;

-- 1. Verificar contraseña y teléfono (en aplicación, no SQL)

-- 2. Revocar todos los tokens de refresh
DELETE FROM refresh_tokens WHERE usuario_id = :id;

-- 3. Eliminar direcciones
DELETE FROM direcciones WHERE usuario_id = :id;

-- 4. Anonimizar al usuario
UPDATE usuarios
SET
  email = CONCAT('usuario_eliminado_', :id, '@eliminado.local'),
  password_hash = 'ACCOUNT_DELETED',
  nombre = '[eliminado]',
  apellido = '[eliminado]',
  telefono = NULL,
  foto_perfil = NULL,
  cuenta_eliminada = TRUE,
  fecha_eliminacion = NOW()
WHERE id = :id;

-- 5. Registrar evento de auditoría
INSERT INTO auditoria_eliminaciones (usuario_id, timestamp, ip)
VALUES (:id, NOW(), :ip);

COMMIT;
```

---

## Validación de Seguridad en Servidor

1. **Autenticación**: El token JWT debe ser válido y no expirado.
2. **Autorización**: El `usuario_id` del token debe coincidir con el `:id` del path. Admins no pueden eliminar cuentas ajenas con este endpoint.
3. **Verificación de contraseña**: Hashear `password` con bcrypt y comparar contra `password_hash` almacenado.
4. **Verificación de teléfono**: Comparar `phoneNumber` contra el campo `telefono` almacenado (normalizado).
5. **Pedidos activos**: Rechazar si existen pedidos con estado `pendiente_pago`, `en_proceso`, o `en_camino`.

> **Nota**: Las validaciones de contraseña y teléfono son obligatorias en el servidor aunque el frontend también las valide. No confiar únicamente en la validación del cliente.

---

## Manejo de Errores del Frontend

El frontend interpreta las respuestas de error así:

| Código HTTP | Mensaje mostrado al usuario |
|-------------|-----------------------------|
| 400         | Datos inválidos             |
| 401         | Credenciales incorrectas    |
| 403         | Sin permiso                 |
| 404         | Usuario no encontrado       |
| 409         | Pedidos activos pendientes  |
| 5xx         | Error al eliminar la cuenta |

---

## Auditoría

Registrar en tabla `auditoria_eliminaciones` (sin datos personales):

```sql
CREATE TABLE auditoria_eliminaciones (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER NOT NULL,
  timestamp   TIMESTAMP NOT NULL DEFAULT NOW(),
  ip          VARCHAR(45),
  user_agent  TEXT
);
```

No almacenar nombre, email ni ningún otro dato personal en la auditoría.

---

## Idempotencia

Si el usuario con `id` ya fue eliminado (campo `cuenta_eliminada = TRUE`), responder con **404** limpio. No re-procesar la eliminación ni exponer información sobre el estado anterior de la cuenta.

---

## Flujo Completo

```
Frontend                            Backend
  │                                    │
  │── DELETE /api/usuarios/:id ────────▶│
  │   Body: { password, phoneNumber }  │
  │                                    │── Verificar JWT válido
  │                                    │── Verificar usuario_id == :id
  │                                    │── Verificar contraseña (bcrypt)
  │                                    │── Verificar teléfono
  │                                    │── Verificar sin pedidos activos
  │                                    │── BEGIN TRANSACTION
  │                                    │── Revocar tokens
  │                                    │── Eliminar direcciones
  │                                    │── Anonimizar usuario
  │                                    │── Registrar auditoría
  │                                    │── COMMIT
  │◀── 200 { success: true } ──────────│
  │                                    │
  │── logout() + redirect → /          │
```
