import { apiFetch } from '@/lib/api';

export interface VehiculoResumen {
  id: number;
  patente: string;
  anio: number;
  precioDiario: number;
  modelo: string;
  marca: string;
  estadoPublicacion: string;
  estadoVehiculo: string;
  fotos: number;
}

export interface VehiculoFoto {
  id: number;
  url: string;
  thumbUrl: string;
  esPrincipal: boolean;
}

export interface VehiculoDetalle {
  id: number;
  patente: string;
  vin: string;
  anio: number;
  kilometraje: number;
  precioDiario: number;
  idProveedor: number;
  modelo: string;
  marca: string;
  tipoVehiculo: string;
  combustible: string;
  transmision: string;
  estadoVehiculo: string;
  estadoPublicacion: string;
  fotos: VehiculoFoto[];
  caracteristicas: { id: number; nombre: string; disponible: boolean }[];
  tarifas: {
    id: number;
    nombre: string;
    fechaInicio: string;
    fechaFin: string;
    precioDia: number;
    prioridad: number;
    activa: boolean;
  }[];
}

export interface CrearVehiculoData {
  ID_modelo: number;
  ID_tipo_vehiculo: number;
  ID_tipo_combustible: number;
  ID_tipo_transmision: number;
  patente: string;
  vin: string;
  anio: number;
  kilometraje: number;
  precioDiarioBase: number;
  ID_sede_actual?: number;
}

export interface CrearTarifaData {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  precioDia: number;
}

export const fetchMisVehiculos = (): Promise<VehiculoResumen[]> =>
  apiFetch<VehiculoResumen[]>('/vehiculos/mios');

export const fetchVehiculo = (id: number): Promise<VehiculoDetalle> =>
  apiFetch<VehiculoDetalle>(`/vehiculos/${id}`);

export const crearVehiculo = (data: CrearVehiculoData): Promise<{ ID_vehiculo: number }> =>
  apiFetch<{ ID_vehiculo: number }>('/vehiculos', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const publicarVehiculo = (id: number): Promise<void> =>
  apiFetch<void>(`/vehiculos/${id}/publicar`, { method: 'POST' });

export const subirFotos = (id: number, files: FileList): Promise<unknown> => {
  const form = new FormData();
  Array.from(files).forEach((file) => form.append('fotos', file));
  return apiFetch(`/vehiculos/${id}/fotos`, { method: 'POST', body: form });
};

export const crearTarifa = (id: number, data: CrearTarifaData): Promise<unknown> =>
  apiFetch(`/vehiculos/${id}/tarifas`, { method: 'POST', body: JSON.stringify(data) });

export const eliminarTarifa = (id: number, tarifaId: number): Promise<void> =>
  apiFetch<void>(`/vehiculos/${id}/tarifas/${tarifaId}`, { method: 'DELETE' });

export const agregarCaracteristica = (
  id: number,
  idCaracteristica: number,
  disponible = true,
): Promise<unknown> =>
  apiFetch(`/vehiculos/${id}/caracteristicas`, {
    method: 'POST',
    body: JSON.stringify({ ID_caracteristica: idCaracteristica, disponible }),
  });

export const quitarCaracteristica = (id: number, idCaracteristica: number): Promise<void> =>
  apiFetch<void>(`/vehiculos/${id}/caracteristicas/${idCaracteristica}`, { method: 'DELETE' });

export interface BusquedaParams {
  fecha_inicio?: string;
  fecha_fin?: string;
  ID_comuna?: number;
  ID_tipo_vehiculo?: number;
  precio_maximo?: number;
}

export interface BusquedaItem {
  ID_vehiculo: number;
  patente_vehiculo: string;
  precio_diario_base_vehiculo: number;
  precio_cotizado?: number | null;
  calificacion_promedio_vehiculo: number | null;
  anio_vehiculo: number;
  nombre_marca: string;
  nombre_modelo: string;
  nombre_tipo_vehiculo: string;
  nombre_sede_proveedor: string | null;
  nombre_comuna: string | null;
  nombre_region: string | null;
  nombre_comercial_proveedor: string;
  dias?: number | null;
}

export async function buscarVehiculos(params: BusquedaParams): Promise<BusquedaItem[]> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) qs.set(key, String(value));
  });
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch<BusquedaItem[]>(`/vehiculos/buscar${suffix}`);
}
