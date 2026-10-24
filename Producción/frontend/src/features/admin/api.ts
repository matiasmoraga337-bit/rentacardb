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
export interface VehiculoPublicado {
  id: number;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  precioDiario: number;
  proveedor: string;
  sede: string | null;
  comuna: string | null;
  region: string | null;
  urlFoto: string | null;
}

export interface PagoPendiente {
  id: number;
  reservaId: number;
  monto: number;
  moneda: string;
  estado: string;
  metodo: string;
  fecha: string | null;
  referencia: string | null;
}

export interface DocumentoVencido {
  id: number;
  vehiculoId: number;
  patente: string;
  tipo: string;
  vence: string;
  diasParaVencer: number;
}

export interface VistaResumen<T> {
  total: number;
  rows: T[];
}

export const fetchVehiculosPublicados = (
  limit = 10,
): Promise<VistaResumen<VehiculoPublicado>> =>
  apiFetch<VistaResumen<VehiculoPublicado>>(`/admin/vehiculos-publicados?limit=${limit}`);

export const fetchPagosPendientes = (
  limit = 10,
): Promise<VistaResumen<PagoPendiente>> =>
  apiFetch<VistaResumen<PagoPendiente>>(`/admin/pagos-pendientes?limit=${limit}`);

export const fetchDocumentosVencidosAdmin = (): Promise<VistaResumen<DocumentoVencido>> =>
  apiFetch<VistaResumen<DocumentoVencido>>('/admin/documentos-vencidos');

export interface ReporteLiquidacion {
  ID_liquidacion: number;
  nombre_comercial_proveedor: string;
  periodo_desde_liquidacion: string;
  periodo_hasta_liquidacion: string;
  nombre_estado_liquidacion: string;
  monto_bruto_liquidacion: number;
  monto_comision_liquidacion: number;
  monto_neto_liquidacion: number;
  fecha_calculo_liquidacion: string;
  fecha_pago_liquidacion: string | null;
}

export interface ReporteProveedor {
  ID_proveedor: number;
  nombre_proveedor: string;
  cantidad_vehiculos: number;
  cantidad_publicados: number;
  cantidad_reservas: number;
  total_pagado: number;
}

export interface ReporteTipoProveedor {
  nombre_tipo_proveedor: string;
  cantidad_proveedores: number;
}

export interface IntegridadError {
  codigo: string;
  cantidad: number;
  descripcion_movimiento_financiero: string;
}

export interface IntegridadResponse {
  ok: boolean;
  errores: IntegridadError[];
}

export const fetchReporteLiquidaciones = (): Promise<ReporteLiquidacion[]> =>
  apiFetch<ReporteLiquidacion[]>('/reportes/liquidaciones');

export const fetchReporteProveedores = (): Promise<ReporteProveedor[]> =>
  apiFetch<ReporteProveedor[]>('/reportes/proveedores');

export const fetchReporteTiposProveedor = (): Promise<ReporteTipoProveedor[]> =>
  apiFetch<ReporteTipoProveedor[]>('/reportes/tipos-proveedor');

export const fetchIntegridad = (): Promise<IntegridadResponse> =>
  apiFetch<IntegridadResponse>('/reportes/integridad');
