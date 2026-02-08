# Sistema de Notificación de Modificación de Términos y Condiciones

## Objetivo

Implementar un sistema que:
1. **Detecte cuando los términos y condiciones fueron modificados**
2. **Bloquee a los usuarios que no han aceptado la nueva versión**
3. **Fuerce la aceptación antes de permitir realizar pedidos**
4. **Registre qué versión aceptó cada usuario y cuándo**

---

## Arquitectura del Sistema

### División de Responsabilidades Backend/Frontend

#### **Backend - Responsabilidades**

1. **Gestión de Versiones de Documentos Legales**
   - Mantener historial completo de todas las versiones
   - Determinar cuál es la versión "activa" actual
   - Auto-incrementar versión cuando se edita un documento activo

2. **Registro de Aceptaciones**
   - Tabla `aceptaciones_terminos` que relaciona:
     - Usuario (id_usuario)
     - Documento legal (id_documento_legal)
     - Versión aceptada (version)
     - Fecha de aceptación (fecha_aceptacion)
   - Endpoint para registrar aceptación de términos

3. **Validación en Endpoints Críticos**
   - **POST /checkout**: Validar que el usuario tenga términos actuales aceptados
   - **POST /pedidos**: Validar que el usuario tenga términos actuales aceptados
   - Retornar error 403 con información de términos pendientes si no están aceptados

4. **Consulta de Estado de Aceptación**
   - Endpoint para verificar si un usuario tiene términos pendientes
   - Retornar versión actual vs versión aceptada por el usuario

#### **Frontend - Responsabilidades**

1. **Verificación en Puntos Clave**
   - Al cargar el carrito (paso de checkout)
   - Al intentar proceder al pago
   - Opcionalmente: Al login (para mostrar notificación temprana)

2. **Modal de Aceptación de Términos**
   - Mostrar términos actualizados completos
   - Resaltar que son "Nuevos Términos" si hay cambios
   - Botón para aceptar (con validación de scroll completo)
   - NO permitir cerrar el modal sin aceptar si el usuario está en checkout

3. **Manejo de Errores de Checkout**
   - Si el backend retorna error 403 por términos pendientes
   - Mostrar modal de términos automáticamente
   - Reintentar checkout después de aceptar

4. **Persistencia Local (Opcional)**
   - Cachear en localStorage la última versión vista
   - Evitar checks redundantes si ya se verificó en la sesión actual

---

## Plan de Trabajo para FRONTEND

### **Fase 1: Interfaces y Servicios**

**Archivos a crear/modificar:**

1. **`src/interfaces/terms-acceptance.ts`** (NUEVO)
   ```typescript
   export interface TermsAcceptanceStatus {
     needsAcceptance: boolean; // Si el usuario necesita aceptar términos
     currentVersion: string; // Versión actual de términos
     userAcceptedVersion: string | null; // Última versión aceptada por el usuario
     termsDocument: {
       id: number;
       title: string;
       content: string;
       version: string;
       type: 'terms' | 'privacy';
     } | null;
   }

   export interface AcceptTermsRequest {
     id_usuario: number;
     id_documento_legal: number;
     version: string;
   }
   ```

2. **`src/services/terms-acceptance.ts`** (NUEVO)
   ```typescript
   // Verificar si el usuario tiene términos pendientes
   export async function verificarEstadoTerminos(userId: number): Promise<TermsAcceptanceStatus>

   // Registrar aceptación de términos
   export async function aceptarTerminos(data: AcceptTermsRequest): Promise<ApiResponse>

   // Obtener términos activos con estado de aceptación del usuario
   export async function obtenerTerminosConEstado(userId: number): Promise<TermsAcceptanceStatus>
   ```

### **Fase 2: Modal de Aceptación de Términos**

**Archivos a crear:**

3. **`src/components/legal/TermsAcceptanceModal.tsx`** (NUEVO)

   **Características:**
   - Modal fullscreen en móvil, centrado en desktop
   - Título: "Nuevos Términos y Condiciones" (si hay cambios)
   - Mostrar versión anterior y nueva
   - Contenido scrollable con detección de scroll completo
   - Checkbox "He leído y acepto los nuevos términos"
   - Botón "Aceptar" solo habilitado si:
     - Scrolleó hasta el final
     - Marcó el checkbox
   - Props:
     ```typescript
     interface TermsAcceptanceModalProps {
       isOpen: boolean;
       onAccept: () => Promise<void>;
       onCancel?: () => void; // Solo si no está bloqueando checkout
       termsDocument: LegalDocument;
       previousVersion: string | null;
       isBlocking?: boolean; // Si true, no permite cerrar sin aceptar
     }
     ```

### **Fase 3: Hook de Verificación**

**Archivos a crear:**

4. **`src/hooks/useTermsAcceptance.ts`** (NUEVO)

   ```typescript
   export function useTermsAcceptance() {
     const { user, isAuthenticated } = useAuthStore();
     const [termsStatus, setTermsStatus] = useState<TermsAcceptanceStatus | null>(null);
     const [isChecking, setIsChecking] = useState(false);
     const [showModal, setShowModal] = useState(false);

     // Verificar estado de términos
     const checkTermsStatus = async () => { ... }

     // Aceptar términos
     const acceptTerms = async () => { ... }

     // Auto-verificar al montar si el usuario está autenticado
     useEffect(() => {
       if (isAuthenticated && user) {
         checkTermsStatus();
       }
     }, [isAuthenticated, user]);

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

### **Fase 4: Integración en Carrito/Checkout**

**Archivos a modificar:**

5. **`src/app/user/cart/page.tsx`** (MODIFICAR)

   **Cambios:**
   ```typescript
   // Importar hook y modal
   import { useTermsAcceptance } from '@/hooks/useTermsAcceptance';
   import TermsAcceptanceModal from '@/components/legal/TermsAcceptanceModal';

   // Dentro del componente
   const {
     needsAcceptance,
     termsStatus,
     showModal,
     setShowModal,
     acceptTerms,
     checkTermsStatus,
   } = useTermsAcceptance();

   // Verificar términos antes de checkout
   const handleCheckout = async () => {
     // 1. Verificar términos ANTES de proceder
     await checkTermsStatus();

     if (needsAcceptance) {
       setShowModal(true);
       return; // Detener checkout
     }

     // 2. Si todo OK, proceder con checkout normal
     try {
       const response = await crearSesionCheckout({ ... });
       // ...
     } catch (error) {
       // 3. Manejar error 403 de términos pendientes
       if (error.status === 403 && error.code === 'TERMS_NOT_ACCEPTED') {
         setShowModal(true);
       } else {
         setCheckoutError(error.message);
       }
     }
   };

   // Callback al aceptar términos
   const handleAcceptTerms = async () => {
     await acceptTerms();
     setShowModal(false);
     // Reintentar checkout
     await handleCheckout();
   };

   // Renderizar modal
   return (
     <>
       {/* ... código existente ... */}

       <TermsAcceptanceModal
         isOpen={showModal}
         onAccept={handleAcceptTerms}
         termsDocument={termsStatus?.termsDocument}
         previousVersion={termsStatus?.userAcceptedVersion}
         isBlocking={true} // No permitir cerrar durante checkout
       />
     </>
   );
   ```

### **Fase 5: Integración en Signup** (Guardar versión aceptada)

**Archivos a modificar:**

6. **`src/app/(presentation)/signup/page.tsx`** (MODIFICAR)

   **Cambios:**
   ```typescript
   // Cargar términos activos al montar
   const [activeTerms, setActiveTerms] = useState<LegalDocument | null>(null);

   useEffect(() => {
     async function loadActiveTerms() {
       const response = await obtenerDocumentoLegalActivo('terms');
       if (response.success && response.data) {
         setActiveTerms(response.data);
       }
     }
     loadActiveTerms();
   }, []);

   // Al registrar usuario
   const onSubmit = async (values: SignupFormValues) => {
     // ... registro normal ...

     // DESPUÉS de crear usuario, registrar aceptación de términos
     if (activeTerms && response.success && response.data?.usuario?.id) {
       await aceptarTerminos({
         id_usuario: response.data.usuario.id,
         id_documento_legal: activeTerms.id,
         version: activeTerms.version,
       });
     }
   };

   // Mostrar versión de términos aceptados
   <FormLabel>
     Acepto los{" "}
     <Link href="/terms" target="_blank">
       Términos y Condiciones
     </Link>
     {activeTerms && (
       <span className="text-xs text-muted-foreground ml-1">
         (Versión {activeTerms.version})
       </span>
     )}
   </FormLabel>
   ```

### **Fase 6: Notificación Opcional al Login** (UX Mejorada)

**Archivos a crear/modificar:**

7. **`src/components/legal/TermsUpdateBanner.tsx`** (NUEVO - OPCIONAL)

   Banner no-bloqueante que se muestra en el navbar o dashboard:
   ```typescript
   // Banner que se puede cerrar temporalmente
   // Aparece en la parte superior de la página
   // "Hay nuevos términos y condiciones. Por favor revísalos."
   // Botón "Revisar ahora" o "Cerrar"
   ```

8. **Integrar en `src/components/user/ClientNavbar.tsx`** (MODIFICAR - OPCIONAL)
   ```typescript
   const { needsAcceptance } = useTermsAcceptance();

   return (
     <>
       {needsAcceptance && <TermsUpdateBanner />}
       {/* ... navbar normal ... */}
     </>
   );
   ```

---

## Casos de Uso y Flujos

### **Caso 1: Usuario existente intenta hacer checkout con términos desactualizados**

1. Usuario agrega productos al carrito
2. Hace clic en "Proceder al pago"
3. Frontend verifica términos con `verificarEstadoTerminos(userId)`
4. Backend retorna: `{ needsAcceptance: true, currentVersion: "2.0", userAcceptedVersion: "1.0" }`
5. Frontend muestra modal bloqueante con nuevos términos
6. Usuario lee y acepta
7. Frontend llama `aceptarTerminos()`
8. Backend registra aceptación en tabla `aceptaciones_terminos`
9. Modal se cierra y checkout continúa normalmente

### **Caso 2: Backend bloquea checkout por términos pendientes**

1. Usuario intenta checkout sin verificación previa
2. Backend recibe `POST /checkout`
3. Backend verifica que el usuario NO tiene la versión actual aceptada
4. Backend retorna `403 Forbidden` con:
   ```json
   {
     "success": false,
     "error": "TERMS_NOT_ACCEPTED",
     "message": "Debes aceptar los nuevos términos y condiciones",
     "data": {
       "currentVersion": "2.0",
       "userAcceptedVersion": "1.0"
     }
   }
   ```
5. Frontend captura el error 403
6. Muestra modal de términos automáticamente
7. Usuario acepta
8. Frontend reintenta checkout (ahora exitoso)

### **Caso 3: Nuevo usuario se registra**

1. Usuario llena formulario de registro
2. Marca checkbox "Acepto términos" (mostrando versión actual)
3. Backend crea usuario
4. Frontend registra aceptación de términos con versión actual
5. Usuario puede hacer pedidos inmediatamente

---

## Validaciones y Seguridad

### **Frontend**
- ✅ Verificar autenticación antes de verificar términos
- ✅ No permitir cerrar modal durante checkout
- ✅ Validar scroll completo antes de habilitar "Aceptar"
- ✅ Manejo de errores de red (retry automático)

### **Backend**
- ✅ Validar que el documento legal existe y está activo
- ✅ Validar que el usuario existe
- ✅ Validar en TODOS los endpoints críticos:
  - `POST /checkout`
  - `POST /pedidos`
  - Opcionalmente: `POST /carrito` (si se implementa)
- ✅ No permitir backdating (fecha_aceptacion = NOW())
- ✅ Logging de todas las aceptaciones para auditoría

---

## Estados de la UI

### **Loading States**
- Spinner mientras se verifica estado de términos
- Botón "Proceder al pago" deshabilitado durante verificación

### **Error States**
- Error de red al verificar términos → Mostrar mensaje con botón "Reintentar"
- Error al aceptar términos → Mostrar mensaje en modal

### **Success States**
- Toast: "Términos aceptados correctamente"
- Continuar con checkout automáticamente

---

## Testing Checklist

### **Casos a Probar**

- [ ] Usuario nuevo se registra → aceptación se guarda
- [ ] Usuario existente con términos desactualizados → modal se muestra
- [ ] Usuario acepta términos → puede proceder al checkout
- [ ] Usuario rechaza términos → checkout bloqueado
- [ ] Backend retorna 403 → frontend muestra modal
- [ ] Error de red al aceptar → manejo correcto
- [ ] Admin actualiza términos → todos los usuarios ven modal
- [ ] Usuario con términos aceptados → no ve modal
- [ ] Modal no se puede cerrar durante checkout
- [ ] Scroll completo requerido para aceptar

---

## Métricas y Monitoreo (Opcional)

- Tasa de aceptación de términos actualizados
- Tiempo promedio entre ver términos y aceptar
- Abandonos en el checkout por términos no aceptados
- Usuarios con términos desactualizados (para notificaciones proactivas)

---

## Notas de Implementación

### **Prioridades**

1. **Alta Prioridad** (Bloqueante):
   - Fase 1: Interfaces y servicios
   - Fase 2: Modal de aceptación
   - Fase 3: Hook de verificación
   - Fase 4: Integración en checkout
   - Fase 5: Integración en signup

2. **Media Prioridad** (UX mejorada):
   - Fase 6: Banner de notificación al login

3. **Baja Prioridad** (Opcional):
   - Analytics y métricas
   - Notificaciones por email de términos actualizados

### **Estimación de Tiempo**

- **Fase 1**: 1-2 horas
- **Fase 2**: 2-3 horas (diseño del modal)
- **Fase 3**: 1-2 horas
- **Fase 4**: 2-3 horas (integración y testing)
- **Fase 5**: 1 hora
- **Fase 6**: 1-2 horas (opcional)

**Total**: ~8-13 horas de desarrollo frontend

---

## Dependencias

### **Backend Debe Implementar Primero**

1. Tabla `aceptaciones_terminos`
2. Endpoint `GET /api/usuarios/:id/terms-status`
3. Endpoint `POST /api/usuarios/:id/accept-terms`
4. Validación en `POST /api/checkout`
5. Auto-versionado al editar documentos legales

Ver `BACKEND_TERMS_IMPLEMENTATION_GUIDE.md` para detalles.
