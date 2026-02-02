/**
 * Interfaces para el sistema de aceptación de términos y condiciones
 */

import { LegalDocument } from './legal-documents';

/**
 * Respuesta del backend para estado de términos (formato real)
 */
export interface BackendTermsStatusItem {
  tipo: 'terms' | 'privacy';
  aceptado: boolean;
  version_actual: string;
  requiere_aceptacion: boolean;
  version_aceptada?: string | null;
  fecha_aceptacion?: string | null;
}

/**
 * Estado de aceptación de términos de un usuario (formato frontend)
 */
export interface TermsAcceptanceStatus {
  needsAcceptance: boolean; // Si el usuario necesita aceptar términos
  currentVersion: string; // Versión actual de términos
  currentDocumentId: number; // ID del documento actual
  userAcceptedVersion: string | null; // Última versión aceptada por el usuario
  userAcceptedDate: string | null; // Fecha de última aceptación
  termsDocument: LegalDocument | null; // Documento legal completo
}

/**
 * Request para aceptar términos
 */
export interface AcceptTermsRequest {
  tipo_documento: 'terms' | 'privacy'; // Tipo de documento legal a aceptar
}

/**
 * Response al aceptar términos
 */
export interface AcceptTermsResponse {
  id: number;
  id_usuario: number;
  id_documento_legal: number;
  version: string;
  fecha_aceptacion: string;
}
