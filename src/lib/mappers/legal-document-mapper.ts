import { LegalDocument, LegalDocumentDTO, LegalDocumentType } from "@/interfaces/legal-documents";

/**
 * Interfaz del documento legal tal como viene del backend (español)
 */
interface LegalDocumentBackend {
  id: number;
  tipo: LegalDocumentType;
  titulo: string;
  contenido: string;
  version: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

/**
 * Interfaz del DTO tal como se envía al backend (español)
 */
interface LegalDocumentDTOBackend {
  tipo: LegalDocumentType;
  titulo: string;
  contenido: string;
  version: string;
  activo?: boolean;
}

/**
 * Mapea un documento legal del backend (español) al formato del frontend (inglés)
 */
export function mapBackendToLegalDocument(backend: LegalDocumentBackend): LegalDocument {
  return {
    id: backend.id,
    type: backend.tipo,
    title: backend.titulo,
    content: backend.contenido,
    version: backend.version,
    isActive: backend.activo,
    createdAt: backend.fecha_creacion,
    updatedAt: backend.fecha_actualizacion,
  };
}

/**
 * Mapea un array de documentos legales del backend al formato del frontend
 */
export function mapBackendToLegalDocuments(backendDocs: LegalDocumentBackend[]): LegalDocument[] {
  return backendDocs.map(mapBackendToLegalDocument);
}

/**
 * Mapea un DTO del frontend (inglés) al formato del backend (español)
 */
export function mapLegalDocumentDTOToBackend(dto: LegalDocumentDTO): LegalDocumentDTOBackend {
  return {
    tipo: dto.type,
    titulo: dto.title,
    contenido: dto.content,
    version: dto.version,
    activo: dto.isActive,
  };
}

/**
 * Mapea un DTO parcial del frontend al formato del backend (para actualizaciones)
 */
export function mapPartialLegalDocumentDTOToBackend(
  dto: Partial<LegalDocumentDTO>
): Partial<LegalDocumentDTOBackend> {
  const backend: Partial<LegalDocumentDTOBackend> = {};

  if (dto.type !== undefined) backend.tipo = dto.type;
  if (dto.title !== undefined) backend.titulo = dto.title;
  if (dto.content !== undefined) backend.contenido = dto.content;
  if (dto.version !== undefined) backend.version = dto.version;
  if (dto.isActive !== undefined) backend.activo = dto.isActive;

  return backend;
}
