import * as repo from '../repositories/chat.repository';
import {
  type CrearConversacionInput,
  type EnviarMensajeInput,
} from '../schemas/chat.schema';
import { AppError } from '../utils/AppError';

export interface ConversacionDto {
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

export interface MensajeDto {
  id: number;
  conversacionId: number;
  idEmisor: number;
  contenido: string;
  leido: boolean;
  fecha: string;
}

function mapConversacion(row: repo.ConversacionRow): ConversacionDto {
  return {
    id: row.ID_conversacion,
    idUsuario: row.ID_usuario_conversacion,
    idProveedor: row.ID_proveedor_conversacion,
    proveedor: row.nombre_comercial_proveedor,
    idVehiculo: row.ID_vehiculo_conversacion,
    activa: row.activa_conversacion,
    fechaInicio: row.fecha_inicio_conversacion,
    fechaUltimoMensaje: row.fecha_ultimo_mensaje_conversacion,
    noLeidos: row.mensajes_no_leidos ?? 0,
    ultimoMensaje: row.ultimo_mensaje,
    fueCreada: row.fue_creada,
  };
}

function mapMensaje(row: repo.MensajeRow): MensajeDto {
  return {
    id: row.ID_mensaje,
    conversacionId: row.ID_conversacion_mensaje,
    idEmisor: row.ID_usuario_emisor_mensaje,
    contenido: row.contenido_mensaje,
    leido: row.leido_mensaje,
    fecha: row.fecha_mensaje,
  };
}

export async function crearConversacion(
  idUsuario: number,
  input: CrearConversacionInput,
): Promise<ConversacionDto> {
  const row = await repo.crearConversacion(idUsuario, input.ID_proveedor, input.ID_vehiculo);
  if (!row) {
    throw new AppError(500, 'CONVERSACION_NO_CREADA', 'No se pudo crear la conversacion.');
  }
  return mapConversacion(row);
}

export async function listarConversaciones(idUsuario: number): Promise<ConversacionDto[]> {
  const rows = await repo.listarConversaciones(idUsuario);
  return rows.map(mapConversacion);
}

export async function listarMensajes(
  idConversacion: number,
  idUsuario: number,
): Promise<MensajeDto[]> {
  const rows = await repo.listarMensajes(idConversacion, idUsuario);
  return rows.map(mapMensaje);
}

export async function enviarMensaje(
  idConversacion: number,
  idUsuario: number,
  input: EnviarMensajeInput,
): Promise<MensajeDto> {
  const row = await repo.enviarMensaje({
    ID_conversacion: idConversacion,
    ID_usuario_emisor: idUsuario,
    contenido: input.contenido,
    tipo_mensaje: input.tipo_mensaje,
    ID_mensaje_padre: input.ID_mensaje_padre ?? null,
  });
  if (!row) {
    throw new AppError(500, 'MENSAJE_NO_ENVIADO', 'No se pudo enviar el mensaje.');
  }
  return mapMensaje(row);
}

export async function marcarLeidos(
  idConversacion: number,
  idUsuario: number,
): Promise<{ mensajesMarcados: number }> {
  const count = await repo.marcarLeidos(idConversacion, idUsuario);
  return { mensajesMarcados: count };
}

export async function cerrarConversacion(
  idConversacion: number,
  idUsuario: number,
): Promise<{ id: number; activa: boolean }> {
  const row = await repo.cerrarConversacion(idConversacion, idUsuario);
  if (!row) {
    throw new AppError(404, 'CONVERSACION_NO_ENCONTRADA', 'Conversacion no encontrada.');
  }
  return { id: row.ID_conversacion, activa: row.activa_conversacion };
}
