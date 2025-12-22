import { config } from './config';

/**
 * Respuesta estándar de la API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: Record<string, string>;
}

/**
 * Opciones para las peticiones HTTP
 */
interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

/**
 * Cliente HTTP configurado con la URL base de la API
 * Maneja automáticamente errores y parseo de respuestas
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Construye la URL completa con query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    return url.toString();
  }

  /**
   * Maneja la respuesta de la API
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');

    // Si la respuesta es JSON, parsearlo
    if (contentType?.includes('application/json')) {
      const data = await response.json();

      // Si la respuesta no es exitosa, lanzar error con el mensaje de la API
      if (!response.ok) {
        console.error('API Error Response:', data);
        const errorMessage = data.error || data.message || `Error ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      return data;
    }

    // Si no es JSON y no es exitosa, lanzar error genérico
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    // Respuesta exitosa sin JSON
    return { success: true } as ApiResponse<T>;
  }

  /**
   * Obtiene el token de autenticación del store o localStorage
   */
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      // Primero intentamos obtener del store de autenticación
      try {
        const authStore = require('@/stores/auth-store').useAuthStore;
        const token = authStore.getState().token;
        if (token) return token;
      } catch (e) {
        console.warn('Auth store not available');
      }
      
      // Si no está en el store, intentamos obtener del localStorage
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  /**
   * Agrega encabezados comunes a las peticiones
   */
  private addAuthHeader(headers: HeadersInit = {}): HeadersInit {
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    headers['Content-Type'] = 'application/json';
    return headers;
  }

  /**
   * Realiza una petición GET
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, options?.params);

    const response = await fetch(url, {
      method: 'GET',
      headers: this.addAuthHeader(options?.headers),
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Realiza una petición POST
   */
  async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, options?.params);

    const response = await fetch(url, {
      method: 'POST',
      headers: this.addAuthHeader(options?.headers),
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Realiza una petición PUT
   */
  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, options?.params);

    const response = await fetch(url, {
      method: 'PUT',
      headers: this.addAuthHeader(options?.headers),
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Realiza una petición PATCH
   */
  async patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, options?.params);

    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.addAuthHeader(options?.headers),
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Realiza una petición DELETE
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, options?.params);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.addAuthHeader(options?.headers),
      ...options,
    });

    return this.handleResponse<T>(response);
  }
}

/**
 * Instancia global del cliente API configurado con la URL base
 */
export const apiClient = new ApiClient(config.apiUrl);