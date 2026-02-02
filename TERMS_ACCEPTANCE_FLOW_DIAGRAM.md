# Diagrama de Flujos - Sistema de Aceptación de Términos

## Flujo 1: Usuario Nuevo Se Registra

```
┌─────────────┐
│   Usuario   │
│ llena form  │
│  de signup  │
└──────┬──────┘
       │
       │ Marca checkbox "Acepto términos v2.0.0"
       ▼
┌─────────────────────┐
│   Frontend carga    │
│  términos activos   │───► GET /api/legal-documents/active/terms
│   al montar form    │
└──────┬──────────────┘
       │
       │ Muestra versión en el checkbox
       ▼
┌─────────────────────┐
│ Usuario hace clic   │
│  en "Registrarse"   │
└──────┬──────────────┘
       │
       │ POST /api/usuarios
       ▼
┌─────────────────────────────────────┐
│          Backend                    │
│                                     │
│  1. Crear usuario en tabla usuarios│
│                                     │
│  2. Obtener documento activo:       │
│     SELECT * FROM documentos_legales│
│     WHERE type = 'terms'            │
│     AND is_active = TRUE            │
│                                     │
│  3. Insertar aceptación:            │
│     INSERT INTO aceptaciones_terminos│
│     (id_usuario, id_documento_legal,│
│      version, fecha_aceptacion)     │
│     VALUES (42, 5, '2.0.0', NOW())  │
└──────┬──────────────────────────────┘
       │
       │ Response: { usuario: {...}, token: "..." }
       ▼
┌─────────────────────┐
│  Frontend guarda    │
│  token y redirige   │───► /user (catálogo)
│   a página usuario  │
└─────────────────────┘

✅ Usuario puede hacer pedidos inmediatamente
```

---

## Flujo 2: Usuario Existente Intenta Checkout (Términos Desactualizados)

```
┌─────────────┐
│   Usuario   │
│ agrega items│
│  al carrito │
└──────┬──────┘
       │
       │ Navega a /user/cart
       ▼
┌─────────────────────┐
│  Frontend carga     │
│   carrito normal    │
└──────┬──────────────┘
       │
       │ Usuario hace clic "Proceder al pago"
       ▼
┌─────────────────────────────────────┐
│  handleCheckout() ejecuta           │
│                                     │
│  1. await checkTermsStatus()        │───► GET /api/usuarios/42/terms-status
│                                     │
└──────┬──────────────────────────────┘
       │
       │ Backend consulta:
       │ - Versión actual: "2.0.0"
       │ - Versión usuario: "1.0.0"
       │
       │ Response: { needsAcceptance: true, ... }
       ▼
┌─────────────────────────────────────┐
│  Frontend detecta términos          │
│  pendientes                         │
│                                     │
│  if (needsAcceptance) {             │
│    setShowModal(true);              │
│    return; // Detener checkout      │
│  }                                  │
└──────┬──────────────────────────────┘
       │
       │ Modal bloqueante se muestra
       ▼
┌─────────────────────────────────────┐
│  TermsAcceptanceModal               │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Nuevos Términos y Condiciones │  │
│  │                               │  │
│  │ Versión anterior: 1.0.0       │  │
│  │ Nueva versión: 2.0.0          │  │
│  │                               │  │
│  │ [Contenido scrollable...]     │  │
│  │                               │  │
│  │ ☑ He leído y acepto           │  │
│  │                               │  │
│  │ [Aceptar] (habilitado)        │  │
│  └───────────────────────────────┘  │
└──────┬──────────────────────────────┘
       │
       │ Usuario scrollea, marca checkbox, acepta
       ▼
┌─────────────────────────────────────┐
│  handleAcceptTerms()                │
│                                     │───► POST /api/usuarios/42/accept-terms
│  await acceptTerms()                │     { id_documento_legal: 5, version: "2.0.0" }
│                                     │
└──────┬──────────────────────────────┘
       │
       │ Backend inserta:
       │ INSERT INTO aceptaciones_terminos
       │ VALUES (42, 5, '2.0.0', NOW())
       │
       │ Response: { success: true }
       ▼
┌─────────────────────────────────────┐
│  Modal se cierra                    │
│  setShowModal(false);               │
│                                     │
│  Reintentar checkout:               │
│  await handleCheckout();            │───► POST /api/checkout (ahora exitoso)
└──────┬──────────────────────────────┘
       │
       │ Checkout procede normalmente
       ▼
┌─────────────────────┐
│  Redirige a Stripe  │
│   Checkout Page     │
└─────────────────────┘

✅ Pago completado
```

---

## Flujo 3: Backend Bloquea Checkout (Doble Validación)

```
┌─────────────┐
│   Usuario   │
│ hace clic   │
│"Proceder"   │
└──────┬──────┘
       │
       │ Frontend NO verificó términos (error/bug)
       ▼
┌─────────────────────────────────────┐
│  handleCheckout()                   │
│                                     │───► POST /api/checkout
│  await crearSesionCheckout(...)     │     { id_usuario: 42, items: [...] }
└──────┬──────────────────────────────┘
       │
       │ Backend ejecuta validación:
       ▼
┌─────────────────────────────────────────────────┐
│  crearSesionCheckout()                          │
│                                                 │
│  // Validar términos ANTES de crear sesión     │
│  const termsStatus = await getTermsStatus(42); │
│                                                 │
│  if (termsStatus.needsAcceptance) {            │
│    return res.status(403).json({               │
│      error: 'TERMS_NOT_ACCEPTED',              │
│      message: 'Debes aceptar los nuevos        │
│                términos...',                   │
│      data: {                                   │
│        currentVersion: '2.0.0',                │
│        userAcceptedVersion: '1.0.0'            │
│      }                                         │
│    });                                         │
│  }                                             │
│                                                 │
│  // Si OK, continuar con Stripe...             │
└──────┬──────────────────────────────────────────┘
       │
       │ Response 403 Forbidden
       ▼
┌─────────────────────────────────────┐
│  Frontend captura error             │
│                                     │
│  catch (error) {                    │
│    if (error.status === 403 &&      │
│        error.code === 'TERMS...')  {│
│      setShowModal(true); // Mostrar │
│    }                                │
│  }                                  │
└──────┬──────────────────────────────┘
       │
       │ Modal se muestra automáticamente
       ▼
┌─────────────────────┐
│  Usuario acepta     │
│  términos en modal  │───► (Flujo continúa igual que Flujo 2)
└─────────────────────┘

✅ Checkout bloqueado → Usuario acepta → Reintenta → Exitoso
```

---

## Flujo 4: Admin Actualiza Términos

```
┌─────────────┐
│    Admin    │
│ edita doc   │
│  legal #5   │
└──────┬──────┘
       │
       │ Modifica contenido de términos activos
       ▼
┌─────────────────────────────────────┐
│  PUT /api/legal-documents/5         │
│  {                                  │
│    content: "Nuevo contenido...",   │
│    title: "Términos v2.0"           │
│  }                                  │
└──────┬──────────────────────────────┘
       │
       │ Backend detecta cambio en documento activo
       ▼
┌─────────────────────────────────────────────────┐
│  actualizarDocumentoLegal()                     │
│                                                 │
│  const currentDoc = await db.query(             │
│    'SELECT * FROM documentos_legales            │
│     WHERE id = 5'                               │
│  );                                             │
│                                                 │
│  // Documento activo + contenido cambió        │
│  if (currentDoc.is_active &&                    │
│      body.content !== currentDoc.content) {    │
│                                                 │
│    // Auto-incrementar versión                 │
│    newVersion = incrementVersion(               │
│      currentDoc.version  // "1.0.0"            │
│    ); // → "1.1.0"                              │
│                                                 │
│    logger.info('Versión incrementada:           │
│                 1.0.0 → 1.1.0');                │
│  }                                              │
│                                                 │
│  await db.query('UPDATE documentos_legales      │
│                  SET version = ?, content = ?   │
│                  WHERE id = 5',                 │
│                  [newVersion, newContent]);     │
└──────┬──────────────────────────────────────────┘
       │
       │ Response: { success: true, version: "1.1.0" }
       ▼
┌─────────────────────────────────────┐
│  Frontend muestra confirmación      │
│  "Términos actualizados v1.1.0"     │
└─────────────────────────────────────┘

📢 EFECTO: Todos los usuarios con versión < 1.1.0
   necesitarán aceptar al intentar checkout

┌─────────────────────────────────────┐
│  Usuario existente (con v1.0.0)     │
│  intenta checkout                   │───► Modal se muestra (Flujo 2)
└─────────────────────────────────────┘
```

---

## Flujo 5: Verificación en Login (Opcional - UX Mejorada)

```
┌─────────────┐
│   Usuario   │
│ hace login  │
└──────┬──────┘
       │
       │ POST /api/auth/login
       ▼
┌─────────────────────────────────────┐
│  Backend retorna token + user       │
└──────┬──────────────────────────────┘
       │
       │ Frontend guarda auth y redirige a /user
       ▼
┌─────────────────────────────────────┐
│  useTermsAcceptance hook            │
│  (montado en ClientNavbar)          │
│                                     │
│  useEffect(() => {                  │
│    if (isAuthenticated && user) {   │
│      checkTermsStatus();            │───► GET /api/usuarios/42/terms-status
│    }                                │
│  }, [isAuthenticated]);             │
└──────┬──────────────────────────────┘
       │
       │ Response: { needsAcceptance: true }
       ▼
┌─────────────────────────────────────┐
│  TermsUpdateBanner se muestra       │
│                                     │
│  ┌────────────────────────────────┐ │
│  │ ⚠️ Hay nuevos términos y       │ │
│  │    condiciones disponibles.    │ │
│  │                                │ │
│  │ [Revisar ahora] [Cerrar]       │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘

Usuario puede:
1. [Revisar ahora] → Modal se muestra → Acepta
2. [Cerrar] → Banner desaparece (hasta próximo login)
3. Ignorar → Será forzado a aceptar en checkout de todas formas

✅ Notificación temprana sin bloquear navegación
```

---

## Estados del Sistema

### **Estado 1: Usuario con términos actualizados ✅**

```
┌──────────────────────────────────────┐
│ Tabla: aceptaciones_terminos         │
├──────────────────────────────────────┤
│ id_usuario │ version │ fecha         │
├────────────┼─────────┼───────────────┤
│ 42         │ 2.0.0   │ 2025-02-02... │
└────────────┴─────────┴───────────────┘

┌──────────────────────────────────────┐
│ Tabla: documentos_legales (activo)   │
├──────────────────────────────────────┤
│ id │ version │ is_active             │
├────┼─────────┼───────────────────────┤
│ 5  │ 2.0.0   │ TRUE                  │
└────┴─────────┴───────────────────────┘

GET /api/usuarios/42/terms-status
↓
{
  "needsAcceptance": false,  ✅
  "currentVersion": "2.0.0",
  "userAcceptedVersion": "2.0.0"
}

Checkout: ✅ PERMITIDO
```

### **Estado 2: Usuario con términos desactualizados ⚠️**

```
┌──────────────────────────────────────┐
│ Tabla: aceptaciones_terminos         │
├──────────────────────────────────────┤
│ id_usuario │ version │ fecha         │
├────────────┼─────────┼───────────────┤
│ 42         │ 1.0.0   │ 2025-01-15... │
└────────────┴─────────┴───────────────┘

┌──────────────────────────────────────┐
│ Tabla: documentos_legales (activo)   │
├──────────────────────────────────────┤
│ id │ version │ is_active             │
├────┼─────────┼───────────────────────┤
│ 5  │ 2.0.0   │ TRUE                  │
└────┴─────────┴───────────────────────┘

GET /api/usuarios/42/terms-status
↓
{
  "needsAcceptance": true,  ⚠️
  "currentVersion": "2.0.0",
  "userAcceptedVersion": "1.0.0"
}

Checkout: ❌ BLOQUEADO → Modal se muestra
```

### **Estado 3: Usuario nunca aceptó términos ❌**

```
┌──────────────────────────────────────┐
│ Tabla: aceptaciones_terminos         │
├──────────────────────────────────────┤
│ (vacío - sin registros para user 42) │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Tabla: documentos_legales (activo)   │
├──────────────────────────────────────┤
│ id │ version │ is_active             │
├────┼─────────┼───────────────────────┤
│ 5  │ 2.0.0   │ TRUE                  │
└────┴─────────┴───────────────────────┘

GET /api/usuarios/42/terms-status
↓
{
  "needsAcceptance": true,  ❌
  "currentVersion": "2.0.0",
  "userAcceptedVersion": null
}

Checkout: ❌ BLOQUEADO → Modal se muestra
```

---

## Ejemplo de Código Completo

### **Frontend - Hook useTermsAcceptance**

```typescript
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import {
  verificarEstadoTerminos,
  aceptarTerminos,
  TermsAcceptanceStatus,
} from '@/services/terms-acceptance';

export function useTermsAcceptance() {
  const { user, isAuthenticated } = useAuthStore();
  const [termsStatus, setTermsStatus] = useState<TermsAcceptanceStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const checkTermsStatus = async () => {
    if (!user?.id) return;

    setIsChecking(true);
    try {
      const response = await verificarEstadoTerminos(user.id);
      if (response.success && response.data) {
        setTermsStatus(response.data);
      }
    } catch (error) {
      console.error('Error verificando términos:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const acceptTerms = async () => {
    if (!user?.id || !termsStatus?.termsDocument) {
      throw new Error('Datos de términos no disponibles');
    }

    const response = await aceptarTerminos({
      id_usuario: user.id,
      id_documento_legal: termsStatus.termsDocument.id,
      version: termsStatus.termsDocument.version,
    });

    if (!response.success) {
      throw new Error(response.error || 'Error al aceptar términos');
    }

    // Actualizar estado local
    setTermsStatus(prev => prev ? {
      ...prev,
      needsAcceptance: false,
      userAcceptedVersion: prev.currentVersion,
    } : null);
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      checkTermsStatus();
    }
  }, [isAuthenticated, user?.id]);

  return {
    termsStatus,
    needsAcceptance: termsStatus?.needsAcceptance ?? false,
    isChecking,
    showModal,
    setShowModal,
    checkTermsStatus,
    acceptTerms,
  };
}
```

### **Backend - Endpoint terms-status**

```javascript
// GET /api/usuarios/:id/terms-status
router.get('/usuarios/:id/terms-status', authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Verificar autorización
    if (req.user.id !== userId && req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'No tienes permiso para ver este recurso',
      });
    }

    // 1. Obtener usuario
    const user = await db.query('SELECT id FROM usuarios WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'Usuario no encontrado',
      });
    }

    // 2. Obtener documento legal activo tipo "terms"
    const activeTerms = await db.query(
      `SELECT * FROM documentos_legales
       WHERE type = 'terms' AND is_active = TRUE
       ORDER BY created_at DESC
       LIMIT 1`
    );

    if (!activeTerms) {
      // No hay términos configurados
      return res.json({
        success: true,
        data: {
          needsAcceptance: false,
          currentVersion: null,
          userAcceptedVersion: null,
        },
      });
    }

    // 3. Buscar última aceptación del usuario
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

    return res.json({
      success: true,
      data: {
        needsAcceptance,
        currentVersion: activeTerms.version,
        currentDocumentId: activeTerms.id,
        userAcceptedVersion: userAcceptance?.version || null,
        userAcceptedDate: userAcceptance?.fecha_aceptacion || null,
        termsDocument: activeTerms,
      },
    });
  } catch (error) {
    console.error('Error en terms-status:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Error al verificar estado de términos',
    });
  }
});
```

---

## Resumen Visual

```
┌────────────────────────────────────────────────────────────┐
│                   SISTEMA DE TÉRMINOS                      │
└────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Usuario    │      │   Frontend   │      │   Backend    │
│              │      │              │      │              │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       │ Intenta checkout    │                     │
       │────────────────────►│                     │
       │                     │                     │
       │                     │ Verificar términos  │
       │                     │────────────────────►│
       │                     │                     │
       │                     │ needsAcceptance:true│
       │                     │◄────────────────────│
       │                     │                     │
       │ Modal bloqueante    │                     │
       │◄────────────────────│                     │
       │                     │                     │
       │ Acepta términos     │                     │
       │────────────────────►│                     │
       │                     │                     │
       │                     │ Registrar aceptación│
       │                     │────────────────────►│
       │                     │                     │
       │                     │ Insertar en BD      │
       │                     │     ✅ Success      │
       │                     │◄────────────────────│
       │                     │                     │
       │ Cierra modal        │                     │
       │◄────────────────────│                     │
       │                     │                     │
       │ Reintenta checkout  │                     │
       │────────────────────►│ POST /checkout      │
       │                     │────────────────────►│
       │                     │                     │
       │                     │ Validar términos ✅ │
       │                     │ Crear sesión Stripe │
       │                     │◄────────────────────│
       │                     │                     │
       │ Redirige a Stripe   │                     │
       │◄────────────────────│                     │
       │                     │                     │
```

---

## Consideraciones Finales

### **¿Qué pasa si hay múltiples documentos legales?**

El sistema está diseñado para manejar múltiples tipos de documentos:
- `type: 'terms'` → Términos y Condiciones
- `type: 'privacy'` → Política de Privacidad

Puedes validar ambos por separado o juntos:

```typescript
// Validar solo términos (actual)
const termsStatus = await verificarEstadoTerminos(userId);

// Futuro: Validar términos Y privacidad
const termsOK = await verificarEstadoTerminos(userId);
const privacyOK = await verificarEstadoPrivacidad(userId);

if (!termsOK || !privacyOK) {
  // Mostrar modal con AMBOS documentos
}
```

### **¿Qué pasa con usuarios muy antiguos sin aceptaciones registradas?**

**Escenario**: Usuario creado antes de implementar el sistema.

**Solución**: Migración de datos (ver `BACKEND_TERMS_IMPLEMENTATION_GUIDE.md`):
```sql
-- Asignar versión "1.0.0" legacy a todos los usuarios antiguos
INSERT INTO aceptaciones_terminos (id_usuario, id_documento_legal, version)
SELECT u.id, (SELECT id FROM documentos_legales WHERE type='terms' LIMIT 1), '1.0.0'
FROM usuarios u
WHERE u.created_at < '2025-02-01' AND u.acepto_terminos = TRUE;
```

Luego, cuando actualices a versión "2.0.0", todos verán el modal.
