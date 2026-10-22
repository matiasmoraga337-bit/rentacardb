import { apiFetch } from '@/lib/api';

export type EstadoNotificacion = 'PENDIENTE' | 'ENVIADA' | 'FALLIDA' | 'LEIDA';

export interface Notificacion {
  id: number;
  tipo: string;
  canal: string;
  destinatario: string;
  asunto: string | null;
  cuerpo: string | null;
  estado: EstadoNotificacion;
  fechaCreacion: string;
  fechaEnvio: string | null;
  fechaLectura: string | null;
  error: string | null;
}

export interface NotificacionesResponse {
  data: Notificacion[];
  page: number;
  pageSize: number;
  total: number;
}

export const fetchNotificaciones = (params: {
  estado?: EstadoNotificacion;
  page?: number;
  pageSize?: number;
} = {}): Promise<NotificacionesResponse> => {
  const qs = new URLSearchParams();
  if (params.estado) qs.set('estado', params.estado);
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  return apiFetch<NotificacionesResponse>(`/notificaciones?${qs.toString()}`);
};

export const fetchNoLeidas = (): Promise<{ total: number }> =>
  apiFetch<{ total: number }>('/notificaciones/no-leidas');

export const marcarNotificacionLeida = (id: number): Promise<void> =>
  apiFetch<void>(`/notificaciones/${id}/leer`, { method: 'POST' });
