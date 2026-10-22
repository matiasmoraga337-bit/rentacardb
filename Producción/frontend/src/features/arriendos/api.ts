import { apiFetch } from '@/lib/api';

export interface Arriendo {
  id: number;
  reservaId: number;
  vehiculoId: number;
  patente: string;
  marca: string;
  modelo: string;
  fechaInicio: string;
  fechaFin: string;
  fechaRetiro: string;
  fechaDevolucion: string | null;
  kmInicial: number;
  kmFinal: number | null;
  combustibleInicial: number;
  combustibleFinal: number | null;
  estado: string;
  estadoReserva: string;
  idSedeRetiro: number;
  idSedeDevolucion: number | null;
  idSedeActual: number | null;
  sedeRetiroReal: string;
  sedeDevolucionReal: string | null;
  proveedorId: number;
  proveedor: string;
  clienteId: number;
  cliente: string;
  emailCliente: string;
}

export interface InspeccionArriendo {
  id: number;
  tipo: string;
  combustible: number;
  kilometraje: number;
  limpieza: string | null;
  observaciones: string | null;
  firmaCliente: boolean;
  fecha: string;
  idOperador: number | null;
}

export interface DanoArriendo {
  id: number;
  inspeccionId: number;
  inspeccionTipo: string;
  zona: string;
  tipo: string;
  severidad: string;
  descripcion: string | null;
  montoEstimado: number | null;
  fecha: string;
}

export interface CargoArriendo {
  id: number;
  tipo: string | null;
  concepto: string;
  monto: number;
  estado: string;
  fecha: string;
  observaciones: string | null;
}

export interface ConductorArriendo {
  id: number;
  idPersona: number;
  rut: string;
  nombre: string;
  numeroLicencia: string | null;
  vencimientoLicencia: string | null;
  activo: boolean;
}

export interface ContratoArriendo {
  id: number;
  version: number;
  hash: string;
  url: string;
  fecha: string;
  ip: string | null;
  userAgent: string | null;
}

export interface ResenaArriendo {
  id: number;
  tipo: string;
  calificacion: number;
  comentario: string | null;
  fecha: string;
  autorId: number;
  autor: string;
}

export interface ArriendoDetalle extends Arriendo {
  inspecciones: InspeccionArriendo[];
  danos: DanoArriendo[];
  cargos: CargoArriendo[];
  conductores: ConductorArriendo[];
  contrato: ContratoArriendo | null;
  resenas: ResenaArriendo[];
}

export interface ArriendosResponse {
  data: Arriendo[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ContratoTexto {
  texto: string;
  hash: string;
  url: string;
  aceptacion: ContratoArriendo | null;
}

export const fetchArriendos = (params: {
  scope: 'cliente' | 'proveedor' | 'todos';
  estado?: string;
  page?: number;
  pageSize?: number;
}): Promise<ArriendosResponse> => {
  const qs = new URLSearchParams({ scope: params.scope });
  if (params.estado) qs.set('estado', params.estado);
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  return apiFetch<ArriendosResponse>(`/arriendos?${qs.toString()}`);
};

export const fetchArriendo = (id: number): Promise<ArriendoDetalle> =>
  apiFetch<ArriendoDetalle>(`/arriendos/${id}`);

export const iniciarArriendo = (data: {
  ID_reserva: number;
  ID_sede_retiro_real: number;
  kilometraje_inicial: number;
  combustible_inicial: number;
}): Promise<Arriendo> =>
  apiFetch<Arriendo>('/arriendos/iniciar', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const registrarDevolucion = (
  id: number,
  data: {
    ID_sede_devolucion_real: number;
    kilometraje_final: number;
    combustible_final: number;
    limpieza?: 'BUENA' | 'REGULAR' | 'MALA';
    observaciones?: string;
  },
): Promise<Arriendo> =>
  apiFetch<Arriendo>(`/arriendos/${id}/devolucion`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const registrarDano = (
  id: number,
  idInspeccion: number,
  data: {
    zona: string;
    tipo: string;
    severidad: 'LEVE' | 'MEDIO' | 'GRAVE';
    descripcion?: string;
    monto_estimado?: number;
  },
): Promise<unknown> =>
  apiFetch(`/arriendos/${id}/inspecciones/${idInspeccion}/danos`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const registrarConductor = (
  id: number,
  data: { rut: string; ID_licencia_conducir?: number },
): Promise<unknown> =>
  apiFetch(`/arriendos/${id}/conductores`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const fetchContrato = (id: number): Promise<ContratoTexto> =>
  apiFetch<ContratoTexto>(`/arriendos/${id}/contrato`);

export const aceptarContrato = (id: number): Promise<ContratoTexto & { contrato: ContratoArriendo | null }> =>
  apiFetch(`/arriendos/${id}/contrato`, {
    method: 'POST',
    body: JSON.stringify({ aceptado: true }),
  });
