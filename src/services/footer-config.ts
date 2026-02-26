import { apiClient } from '@/lib/api-client';
import type { FooterConfig, SocialLink, SocialPlatform } from '@/interfaces/footer-config';

// Determinar la URL base según el entorno
const getBaseUrl = () => {
  // En el servidor (Server Components)
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  }
  // En el cliente (Client Components)
  return '/api'; // Usa el proxy de Next.js
};

// Helper para fetch directo (usado en Server Components)
async function serverFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}

// GET público - funciona en Server y Client Components
export async function obtenerFooterConfig(): Promise<FooterConfig> {
  // En el servidor, usar fetch directo
  if (typeof window === 'undefined') {
    return serverFetch<FooterConfig>('/footer/config');
  }
  // En el cliente, usar apiClient
  const response = await apiClient.get<FooterConfig>('/footer/config');
  // El backend devuelve el objeto directamente, sin ApiResponse wrapper
  return response as unknown as FooterConfig;
}

// Endpoints protegidos - solo para Client Components (admin panel)
export async function actualizarFooterConfig(data: {
  descripcion?: string | null;
  email?: string | null;
  telefono?: string | null;
}): Promise<FooterConfig> {
  const response = await apiClient.put<FooterConfig>('/footer/config', data);
  return response as unknown as FooterConfig;
}

export async function crearSocialLink(data: {
  plataforma: SocialPlatform;
  url: string;
  orden?: number;
  activo?: boolean;
}): Promise<SocialLink> {
  const response = await apiClient.post<SocialLink>('/footer/social-links', data);
  return response as unknown as SocialLink;
}

export async function actualizarSocialLink(
  id: number,
  data: {
    plataforma?: SocialPlatform;
    url?: string;
    orden?: number;
    activo?: boolean;
  }
): Promise<SocialLink> {
  const response = await apiClient.put<SocialLink>(`/footer/social-links/${id}`, data);
  return response as unknown as SocialLink;
}

export async function eliminarSocialLink(id: number): Promise<void> {
  await apiClient.delete(`/footer/social-links/${id}`);
}

export async function reordenarSocialLinks(ids: number[]): Promise<void> {
  // Asegurar que todos los IDs sean números válidos
  const numericIds = ids.map(id => Number(id)).filter(id => !isNaN(id) && id > 0);

  if (numericIds.length === 0) {
    throw new Error('No hay IDs válidos para reordenar');
  }

  await apiClient.put('/footer/social-links/reorder', { ids: numericIds });
}
