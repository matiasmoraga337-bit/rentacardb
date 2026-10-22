import { apiFetch } from '@/lib/api';

export type EstadoLiquidacion = 'CALCULADA' | 'APROBADA' | 'PAGADA' | 'ANULADA';

export interface Liquidacion {
  id: number;
  proveedorId: number;
  proveedor: string;
  periodoInicio: string;
  periodoFin: string;
  moneda: string;
  totalBruto: number;
  totalComision: number;
  totalReembolsos: number;
  totalAjustes: number;
  totalNeto: number;
  estado: EstadoLiquidacion;
  fechaGeneracion: string;
  fechaPago: string | null;
}

export interface LiquidacionesResponse {
  data: Liquidacion[];
  page: number;
  pageSize: number;
  total: number;
}

export const fetchLiquidaciones = (params: {
  proveedor?: number;
  estado?: EstadoLiquidacion;
  page?: number;
  pageSize?: number;
} = {}): Promise<LiquidacionesResponse> => {
  const qs = new URLSearchParams();
  if (params.proveedor) qs.set('proveedor', String(params.proveedor));
  if (params.estado) qs.set('estado', params.estado);
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  return apiFetch<LiquidacionesResponse>(`/liquidaciones?${qs.toString()}`);
};

export const crearLiquidacion = (data: {
  ID_proveedor: number;
  periodo_inicio: string;
  periodo_fin: string;
}): Promise<Liquidacion> =>
  apiFetch<Liquidacion>('/liquidaciones', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const aprobarLiquidacion = (id: number): Promise<Liquidacion> =>
  apiFetch<Liquidacion>(`/liquidaciones/${id}/aprobar`, { method: 'POST' });

export const pagarLiquidacion = (id: number): Promise<Liquidacion> =>
  apiFetch<Liquidacion>(`/liquidaciones/${id}/pagar`, { method: 'POST' });
