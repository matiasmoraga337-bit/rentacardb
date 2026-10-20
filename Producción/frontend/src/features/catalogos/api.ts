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

export const fetchCatalogo = (tipo: string, marca?: number): Promise<CatalogoItem[]> =>
  apiFetch<CatalogoItem[]>(`/catalogos/${tipo}${marca ? `?marca=${marca}` : ''}`);
