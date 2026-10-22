import { apiFetch } from '@/lib/api';

export type TipoDisputa = 'DANO' | 'COBRO' | 'SERVICIO' | 'DOCUMENTO' | 'OTRO';
export type EstadoDisputa = 'ABIERTA' | 'EN_REVISION' | 'RESUELTA' | 'CERRADA';

export interface Disputa {
  id: number;
  arriendoId: number;
  clienteId: number;
  cliente: string;
  proveedorId: number;
  proveedor: string;
  autorId: number;
  autor: string;
  estado: EstadoDisputa;
  tipo: TipoDisputa;
  descripcion: string;
  monto: number | null;
  resolucion: string | null;
  fechaApertura: string;
  fechaCierre: string | null;
}

export interface DisputasResponse {
  data: Disputa[];
  page: number;
  pageSize: number;
  total: number;
}

export const ETIQUETAS_DISPUTA: Record<TipoDisputa, string> = {
  DANO: 'Dano',
  COBRO: 'Cobro',
  SERVICIO: 'Servicio',
  DOCUMENTO: 'Documento',
  OTRO: 'Otro',
};

export const fetchDisputas = (params: {
  scope?: 'cliente' | 'proveedor' | 'todos';
  estado?: EstadoDisputa;
  arriendo?: number;
  page?: number;
  pageSize?: number;
} = {}): Promise<DisputasResponse> => {
  const qs = new URLSearchParams();
  if (params.scope) qs.set('scope', params.scope);
  if (params.estado) qs.set('estado', params.estado);
  if (params.arriendo) qs.set('arriendo', String(params.arriendo));
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  return apiFetch<DisputasResponse>(`/disputas?${qs.toString()}`);
};

export const fetchDisputa = (id: number): Promise<Disputa> =>
  apiFetch<Disputa>(`/disputas/${id}`);

export const crearDisputa = (data: {
  ID_arriendo: number;
  tipo_disputa: TipoDisputa;
  descripcion: string;
  monto_disputado?: number;
}): Promise<Disputa> =>
  apiFetch<Disputa>('/disputas', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const resolverDisputa = (
  id: number,
  data: { estado: 'EN_REVISION' | 'RESUELTA' | 'CERRADA'; resolucion?: string },
): Promise<Disputa> =>
  apiFetch<Disputa>(`/disputas/${id}/resolver`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
