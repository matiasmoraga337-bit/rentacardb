import { apiFetch, setToken } from '@/lib/api';

export interface Usuario {
  id: number;
  email: string;
  emailConfirmado: boolean;
  nombres: string;
  apellidoPaterno: string | null;
  roles: string[];
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}

export async function login(email: string, password: string): Promise<Sesion> {
  const sesion = await apiFetch<Sesion>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(sesion.token);
  return sesion;
}

export async function me(): Promise<Usuario> {
  return apiFetch<Usuario>('/auth/me');
}

export function logout(): void {
  setToken(null);
}

export interface Perfil {
  id: number;
  rut: string;
  nombres: string;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  telefono: string | null;
  email: string;
  emailConfirmado: boolean;
  roles?: string[];
}

export interface PerfilUpdate {
  nombres?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  telefono?: string;
}

export async function verificarEmail(token: string): Promise<void> {
  await apiFetch('/auth/verificar-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function recuperar(email: string): Promise<string> {
  const result = await apiFetch<{ message: string }>('/auth/recuperar', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  return result.message;
}

export async function confirmarReset(token: string, password: string): Promise<void> {
  await apiFetch('/auth/recuperar/confirmar', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

export async function fetchPerfil(): Promise<Perfil> {
  return apiFetch<Perfil>('/auth/me');
}

export async function actualizarPerfil(data: PerfilUpdate): Promise<Perfil> {
  return apiFetch<Perfil>('/usuarios/perfil', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
