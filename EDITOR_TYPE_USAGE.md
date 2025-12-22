# Guía de Uso: Editor Type

Esta guía explica cómo usar el sistema de detección automática de tipo de editor basado en categorías.

## Cómo Funciona

El sistema detecta automáticamente qué editor usar basándose en el nombre de la categoría (sin importar mayúsculas/minúsculas):

- **Categorías con "calendario" o "calendar"** → `editorType: 'calendar'`
- **Categorías con "polaroid"** → `editorType: 'polaroid'`
- **Otras categorías** → `editorType: 'standard'`

## Estructura de Datos

Todas las categorías ahora vienen dinámicamente desde la API, incluyendo Calendarios y Polaroids.

```typescript
// ProductSections ahora incluye editorType
interface ProductSections {
  productName: string;        // Ej: "Calendarios", "Polaroids", "Fotos Impresas"
  packages: ShopItem[];
  editorType?: EditorType;    // 'calendar' | 'polaroid' | 'standard'
}

// ShopItem también incluye editorType
interface ShopItem {
  id: number;
  name: string;
  // ... otros campos
  editorType?: EditorType;
}

// CartItem preserva el editorType
interface CartItem {
  id: number;
  productCategory: string;
  // ... otros campos
  editorType?: EditorType;
}
```

## Ejemplo de Uso en el Editor

Puedes usar el `editorType` para mostrar diferentes editores:

```typescript
// En tu componente de editor o checkout
import { useCartStore } from "@/stores/cart-store";
import { EditorType } from "@/lib/category-utils";

function EditorPage() {
  const items = useCartStore((state) => state.items);

  // Obtener el tipo de editor del primer item (o del item seleccionado)
  const currentItem = items[0];
  const editorType = currentItem?.editorType || 'standard';

  // Renderizar editor específico según el tipo
  return (
    <div>
      {editorType === 'calendar' && <CalendarEditor item={currentItem} />}
      {editorType === 'polaroid' && <PolaroidEditor item={currentItem} />}
      {editorType === 'standard' && <StandardEditor item={currentItem} />}
    </div>
  );
}
```

## Ejemplo de Uso en el Carrito

```typescript
// Mostrar información específica según el tipo de editor
function CartItem({ item }: { item: CartItem }) {
  const editorLabel = getEditorTypeLabel(item.editorType || 'standard');

  return (
    <div>
      <h3>{item.name}</h3>
      <p>Editor: {editorLabel}</p>
      {/* Mostrar información adicional según el tipo */}
      {item.editorType === 'calendar' && (
        <p>Requiere {item.numOfRequiredImages} fotos (una por mes)</p>
      )}
    </div>
  );
}
```

## Utilidades Disponibles

### `normalizeCategoryName(categoryName: string): string`
Normaliza el nombre de una categoría a minúsculas para comparaciones.

```typescript
normalizeCategoryName("Calendarios") // "calendarios"
normalizeCategoryName("POLAROID")    // "polaroid"
```

### `getEditorType(categoryName: string): EditorType`
Determina el tipo de editor basándose en el nombre de la categoría.

```typescript
getEditorType("Calendarios")      // 'calendar'
getEditorType("Polaroid Premium") // 'polaroid'
getEditorType("Fotos Impresas")   // 'standard'
```

### `getEditorTypeLabel(editorType: EditorType): string`
Obtiene una descripción legible del tipo de editor.

```typescript
getEditorTypeLabel('calendar')  // "Editor de Calendarios"
getEditorTypeLabel('polaroid')  // "Editor de Polaroids"
getEditorTypeLabel('standard')  // "Editor Estándar"
```

## Agregar Nuevos Tipos de Editor

Si necesitas agregar un nuevo tipo de editor:

1. **Actualiza el tipo `EditorType`** en `src/lib/category-utils.ts`:
```typescript
export type EditorType = 'calendar' | 'polaroid' | 'standard' | 'photobook';
```

2. **Actualiza la función `getEditorType()`**:
```typescript
export function getEditorType(categoryName: string): EditorType {
  const normalized = normalizeCategoryName(categoryName);

  if (normalized.includes('calendario') || normalized.includes('calendar')) {
    return 'calendar';
  }

  if (normalized.includes('polaroid')) {
    return 'polaroid';
  }

  if (normalized.includes('fotolibro') || normalized.includes('photobook')) {
    return 'photobook';
  }

  return 'standard';
}
```

3. **Actualiza `getEditorTypeLabel()`**:
```typescript
export function getEditorTypeLabel(editorType: EditorType): string {
  const labels: Record<EditorType, string> = {
    calendar: 'Editor de Calendarios',
    polaroid: 'Editor de Polaroids',
    photobook: 'Editor de Fotolibros',
    standard: 'Editor Estándar',
  };

  return labels[editorType];
}
```

## Creación de Categorías en el Backend

Para que el sistema funcione correctamente:

1. **Crea categorías con nombres descriptivos** en el panel de administración:
   - "Calendarios 2025"
   - "Polaroid Vintage"
   - "Fotos Impresas Premium"

2. **El sistema detectará automáticamente** el tipo de editor:
   - Cualquier categoría con "calendario" → Editor de calendarios
   - Cualquier categoría con "polaroid" → Editor de polaroids
   - Otras categorías → Editor estándar

3. **Case-insensitive**: "CALENDARIOS", "Calendarios", "calendarios" → todos detectados como 'calendar'

## Flujo Completo

1. **Admin crea una categoría** llamada "Calendarios Personalizados"
2. **Admin agrega paquetes** a esa categoría desde `/admin/addItem`
3. **El sistema detecta** que es tipo 'calendar' por el nombre
4. **Usuario ve los productos** con `editorType: 'calendar'`
5. **Usuario agrega al carrito** y el editorType se preserva
6. **Al editar**, el sistema muestra el editor de calendarios

## Notas Importantes

- ✅ **Todas las categorías son dinámicas** (obtenidas desde la API)
- ✅ **No hay mock data** en el flujo de producción
- ✅ **Detección case-insensitive** ("Calendario" = "calendario" = "CALENDARIO")
- ✅ **El editorType se preserva** en todo el flujo (ProductCard → Cart → Editor)
- ✅ **Fácil de extender** con nuevos tipos de editor

## Migración desde Mock Data

Si tenías datos mock para Calendarios y Polaroids:

1. **Crea esas categorías en el backend** con los mismos nombres
2. **Agrega los paquetes** correspondientes
3. **El sistema detectará automáticamente** el tipo de editor
4. **El frontend funcionará igual** sin cambios adicionales
