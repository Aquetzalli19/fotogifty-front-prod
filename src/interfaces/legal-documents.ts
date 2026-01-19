/**
 * Tipos de documentos legales
 */
export type LegalDocumentType = 'terms' | 'privacy';

/**
 * Documento legal
 */
export interface LegalDocument {
  id: number;
  type: LegalDocumentType;
  title: string;
  content: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

/**
 * DTO para crear/actualizar documento legal
 */
export interface LegalDocumentDTO {
  type: LegalDocumentType;
  title: string;
  content: string;
  version: string;
  isActive?: boolean;
}
