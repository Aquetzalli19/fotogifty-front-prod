import { apiClient } from '@/lib/api-client';
import { AuthenticatedUser, Cliente, StoreUser, AdminUser } from '@/interfaces/users';

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
 * Respuesta de autenticación para clientes
 */
export interface ClienteAuthResponse {
  user: Cliente;
  token: string;
  expiresIn?: number;
}

/**
 * Respuesta de autenticación para stores
 */
export interface StoreAuthResponse {
  user: StoreUser;
  token: string;
  expiresIn?: number;
}

/**
 * Respuesta de autenticación para admins
 */
export interface AdminAuthResponse {
  user: AdminUser;
  token: string;
  expiresIn?: number;
}

/**
 * Respuesta genérica de autenticación
 */
export interface AuthResponse {
  user: AuthenticatedUser;
  token: string;
  expiresIn?: number;
}

/**
 * Login de cliente
 * @param credentials - Email y contraseña
 * @returns Datos del cliente autenticado y token
 */
export async function loginCliente(credentials: LoginDTO) {
  return apiClient.post<ClienteAuthResponse>('/auth/login/cliente', credentials);
}

/**
 * Login de administrador
 * @param credentials - Email y contraseña
 * @returns Datos del admin autenticado y token
 */
export async function loginAdmin(credentials: LoginDTO) {
  return apiClient.post<AdminAuthResponse>('/auth/login/admin', credentials);
}

/**
 * Login de store
 * @param credentials - Email y contraseña
 * @returns Datos del store autenticado y token
 */
export async function loginStore(credentials: LoginDTO) {
  return apiClient.post<StoreAuthResponse>('/auth/login/store', credentials);
}

/**
 * Obtener información del usuario autenticado
 * @returns Datos del usuario actual
 */
export async function obtenerUsuarioActual() {
  return apiClient.get<AuthenticatedUser>('/auth/me');
}

/**
 * Registro de nuevo administrador
 * @param data - Datos del administrador
 * @returns Datos del admin creado
 */
export async function registroAdmin(data: RegistroAdminDTO) {
  return apiClient.post<AdminUser>('/admin/registro', data);
}

/**
 * Datos para verificación de identidad (recuperación de contraseña)
 */
export interface VerifyIdentityDTO {
  email: string;
  telefono: string;
}

/**
 * Datos para cambio de contraseña
 */
export interface ResetPasswordDTO {
  email: string;
  telefono: string;
  nueva_password: string;
}

/**
 * Verificar identidad del usuario (email + teléfono)
 * @param data - Email y teléfono del usuario
 * @returns Confirmación de que los datos coinciden
 */
export async function verificarIdentidad(data: VerifyIdentityDTO) {
  return apiClient.post<{ success: boolean; message: string }>('/auth/verificar-identidad', data);
}

/**
 * Cambiar contraseña después de verificar identidad
 * @param data - Email, teléfono y nueva contraseña
 * @returns Confirmación del cambio
 */
export async function cambiarPasswordOlvidada(data: ResetPasswordDTO) {
  return apiClient.post<{ success: boolean; message: string }>('/auth/recuperar-password', data);
}
