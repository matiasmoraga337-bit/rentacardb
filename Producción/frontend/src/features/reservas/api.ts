import { apiFetch } from '@/lib/api';

export interface Reserva {
  id: number;
  idCliente: number;
  idSedeRetiro: number;
  idSedeDevolucion: number;
  fechaInicio: string;
  fechaFin: string;
  precioDia: number;
  porcentajeImpuesto: number;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  cliente: string;
  emailCliente: string;
  vehiculoId: number;
  patente: string;
  modelo: string;
  marca: string;
  proveedorId: number;
  proveedor: string;
  sedeRetiro: string;
  sedeDevolucion: string;
  estado: string;
  arriendoId: number | null;
  estadoArriendo: string | null;
  resenado: boolean;
  estadoPago: string | null;
  metodoPago: string | null;
  tipoOperacionPago: string | null;
  montoPago: number | null;
  fechaPago: string | null;
  fechaReserva: string;
  fechaExpiracion: string | null;
  observaciones: string | null;
  reembolsos?: Reembolso[];
}

export interface Reembolso {
  id: number;
  monto: number;
  moneda: string;
  estado: string;
  motivo: string | null;
  referenciaExterna: string | null;
  fechaSolicitud: string;
  fechaProcesamiento: string | null;
}

export interface ReservasResponse {
  data: Reserva[];
  page: number;
  pageSize: number;
  total: number;
}

export interface HistorialItem {
  id: number;
  estadoAnterior: string | null;
  estadoNuevo: string;
  evento: string | null;
  motivo: string | null;
  fecha: string;
  idUsuario: number | null;
  usuario: string | null;
}

export interface SnapshotItem {
  ID_snapshot: number;
  version_snapshot: number;
  precio_dia_reserva_snapshot: number;
  cantidad_dias_reserva_snapshot: number;
  subtotal_reserva_snapshot: number;
  descuento_reserva_snapshot: number;
  impuesto_reserva_snapshot: number;
  total_reserva_snapshot: number;
  porcentaje_impuesto_reserva_snapshot: number;
  porcentaje_comision_reserva_snapshot: number | null;
  nombre_tarifa_reserva_snapshot: string | null;
  politica_cancelacion_reserva_snapshot: string | null;
  hash_snapshot: string | null;
  fecha_snapshot: string;
}

export interface CancelacionPreview {
  politica: string;
  descripcion: string | null;
  diasAnticipacion: number;
  porcentajeReembolso: number;
  diasHastaInicio: number;
  montoPagado: number;
  montoReembolsado: number;
  disponible: number;
  elegible: boolean;
  montoReembolso: number;
  estado: string;
}

export interface CrearReservaData {
  ID_vehiculo: number;
  ID_sede_retiro: number;
  ID_sede_devolucion: number;
  fecha_inicio: string;
  fecha_fin: string;
  observaciones?: string;
  politica_combustible?: 'LLENO_LLENO' | 'MISMO_NIVEL' | 'LIBRE';
  idempotency_key?: string;
}

export interface CancelarReservaData {
  motivo: string;
  solicitar_reembolso: boolean;
  motivo_reembolso?: string;
  idempotency_key?: string;
  referencia_externa?: string;
}

export interface CancelacionResult {
  reserva: Reserva;
  reembolso: Reembolso | null;
  montoReembolsado: number;
  fueIdempotente: boolean;
}

export function nuevaIdempotencyKey(prefijo = 'res'): string {
  const randomUuid = globalThis.crypto?.randomUUID;
  if (typeof randomUuid === 'function') return `${prefijo}-${randomUuid()}`;
  return `${prefijo}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function crearReserva(
  data: CrearReservaData,
  idempotencyKey: string,
): Promise<Reserva> {
  return apiFetch<Reserva>('/reservas', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ ...data, idempotency_key: idempotencyKey }),
  });
}

export async function fetchReservas(params: {
  scope: 'cliente' | 'proveedor' | 'todos';
  estado?: string;
  page?: number;
  pageSize?: number;
}): Promise<ReservasResponse> {
  const qs = new URLSearchParams();
  qs.set('scope', params.scope);
  if (params.estado) qs.set('estado', params.estado);
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  return apiFetch<ReservasResponse>(`/reservas?${qs.toString()}`);
}

export const fetchReserva = (id: number): Promise<Reserva> =>
  apiFetch<Reserva>(`/reservas/${id}`);

export const fetchHistorial = (id: number): Promise<HistorialItem[]> =>
  apiFetch<HistorialItem[]>(`/reservas/${id}/historial`);

export const fetchSnapshot = (id: number): Promise<SnapshotItem[]> =>
  apiFetch<SnapshotItem[]>(`/reservas/${id}/snapshot`);

export const fetchCancelacionPreview = (id: number): Promise<CancelacionPreview> =>
  apiFetch<CancelacionPreview>(`/reservas/${id}/cancelacion`);

export async function cancelarReserva(
  id: number,
  data: CancelarReservaData,
  idempotencyKey?: string,
): Promise<CancelacionResult> {
  return apiFetch<CancelacionResult>(`/reservas/${id}/cancelar`, {
    method: 'POST',
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    body: JSON.stringify({ ...data, idempotency_key: idempotencyKey }),
  });
}
