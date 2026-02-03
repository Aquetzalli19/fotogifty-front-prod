/**
 * Utilidades para manejo seguro de datos de usuario
 *
 * Este módulo proporciona funciones para:
 * - Limpiar todos los datos de usuario al hacer logout
 * - Validar propiedad de datos al hacer login
 * - Asociar datos con el userId correcto
 */

import { useCartStore } from '@/stores/cart-store';
import { useCustomizationStore } from '@/stores/customization-store';
import { useCartStepStore } from '@/stores/cart-step-store';

// Claves de localStorage que contienen datos de usuario
const USER_DATA_STORAGE_KEYS = [
  'shopping-cart-storage-final',
  'customization-storage',
  'cart-step-storage',
  'user-data-owner', // Nueva clave para rastrear el dueño de los datos
] as const;

/**
 * Interfaz para los metadatos del propietario de los datos
 */
interface DataOwnerMetadata {
  userId: number;
  userEmail: string;
  timestamp: number;
}

/**
 * Obtiene el ID del usuario que es dueño de los datos actuales en localStorage
 */
export function getDataOwnerId(): number | null {
  if (typeof window === 'undefined') return null;

  try {
    const ownerData = localStorage.getItem('user-data-owner');
    if (!ownerData) return null;

    const parsed: DataOwnerMetadata = JSON.parse(ownerData);
    return parsed.userId;
  } catch {
    return null;
  }
}

/**
 * Establece el usuario actual como dueño de los datos en localStorage
 */
export function setDataOwner(userId: number, userEmail: string): void {
  if (typeof window === 'undefined') return;

  const metadata: DataOwnerMetadata = {
    userId,
    userEmail,
    timestamp: Date.now(),
  };

  localStorage.setItem('user-data-owner', JSON.stringify(metadata));
}

/**
 * Limpia todos los datos de usuario de localStorage y los stores de Zustand
 *
 * Esta función DEBE ser llamada en:
 * - Logout (obligatorio)
 * - Login cuando los datos pertenecen a otro usuario (obligatorio)
 * - Después de pago exitoso (opcional, ya se hace)
 */
export function clearAllUserData(): void {
  if (typeof window === 'undefined') return;

  console.log('🧹 Limpiando todos los datos de usuario...');

  // 1. Limpiar stores de Zustand
  try {
    useCartStore.getState().clearCart();
    console.log('  ✓ Cart store limpiado');
  } catch (e) {
    console.error('  ✗ Error limpiando cart store:', e);
  }

  try {
    useCustomizationStore.getState().clearAll();
    console.log('  ✓ Customization store limpiado');
  } catch (e) {
    console.error('  ✗ Error limpiando customization store:', e);
  }

  try {
    useCartStepStore.getState().resetStep();
    console.log('  ✓ Cart step store limpiado');
  } catch (e) {
    console.error('  ✗ Error limpiando cart step store:', e);
  }

  // 2. Limpiar localStorage directamente (por si acaso los stores no lo hacen)
  USER_DATA_STORAGE_KEYS.forEach(key => {
    try {
      localStorage.removeItem(key);
      console.log(`  ✓ localStorage "${key}" eliminado`);
    } catch (e) {
      console.error(`  ✗ Error eliminando "${key}":`, e);
    }
  });

  console.log('✅ Limpieza de datos de usuario completada');
}

/**
 * Valida si los datos actuales pertenecen al usuario que está iniciando sesión
 * Si pertenecen a otro usuario, los limpia automáticamente
 *
 * @param newUserId - ID del usuario que está iniciando sesión
 * @param newUserEmail - Email del usuario (para logging)
 * @returns true si los datos fueron limpiados, false si pertenecían al mismo usuario
 */
export function validateAndClearIfDifferentUser(
  newUserId: number,
  newUserEmail: string
): boolean {
  const currentOwnerId = getDataOwnerId();

  // Si no hay datos previos o no hay propietario registrado, establecer el nuevo
  if (currentOwnerId === null) {
    // Verificar si hay datos huérfanos (sin propietario registrado)
    const hasOrphanData = hasAnyUserData();
    if (hasOrphanData) {
      console.log('⚠️ Datos huérfanos detectados (sin propietario), limpiando...');
      clearAllUserData();
    }
    setDataOwner(newUserId, newUserEmail);
    return hasOrphanData;
  }

  // Si los datos pertenecen a otro usuario, limpiar
  if (currentOwnerId !== newUserId) {
    console.log(`🔒 Datos de otro usuario detectados (ID: ${currentOwnerId}), limpiando...`);
    clearAllUserData();
    setDataOwner(newUserId, newUserEmail);
    return true;
  }

  // Los datos pertenecen al mismo usuario, no limpiar
  console.log(`✓ Datos existentes pertenecen al usuario actual (ID: ${newUserId})`);
  return false;
}

/**
 * Verifica si hay algún dato de usuario en localStorage
 */
export function hasAnyUserData(): boolean {
  if (typeof window === 'undefined') return false;

  // Verificar si hay items en el carrito
  try {
    const cartData = localStorage.getItem('shopping-cart-storage-final');
    if (cartData) {
      const parsed = JSON.parse(cartData);
      if (parsed.state?.items?.length > 0) {
        return true;
      }
    }
  } catch {
    // Ignorar errores de parsing
  }

  // Verificar si hay customizaciones
  try {
    const customData = localStorage.getItem('customization-storage');
    if (customData) {
      const parsed = JSON.parse(customData);
      if (parsed.state?.customizations?.length > 0) {
        return true;
      }
    }
  } catch {
    // Ignorar errores de parsing
  }

  return false;
}

/**
 * Obtiene un resumen de los datos de usuario actuales (para debugging)
 */
export function getUserDataSummary(): {
  ownerId: number | null;
  cartItemsCount: number;
  customizationsCount: number;
  hasData: boolean;
} {
  if (typeof window === 'undefined') {
    return { ownerId: null, cartItemsCount: 0, customizationsCount: 0, hasData: false };
  }

  let cartItemsCount = 0;
  let customizationsCount = 0;

  try {
    const cartData = localStorage.getItem('shopping-cart-storage-final');
    if (cartData) {
      const parsed = JSON.parse(cartData);
      cartItemsCount = parsed.state?.items?.length || 0;
    }
  } catch {
    // Ignorar
  }

  try {
    const customData = localStorage.getItem('customization-storage');
    if (customData) {
      const parsed = JSON.parse(customData);
      customizationsCount = parsed.state?.customizations?.length || 0;
    }
  } catch {
    // Ignorar
  }

  return {
    ownerId: getDataOwnerId(),
    cartItemsCount,
    customizationsCount,
    hasData: cartItemsCount > 0 || customizationsCount > 0,
  };
}
