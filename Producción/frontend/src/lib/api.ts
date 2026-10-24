const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const API_ORIGIN = API_URL.startsWith('http') ? new URL(API_URL).origin : '';

const TOKEN_KEY = 'rentacardb_token';

export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let token: string | null = localStorage.getItem(TOKEN_KEY);

export function setToken(value: string | null): void {
  token = value;
  if (value) localStorage.setItem(TOKEN_KEY, value);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string | null {
  return token;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const error = (data as { error?: { code?: string; message?: string; details?: unknown } })
      ?.error;
    throw new ApiError(
      res.status,
      error?.code ?? 'ERROR',
      error?.message ?? 'Error inesperado.',
      error?.details,
    );
  }
  return data as T;
}
