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
