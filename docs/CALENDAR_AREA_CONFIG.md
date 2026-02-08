# 📐 Configuración del Área de Foto del Calendario

Este documento explica cómo modificar el área donde se coloca la foto en el editor de calendarios.

## 🎯 Ubicación del Código

**Archivo**: `src/components/editor-components/CalendarEditor.tsx`

**Líneas**: 70-81

## ⚙️ Configuración Actual

```typescript
// Porcentaje de altura que ocupa el área de la foto (0.52 = 52%)
const PHOTO_AREA_HEIGHT_PERCENT = 0.52; // ← MODIFICAR AQUÍ

// Posición del área de la foto (en porcentaje del tamaño total)
const PHOTO_AREA_TOP_PERCENT = 0;    // ← MODIFICAR AQUÍ
const PHOTO_AREA_LEFT_PERCENT = 0;   // ← MODIFICAR AQUÍ
const PHOTO_AREA_WIDTH_PERCENT = 1;  // ← MODIFICAR AQUÍ
```

## 📊 Ejemplos de Configuración

### Ejemplo 1: Área Superior 60% (actual es 52%)
```typescript
const PHOTO_AREA_HEIGHT_PERCENT = 0.60; // 60% de altura
const PHOTO_AREA_TOP_PERCENT = 0;
const PHOTO_AREA_LEFT_PERCENT = 0;
const PHOTO_AREA_WIDTH_PERCENT = 1;
```

### Ejemplo 2: Área Centrada con Márgenes
```typescript
const PHOTO_AREA_HEIGHT_PERCENT = 0.50; // 50% de altura
const PHOTO_AREA_TOP_PERCENT = 0.05;     // 5% margen superior
const PHOTO_AREA_LEFT_PERCENT = 0.05;    // 5% margen izquierdo
const PHOTO_AREA_WIDTH_PERCENT = 0.90;   // 90% de ancho (deja 10% de margen)
```

### Ejemplo 3: Área Inferior
```typescript
const PHOTO_AREA_HEIGHT_PERCENT = 0.48; // 48% de altura
const PHOTO_AREA_TOP_PERCENT = 0.52;     // Empieza al 52% desde arriba
const PHOTO_AREA_LEFT_PERCENT = 0;
const PHOTO_AREA_WIDTH_PERCENT = 1;
```

### Ejemplo 4: Área Pequeña Centrada
```typescript
const PHOTO_AREA_HEIGHT_PERCENT = 0.40; // 40% de altura
const PHOTO_AREA_TOP_PERCENT = 0.10;     // 10% desde arriba
const PHOTO_AREA_LEFT_PERCENT = 0.10;    // 10% desde izquierda
const PHOTO_AREA_WIDTH_PERCENT = 0.80;   // 80% del ancho
```

## 🔢 Valores Importantes

### Valores en Porcentaje (0.0 a 1.0)
- `0` = 0%
- `0.25` = 25%
- `0.5` = 50%
- `0.75` = 75%
- `1` = 100%

### Dimensiones del Calendario
Las dimensiones del calendario se obtienen **automáticamente del template cargado**:

```typescript
// Las dimensiones se detectan del template PNG cargado
// Los templates tienen dimensiones fijas: 2400px × 3600px
const [calendarDimensions, setCalendarDimensions] = useState({
  width: 2400,   // Se actualiza al cargar el template
  height: 3600   // Se actualiza al cargar el template
});
```

**Importante**: Las dimensiones del canvas son las del template, NO las del paquete. El paquete define el tamaño de impresión física (ej: 10"×15"), pero el canvas siempre usa las dimensiones del template PNG.

## 📋 Cómo Aplicar el Área

El área calculada se aplica en:
1. **Canvas principal**: Donde el usuario edita la foto
2. **Vista previa**: Miniatura en el panel de controles
3. **Calendario final**: Imagen que se envía al backend para impresión
4. **Marco de resaltado**: Guías visuales que muestran el área editable

## 🎨 Marco de Resaltado Visual

El área de la foto siempre se muestra con:
- **Borde blanco fino** (3px)
- **Esquinas marcadas** estilo cámara (100px de longitud)
- **Sombra interna sutil**

Estos elementos son **solo visuales** para ayudar al usuario y **NO se imprimen**.

## ⚠️ Importante

- Los valores DEBEN estar entre 0 y 1
- La suma de `PHOTO_AREA_TOP_PERCENT + PHOTO_AREA_HEIGHT_PERCENT` NO debe exceder 1.0
- La suma de `PHOTO_AREA_LEFT_PERCENT + PHOTO_AREA_WIDTH_PERCENT` NO debe exceder 1.0
- Los cambios aplican a TODOS los calendarios de TODOS los paquetes

## 🧪 Cómo Probar los Cambios

1. Modifica los valores en `CalendarEditor.tsx` (líneas 70-81)
2. Guarda el archivo
3. Abre el editor de calendario desde el carrito
4. Sube una imagen
5. Verifica que el área de la foto tenga el tamaño y posición correctos
6. Revisa la vista previa en el panel de controles

## 📝 Notas

- El área de la foto siempre mantiene la proporción del calendario
- El fondo blur cubre el 100% del área configurada
- El template del calendario se dibuja encima del área de foto
