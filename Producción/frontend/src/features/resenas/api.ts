import { apiFetch } from '@/lib/api';

export type TipoResena =
  | 'CLIENTE_A_PROVEEDOR'
  | 'CLIENTE_A_VEHICULO'
  | 'PROVEEDOR_A_CLIENTE';

export interface Resena {
  id: number;
  arriendoId: number;
  tipo: TipoResena;
  calificacion: number;
  comentario: string | null;
  fecha: string;
  autorId: number;
  autor: string;
}

export interface ResenasVehiculo {
  total: number;
  promedio: number | null;
  resenas: Resena[];
}

export interface CrearResenaData {
  ID_arriendo: number;
  tipo_resena: TipoResena;
  calificacion: number;
  comentario?: string;
}

export const fetchResenasVehiculo = (idVehiculo: number): Promise<ResenasVehiculo> =>
  apiFetch<ResenasVehiculo>(`/vehiculos/${idVehiculo}/resenas`);

export const fetchResenasProveedor = (idProveedor: number): Promise<ResenasVehiculo> =>
  apiFetch<ResenasVehiculo>(`/proveedores/${idProveedor}/resenas`);

export const crearResena = (data: CrearResenaData): Promise<Resena> =>
  apiFetch<Resena>('/resenas', {
    method: 'POST',
    body: JSON.stringify(data),
  });
