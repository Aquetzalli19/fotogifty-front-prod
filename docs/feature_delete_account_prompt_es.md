# Solicitud de Funcionalidad: Implementar Eliminación Segura de Cuenta de Usuario

## 🎯 Objetivo
Diseñar e implementar una funcionalidad segura y amigable que permita a los usuarios autenticados solicitar la **eliminación permanente de su propia cuenta**, sin afectar la integridad de los datos comerciales generados por ellos (por ejemplo, órdenes, transacciones, comentarios, etc.). La solución debe seguir las mejores prácticas de seguridad, experiencia de usuario y diseño de software.

## 🧩 Alcance y Requisitos

### Requisitos Funcionales
1. **Inicio por parte del usuario**:  
   - Un usuario autenticado puede solicitar la eliminación de su cuenta desde la interfaz (por ejemplo, en la sección de "Configuración" o "Privacidad").
2. **Flujo de confirmación**:  
   - Se debe requerir confirmación explícita (por ejemplo, volver a ingresar contraseña y numero de telefono) para evitar eliminaciones accidentales.
   - Mostrar un aviso claro explicando que:
     - La acción es **irreversible**.
     - La información personal será **eliminada permanentemente**.
     - **Los registros comerciales (como órdenes, pagos, logs)** **se conservarán** por motivos legales, financieros y operativos —pero la información personal asociada será anonimizada o desvinculada.
3. **Implementación Backend**:  
   - Crear un endpoint seguro (por ejemplo, `DELETE /api/v1/users/me`) que:
     - Valide la autenticación y propiedad de la cuenta.
     - Ejecute la lógica de eliminación/anonimización.
     - Devuelva códigos de estado y mensajes apropiados.
4. **Política de manejo de datos**:  
   - **Eliminar**: credenciales, perfil, preferencias, tokens de sesión.
   - **Conservar (pero anonimizar)**: órdenes, pagos, auditorías —reemplazando identificadores personales con `[usuario_eliminado_{id}]` o similar.
   - Cumplir con regulaciones como GDPR o CCPA ("derecho al olvido") si aplica.

### Requisitos No Funcionales
- **Seguridad**: Prevenir eliminaciones no autorizadas (protección CSRF, limitación de intentos, validación de autenticación).
- **Auditoría**: Registrar eventos de eliminación (quién, cuándo, IP) sin almacenar datos sensibles.
- **Experiencia de usuario**: Mensajes claros y empáticos; evitar puntos muertos; permitir cancelación antes de la confirmación final.
- **Idempotencia**: Solicitudes repetidas de eliminación deben ser manejadas sin errores.

## 📚 Entregables

### 1. Especificación Técnica (Backend)
Redactar un documento técnico conciso para el equipo backend que incluya:
- Contrato del API (método HTTP, ruta, encabezados, ejemplos de solicitud y respuesta).
- Cambios en el modelo de datos (si aplica).
- Estrategia de anonimización para registros conservados.
- Manejo de errores (por ejemplo: usuario no encontrado, ya eliminado).
- Consideraciones de seguridad.

### 2. Implementación de Referencia (Fragmentos de Código)
Proporcionar ejemplos de código limpios y listos para producción para:
- El endpoint de eliminación de cuenta (lenguaje/framework agnóstico o común, p. ej., Python/Django, Node.js/Express, etc.).
- Lógica de anonimización en base de datos (SQL o usando ORM).
- Flujo de confirmación (pseudo-código frontend o notas de integración).

### 3. Guía de Experiencia de Usuario (UX)
Describir patrones recomendados de interfaz y experiencia:
- Texto del modal de confirmación.
- Redirección posterior a la eliminación (por ejemplo, a inicio de sesión con cierre de sesión automático).
- Enlace de soporte en caso de eliminación accidental.

## ⚠️ Restricciones
- **No eliminar** historial de órdenes ni registros generados por el sistema vinculados al usuario.
- Mantener integridad referencial en la base de datos.
- Asumir que el sistema utiliza autenticación por correo electrónico/contraseña, opcionalmente con 2FA.

## 💡 Notas
- Piensa como un ingeniero de software senior con más de 10 años de experiencia: prioriza la corrección, mantenibilidad y confianza del usuario.
- Prefiere claridad sobre complejidad.
- En caso de duda, opta por la opción más segura (por ejemplo, borrado suave + anonimización en lugar de borrado físico).