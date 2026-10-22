import { apiFetch } from '@/lib/api';

export interface Conversacion {
  id: number;
  idUsuario: number;
  idProveedor: number;
  proveedor: string;
  idVehiculo: number | null;
  activa: boolean;
  fechaInicio: string;
  fechaUltimoMensaje: string | null;
  noLeidos: number;
  ultimoMensaje: string | null;
  fueCreada?: boolean;
}

export interface Adjunto {
  id: number;
  mensajeId: number;
  url: string;
  nombre: string;
  tipoMime: string;
  tamano: number;
  fecha: string;
}

export interface Mensaje {
  id: number;
  conversacionId: number;
  idEmisor: number;
  contenido: string;
  leido: boolean;
  fecha: string;
  adjuntos: Adjunto[];
}

export const fetchConversaciones = (): Promise<Conversacion[]> =>
  apiFetch<Conversacion[]>('/conversaciones');

export const fetchMensajes = (id: number): Promise<Mensaje[]> =>
  apiFetch<Mensaje[]>(`/conversaciones/${id}/mensajes`);

export const crearConversacion = (data: {
  ID_proveedor: number;
  ID_vehiculo?: number;
}): Promise<Conversacion> =>
  apiFetch<Conversacion>('/conversaciones', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const enviarMensaje = (
  id: number,
  contenido: string,
  idMensajePadre?: number,
): Promise<Mensaje> =>
  apiFetch<Mensaje>(`/conversaciones/${id}/mensajes`, {
    method: 'POST',
    body: JSON.stringify({
      contenido,
      tipo_mensaje: 'TEXTO',
      ID_mensaje_padre: idMensajePadre,
    }),
  });

export const subirAdjuntos = (
  id: number,
  idMensaje: number,
  files: FileList,
): Promise<unknown> => {
  const form = new FormData();
  Array.from(files).forEach((file) => form.append('archivos', file));
  return apiFetch(`/conversaciones/${id}/mensajes/${idMensaje}/adjuntos`, {
    method: 'POST',
    body: form,
  });
};

export const marcarLeidos = (id: number): Promise<{ mensajesMarcados: number }> =>
  apiFetch<{ mensajesMarcados: number }>(`/conversaciones/${id}/leidos`, {
    method: 'POST',
  });

export const cerrarConversacion = (id: number): Promise<{ id: number; activa: boolean }> =>
  apiFetch<{ id: number; activa: boolean }>(`/conversaciones/${id}/cerrar`, {
    method: 'POST',
  });
