/**
 * Hook para gestionar la verificación y aceptación de términos y condiciones
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import {
  verificarEstadoTerminos,
  aceptarTerminos,
} from '@/services/terms-acceptance';
import { TermsAcceptanceStatus } from '@/interfaces/terms-acceptance';

export function useTermsAcceptance() {
  const { user, isAuthenticated } = useAuthStore();
  const [termsStatus, setTermsStatus] = useState<TermsAcceptanceStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Verificar estado de términos del usuario
   */
  const checkTermsStatus = useCallback(async () => {
    if (!user?.id) {
      console.warn('No se puede verificar términos: usuario no autenticado');
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const response = await verificarEstadoTerminos(user.id);

      if (response.success && response.data) {
        setTermsStatus(response.data);
        console.log('📋 Estado de términos:', response.data);
      } else {
        throw new Error(response.error || 'Error al verificar términos');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al verificar términos';
      setError(errorMessage);
      console.error('Error verificando términos:', err);
    } finally {
      setIsChecking(false);
    }
  }, [user?.id]);

  /**
   * Aceptar términos actuales
   */
  const acceptTerms = useCallback(async () => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    setIsAccepting(true);
    setError(null);

    try {
      const response = await aceptarTerminos(user.id, 'terms');

      if (!response.success) {
        throw new Error(response.error || 'Error al aceptar términos');
      }

      console.log('✅ Términos aceptados correctamente:', response.data);

      // Actualizar estado local para reflejar la aceptación
      setTermsStatus((prev) =>
        prev
          ? {
              ...prev,
              needsAcceptance: false,
              userAcceptedVersion: prev.currentVersion,
              userAcceptedDate: new Date().toISOString(),
            }
          : null
      );

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al aceptar términos';
      setError(errorMessage);
      console.error('Error aceptando términos:', err);
      throw err;
    } finally {
      setIsAccepting(false);
    }
  }, [user?.id]);

  /**
   * Reiniciar estado (útil para testing o cleanup)
   */
  const reset = useCallback(() => {
    setTermsStatus(null);
    setError(null);
    setShowModal(false);
  }, []);

  /**
   * Auto-verificar términos al montar si el usuario está autenticado
   * NO muestra el modal automáticamente, solo carga el estado
   */
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      checkTermsStatus();
    } else {
      // Limpiar estado si el usuario cierra sesión
      reset();
    }
  }, [isAuthenticated, user?.id, checkTermsStatus, reset]);

  return {
    // Estado
    termsStatus,
    needsAcceptance: termsStatus?.needsAcceptance ?? false,
    isChecking,
    isAccepting,
    error,

    // Control del modal
    showModal,
    setShowModal,

    // Acciones
    checkTermsStatus,
    acceptTerms,
    reset,
  };
}
