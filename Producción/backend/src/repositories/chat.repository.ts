import sql from 'mssql';
import { getPool } from '../config/db';

export interface ConversacionRow {
  ID_conversacion: number;
  ID_usuario_conversacion: number;
  ID_proveedor_conversacion: number;
  nombre_comercial_proveedor: string;
  ID_vehiculo_conversacion: number | null;
  activa_conversacion: boolean;
  fecha_inicio_conversacion: string;
  fecha_ultimo_mensaje_conversacion: string | null;
  mensajes_no_leidos: number;
  ultimo_mensaje: string | null;
  fue_creada?: boolean;
}

export interface MensajeRow {
  ID_mensaje: number;
  ID_conversacion_mensaje: number;
  ID_usuario_emisor_mensaje: number;
  contenido_mensaje: string;
  leido_mensaje: boolean;
  fecha_mensaje: string;
}

export async function crearConversacion(
  idUsuario: number,
  idProveedor: number,
  idVehiculo?: number | null,
): Promise<ConversacionRow | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_usuario', sql.Int, idUsuario)
    .input('ID_proveedor', sql.Int, idProveedor)
    .input('ID_vehiculo', sql.Int, idVehiculo ?? null)
    .execute<ConversacionRow>('u_sp_CrearConversacion');
  return result.recordset[0] ?? null;
}

export async function listarConversaciones(idUsuario: number): Promise<ConversacionRow[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_usuario', sql.Int, idUsuario)
    .execute<ConversacionRow>('u_sp_ListarConversaciones');
  return result.recordset;
}

export async function listarMensajes(
  idConversacion: number,
  idUsuario: number,
): Promise<MensajeRow[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_conversacion', sql.Int, idConversacion)
    .input('ID_usuario', sql.Int, idUsuario)
    .execute<MensajeRow>('u_sp_ListarMensajes');
  return result.recordset;
}

export async function enviarMensaje(params: {
  ID_conversacion: number;
  ID_usuario_emisor: number;
  contenido: string;
  tipo_mensaje?: string;
  ID_mensaje_padre?: number | null;
}): Promise<MensajeRow | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_conversacion', sql.Int, params.ID_conversacion)
    .input('ID_usuario_emisor', sql.Int, params.ID_usuario_emisor)
    .input('contenido', sql.NVarChar(2000), params.contenido)
    .input('tipo_mensaje', sql.VarChar(20), params.tipo_mensaje ?? 'TEXTO')
    .input('ID_mensaje_padre', sql.BigInt, params.ID_mensaje_padre ?? null)
    .execute<MensajeRow>('u_sp_EnviarMensaje');
  return result.recordset[0] ?? null;
}

export async function marcarLeidos(
  idConversacion: number,
  idUsuario: number,
): Promise<number> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_conversacion', sql.Int, idConversacion)
    .input('ID_usuario', sql.Int, idUsuario)
    .execute<{ mensajes_marcados: number }>('u_sp_MarcarMensajesLeidos');
  return result.recordset[0]?.mensajes_marcados ?? 0;
}

export async function cerrarConversacion(
  idConversacion: number,
  idUsuario: number,
): Promise<ConversacionRow | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_conversacion', sql.Int, idConversacion)
    .input('ID_usuario', sql.Int, idUsuario)
    .execute<ConversacionRow>('u_sp_CerrarConversacion');
  return result.recordset[0] ?? null;
}
