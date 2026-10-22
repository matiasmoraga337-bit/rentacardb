import { apiFetch } from '@/lib/api';

export interface AuditoriaItem {
  id: number;
  entidad: string;
  registroId: number | null;
  accion: string;
  usuarioId: number | null;
  usuario: string | null;
  fecha: string;
  descripcion: string | null;
  origen: string | null;
  ip: string | null;
  motivo: string | null;
}

export interface AuditoriaResponse {
  data: AuditoriaItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface OutboxEvento {
  id: number;
  tipoEvento: string;
  agregadoTipo: string;
  agregadoId: number;
  payload: string;
  intentos: number;
  lockId: string;
  estado: string;
  fechaCreacion: string;
  fechaProcesamiento: string | null;
  ultimoError: string | null;
}

export interface OutboxResponse {
  data: OutboxEvento[];
  page: number;
  pageSize: number;
  total: number;
}

export const fetchOutbox = (params: {
  estado?: string;
  page?: number;
  pageSize?: number;
}): Promise<OutboxResponse> => {
  const qs = new URLSearchParams();
  if (params.estado) qs.set('estado', params.estado);
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  return apiFetch<OutboxResponse>(`/admin/outbox?${qs.toString()}`);
};

export const reintentarOutbox = (id: number): Promise<{ message: string }> =>
  apiFetch<{ message: string }>(`/admin/outbox/${id}/reintentar`, { method: 'POST' });

export const fetchAuditoria = (params: {
  entidad?: string;
  page?: number;
  pageSize?: number;
}): Promise<AuditoriaResponse> => {
  const qs = new URLSearchParams();
  if (params.entidad) qs.set('entidad', params.entidad);
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  return apiFetch<AuditoriaResponse>(`/admin/auditoria?${qs.toString()}`);
};
