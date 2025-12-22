/**
 * Tipos de editores disponibles según la categoría del producto
 */
export type EditorType = 'calendar' | 'polaroid' | 'standard';

/**
 * Normaliza el nombre de una categoría a minúsculas y sin espacios extra
 * para comparaciones consistentes
 */
export function normalizeCategoryName(categoryName: string): string {
  return categoryName.toLowerCase().trim();
}

/**
 * Determina qué tipo de editor usar basándose en el nombre de la categoría
 * @param categoryName - Nombre de la categoría (puede tener mayúsculas/minúsculas)
 * @returns El tipo de editor a usar
 */
export function getEditorType(categoryName: string): EditorType {
  const normalized = normalizeCategoryName(categoryName);

  // Detectar calendarios
  if (normalized.includes('calendario') || normalized.includes('calendar')) {
    return 'calendar';
  }

  // Detectar polaroids
  if (normalized.includes('polaroid')) {
    return 'polaroid';
  }

  // Editor estándar para todo lo demás
  return 'standard';
}

/**
 * Obtiene una descripción legible del tipo de editor
 */
export function getEditorTypeLabel(editorType: EditorType): string {
  const labels: Record<EditorType, string> = {
    calendar: 'Editor de Calendarios',
    polaroid: 'Editor de Polaroids',
    standard: 'Editor Estándar',
  };

  return labels[editorType];
}
