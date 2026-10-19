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
