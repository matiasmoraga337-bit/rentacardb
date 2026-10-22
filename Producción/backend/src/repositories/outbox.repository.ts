import sql from 'mssql';
import { getPool } from '../config/db';

export interface OutboxEventoRow {
  id: number;
  tipoEvento: string;
  agregadoTipo: string;
  agregadoId: number;
  payload: string;
  intentos: number;
  lockId: string;
  estado: string;
  fechaCreacion?: string;
  fechaProcesamiento?: string | null;
  ultimoError?: string | null;
}

export interface ListarOutboxParams {
  estado?: string;
  page: number;
  pageSize: number;
}

export async function obtenerPendientes(cantidad: number): Promise<OutboxEventoRow[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('cantidad', sql.Int, cantidad)
    .execute<{
      ID_evento: number;
      tipo_evento: string;
      agregado_tipo_outbox_evento: string;
      agregado_id_outbox_evento: number;
      payload_outbox_evento: string;
      intentos_outbox_evento: number;
      lock_id_outbox_evento: string;
      estado_outbox_evento: string;
    }>('u_sp_ObtenerOutboxPendiente');

  return result.recordset.map((row) => ({
    id: row.ID_evento,
    tipoEvento: row.tipo_evento,
    agregadoTipo: row.agregado_tipo_outbox_evento,
    agregadoId: row.agregado_id_outbox_evento,
    payload: row.payload_outbox_evento,
    intentos: row.intentos_outbox_evento,
    lockId: row.lock_id_outbox_evento,
    estado: row.estado_outbox_evento,
  }));
}

export async function marcarEventoProcesado(params: {
  idEvento: number;
  exito: boolean;
  lockId: string;
  error?: string;
}): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('ID_evento', sql.BigInt, params.idEvento)
    .input('exito', sql.Bit, params.exito)
    .input('lock_id', sql.UniqueIdentifier, params.lockId)
    .input('error', sql.NVarChar(2000), params.error ?? null)
    .execute('u_sp_MarcarEventoProcesado');
}

export async function reintentarEvento(idEvento: number): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('ID_evento', sql.BigInt, idEvento)
    .execute('u_sp_ReintentarOutboxError');
}

export async function listarOutbox(
  params: ListarOutboxParams,
): Promise<{ rows: OutboxEventoRow[]; total: number }> {
  const pool = await getPool();
  const condicion = params.estado ? 'WHERE estado_outbox_evento = @estado' : '';
  const countRequest = pool.request();
  const dataRequest = pool.request();
  if (params.estado) {
    countRequest.input('estado', sql.VarChar(20), params.estado);
    dataRequest.input('estado', sql.VarChar(20), params.estado);
  }
  const offset = (params.page - 1) * params.pageSize;
  dataRequest.input('offset', sql.Int, offset);
  dataRequest.input('pageSize', sql.Int, params.pageSize);

  const countResult = await countRequest.query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM dbo.OutboxEvento ${condicion}`,
  );
  const dataResult = await dataRequest.query<OutboxEventoRow>(
    `SELECT ID_evento AS id,
            tipo_evento AS tipoEvento,
            agregado_tipo_outbox_evento AS agregadoTipo,
            agregado_id_outbox_evento AS agregadoId,
            payload_outbox_evento AS payload,
            intentos_outbox_evento AS intentos,
            ISNULL(CONVERT(varchar(36), lock_id_outbox_evento), '') AS lockId,
            estado_outbox_evento AS estado,
            fecha_creacion_outbox_evento AS fechaCreacion,
            fecha_procesamiento_outbox_evento AS fechaProcesamiento,
            ultimo_error_outbox_evento AS ultimoError
     FROM dbo.OutboxEvento
     ${condicion}
     ORDER BY fecha_creacion_outbox_evento DESC, ID_evento DESC
     OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
  );
  return { rows: dataResult.recordset, total: countResult.recordset[0]?.total ?? 0 };
}

export interface Destinatario {
  idUsuario: number;
  email: string;
  nombre: string;
}

export async function resolverDestinatario(evento: OutboxEventoRow): Promise<Destinatario | null> {
  const pool = await getPool();
  const request = pool.request();
  let query: string | null = null;

  if (evento.tipoEvento === 'MensajeEnviado') {
    let payload: { id_conversacion?: number; emisor?: number } = {};
    try {
      payload = JSON.parse(evento.payload) as typeof payload;
    } catch {
      return null;
    }
    if (!payload.id_conversacion) return null;
    request.input('id', sql.Int, payload.id_conversacion);
    request.input('emisor', sql.Int, payload.emisor ?? 0);
    query = `
      SELECT u.ID_usuario AS idUsuario, u.email_usuario AS email,
             CONCAT(p.nombres_persona, ' ', p.apellido_paterno_persona) AS nombre
      FROM dbo.Conversacion c
      CROSS APPLY (
        SELECT CASE WHEN @emisor = c.ID_usuario_conversacion
          THEN (SELECT TOP 1 ID_usuario_proveedor_usuario
                FROM dbo.ProveedorUsuario
                WHERE ID_proveedor_proveedor_usuario = c.ID_proveedor_conversacion
                ORDER BY ID_usuario_proveedor_usuario)
          ELSE c.ID_usuario_conversacion END AS idUsuario
      ) d
      INNER JOIN dbo.Usuario u ON u.ID_usuario = d.idUsuario
      INNER JOIN dbo.Persona p ON p.ID_persona = u.ID_persona_usuario
      WHERE c.ID_conversacion = @id`;
  } else if (evento.agregadoTipo === 'Reserva') {
    request.input('id', sql.Int, evento.agregadoId);
    query = `
      SELECT u.ID_usuario AS idUsuario, u.email_usuario AS email,
             CONCAT(p.nombres_persona, ' ', p.apellido_paterno_persona) AS nombre
      FROM dbo.Reserva r
      INNER JOIN dbo.Usuario u ON u.ID_usuario = r.ID_usuario_cliente_reserva
      INNER JOIN dbo.Persona p ON p.ID_persona = u.ID_persona_usuario
      WHERE r.ID_reserva = @id`;
  } else if (evento.agregadoTipo === 'Reembolso') {
    request.input('id', sql.Int, evento.agregadoId);
    query = `
      SELECT u.ID_usuario AS idUsuario, u.email_usuario AS email,
             CONCAT(p.nombres_persona, ' ', p.apellido_paterno_persona) AS nombre
      FROM dbo.Reembolso rb
      INNER JOIN dbo.Reserva r ON r.ID_reserva = rb.ID_reserva_reembolso
      INNER JOIN dbo.Usuario u ON u.ID_usuario = r.ID_usuario_cliente_reserva
      INNER JOIN dbo.Persona p ON p.ID_persona = u.ID_persona_usuario
      WHERE rb.ID_reembolso = @id`;
  }

  if (!query) return null;
  const result = await request.query<{
    idUsuario: number;
    email: string;
    nombre: string;
  }>(query);
  return result.recordset[0] ?? null;
}
