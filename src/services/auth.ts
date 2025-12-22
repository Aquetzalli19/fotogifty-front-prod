import { apiClient } from '@/lib/api-client';

/**
 * Servicio para autenticación
 * Basado en la API real documentada en Swagger
 */

/**
 * Datos de login
 */
export interface LoginDTO {
  email: string;
  password: string;
}

/**
 * Datos de registro de administrador
 */
export interface RegistroAdminDTO {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  tipo: 'admin' | 'super_admin';
}

/**
 * Respuesta de autenticación
 */
export interface UsuarioResponse {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  tipo?: 'admin' | 'super_admin' | 'cliente';
  activo?: boolean;
  fecha_creacion?: string;
  fecha_ultima_conexion?: string;
  // Agrega otros campos que retorne tu API
}

/**
 * Respuesta completa de autenticación
 */
export interface AuthResponse {
  user: Cliente;
  token: string;
}

/**
 * Login de cliente
 * @param credentials - Email y contraseña
 * @returns Datos del usuario autenticado y token
 */
export async function loginCliente(credentials: LoginDTO) {
  return apiClient.post<AuthResponse>('/auth/login/cliente', credentials);
}

/**
 * Login de administrador
 * @param credentials - Email y contraseña
 * @returns Datos del admin autenticado y token
 */
export async function loginAdmin(credentials: LoginDTO) {
  return apiClient.post<AuthResponse>('/auth/login/admin', credentials);
}

/**
 * Login de store
 * @param credentials - Email y contraseña
 * @returns Datos del store autenticado y token
 */
export async function loginStore(credentials: LoginDTO) {
  return apiClient.post<AuthResponse>('/auth/login/store', credentials);
}

/**
 * Obtener información del usuario autenticado
 * @returns Datos del usuario actual
 */
export async function obtenerUsuarioActual() {
  return apiClient.get<Cliente>('/auth/me');
}

/**
 * Registro de nuevo administrador
 * @param data - Datos del administrador
 * @returns Datos del admin creado
 */
export async function registroAdmin(data: RegistroAdminDTO) {
  return apiClient.post<UsuarioResponse>('/admin/registro', data);
}
