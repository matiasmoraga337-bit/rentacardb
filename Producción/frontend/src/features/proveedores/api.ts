import { apiFetch } from '@/lib/api';

export interface Proveedor {
  id: number;
  nombreComercial: string;
  razonSocial: string | null;
  rut: string | null;
  telefono: string | null;
  email: string | null;
  tipo: string;
  estado: string;
  minutosExpiracionReserva?: number | null;
  requiereDeposito?: boolean | null;
  montoDeposito?: number | null;
  permiteDevolucionOtraSede?: boolean | null;
}

export interface Sede {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string | null;
  email: string | null;
  activo: boolean;
  idComuna: number;
  comuna: string;
}

export interface RegistrarProveedorData {
  tipo: 'PERSONA' | 'EMPRESA';
  nombreComercial: string;
  razonSocial?: string;
  rutProveedor?: string;
  telefono?: string;
  email?: string;
}

export interface ConfiguracionData {
  minutos_expiracion_reserva?: number;
  requiere_deposito?: boolean;
  monto_deposito?: number;
  permite_devolucion_otra_sede?: boolean;
}

export interface SedeData {
  ID_comuna: number;
  nombre: string;
  direccion: string;
  telefono?: string;
  email?: string;
}

export const registrarProveedor = (data: RegistrarProveedorData): Promise<Proveedor> =>
  apiFetch<Proveedor>('/proveedores', { method: 'POST', body: JSON.stringify(data) });

export const fetchMio = (): Promise<Proveedor> => apiFetch<Proveedor>('/proveedores/mio');

export const fetchProveedores = (estado?: string): Promise<Proveedor[]> =>
  apiFetch<Proveedor[]>(`/proveedores${estado ? `?estado=${estado}` : ''}`);

export const aprobarProveedor = (id: number): Promise<Proveedor> =>
  apiFetch<Proveedor>(`/proveedores/${id}/aprobar`, { method: 'PATCH' });

export const actualizarConfiguracion = (id: number, data: ConfiguracionData): Promise<unknown> =>
  apiFetch(`/proveedores/${id}/configuracion`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const fetchSedes = (id: number): Promise<Sede[]> =>
  apiFetch<Sede[]>(`/proveedores/${id}/sedes`);

export const crearSede = (id: number, data: SedeData): Promise<unknown> =>
  apiFetch(`/proveedores/${id}/sedes`, { method: 'POST', body: JSON.stringify(data) });

export const eliminarSede = (id: number, sedeId: number): Promise<void> =>
  apiFetch<void>(`/proveedores/${id}/sedes/${sedeId}`, { method: 'DELETE' });
export interface DocumentoVencido {
  id: number;
  vehiculoId: number;
  patente: string;
  tipo: string;
  vence: string;
  diasParaVencer: number;
}

export const fetchDocumentosVencidos = (): Promise<{
  total: number;
  rows: DocumentoVencido[];
}> => apiFetch<{ total: number; rows: DocumentoVencido[] }>('/proveedores/documentos-vencidos');
