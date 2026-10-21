import { useQuery } from '@tanstack/react-query';
import * as api from './api';

const HORA = 1000 * 60 * 60;

export function useRegiones() {
  return useQuery({
    queryKey: ['regiones'],
    queryFn: api.fetchRegiones,
    staleTime: HORA,
  });
}

export function useProvincias(idRegion?: number) {
  return useQuery({
    queryKey: ['provincias', idRegion],
    queryFn: () => api.fetchProvincias(idRegion as number),
    enabled: Boolean(idRegion),
    staleTime: HORA,
  });
}

export function useComunas(idProvincia?: number) {
  return useQuery({
    queryKey: ['comunas', idProvincia],
    queryFn: () => api.fetchComunas(idProvincia as number),
    enabled: Boolean(idProvincia),
    staleTime: HORA,
  });
}

export function useCatalogo(tipo: string, marca?: number) {
  return useQuery({
    queryKey: ['catalogo', tipo, marca ?? null],
    queryFn: () => api.fetchCatalogo(tipo, marca),
    staleTime: HORA,
  });
}
