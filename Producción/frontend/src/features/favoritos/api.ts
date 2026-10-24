import { apiFetch } from '@/lib/api';

export interface Favorito {
  vehiculoId: number;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  precioDiario: number;
  proveedor: string;
  comuna: string | null;
  region: string | null;
  calificacion: number | null;
  fotoUrl: string | null;
  fecha: string;
}

export interface BusquedaGuardada {
  id: number;
  nombre: string | null;
  idComuna: number | null;
  idRegion: number | null;
  idTipoVehiculo: number | null;
  precioMaximo: number | null;
  fechaDesde: string | null;
  fechaHasta: string | null;
  fechaCreacion: string;
}

export const fetchFavoritos = (): Promise<Favorito[]> => apiFetch<Favorito[]>('/favoritos');

export const agregarFavorito = (vehiculoId: number): Promise<unknown> =>
  apiFetch(`/favoritos/${vehiculoId}`, { method: 'POST' });

export const quitarFavorito = (vehiculoId: number): Promise<void> =>
  apiFetch<void>(`/favoritos/${vehiculoId}`, { method: 'DELETE' });

export const fetchBusquedas = (): Promise<BusquedaGuardada[]> =>
  apiFetch<BusquedaGuardada[]>('/busquedas');

export const guardarBusqueda = (data: {
  nombre?: string;
  ID_comuna?: number;
  ID_region?: number;
  ID_tipo_vehiculo?: number;
  precio_maximo?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
}): Promise<BusquedaGuardada> =>
  apiFetch<BusquedaGuardada>('/busquedas', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const eliminarBusqueda = (id: number): Promise<void> =>
  apiFetch<void>(`/busquedas/${id}`, { method: 'DELETE' });
