import { apiFetch } from '@/lib/api';

export interface CatalogoItem {
  id: number;
  nombre: string;
  extra?: string | number | boolean | null;
}

export const fetchRegiones = (): Promise<CatalogoItem[]> => apiFetch<CatalogoItem[]>('/regiones');

export const fetchProvincias = (idRegion: number): Promise<CatalogoItem[]> =>
  apiFetch<CatalogoItem[]>(`/regiones/${idRegion}/provincias`);

export const fetchComunas = (idProvincia: number): Promise<CatalogoItem[]> =>
  apiFetch<CatalogoItem[]>(`/provincias/${idProvincia}/comunas`);

export const buscarComunas = (q: string): Promise<CatalogoItem[]> =>
  apiFetch<CatalogoItem[]>(`/comunas?q=${encodeURIComponent(q)}`);

export const fetchCatalogo = (tipo: string, marca?: number): Promise<CatalogoItem[]> =>
  apiFetch<CatalogoItem[]>(`/catalogos/${tipo}${marca ? `?marca=${marca}` : ''}`);

export interface CatalogoAdminItem {
  id: number;
  nombre: string;
  activo: boolean;
  marcaId?: number;
  categoria?: string;
  descripcion?: string | null;
  obligatorio?: boolean;
  diasAnticipacion?: number;
  porcentajeReembolso?: number;
}

export type CatalogoWriteData = Record<string, unknown>;

export const fetchCatalogoAdmin = (
  tipo: string,
  incluirInactivos: boolean,
): Promise<CatalogoAdminItem[]> =>
  apiFetch<CatalogoAdminItem[]>(
    `/admin/catalogos/${tipo}${incluirInactivos ? '?incluirInactivos=1' : ''}`,
  );

export const crearCatalogo = (
  tipo: string,
  data: CatalogoWriteData,
): Promise<CatalogoAdminItem> =>
  apiFetch<CatalogoAdminItem>(`/admin/catalogos/${tipo}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const actualizarCatalogo = (
  tipo: string,
  id: number,
  data: CatalogoWriteData,
): Promise<CatalogoAdminItem> =>
  apiFetch<CatalogoAdminItem>(`/admin/catalogos/${tipo}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const desactivarCatalogo = (tipo: string, id: number): Promise<CatalogoAdminItem> =>
  apiFetch<CatalogoAdminItem>(`/admin/catalogos/${tipo}/${id}`, {
    method: 'DELETE',
  });