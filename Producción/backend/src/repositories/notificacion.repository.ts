import sql from 'mssql';
import { getPool } from '../config/db';

export interface NotificacionRow {
  id: number;
  tipo: string;
  canal: string;
  destinatario: string;
  asunto: string | null;
  cuerpo: string | null;
  estado: string;
  fechaCreacion: string;
  fechaEnvio: string | null;
  fechaLectura: string | null;
  error: string | null;
}

export interface ListarNotificacionesParams {
  idUsuario: number;
  estado?: string;
  page: number;
  pageSize: number;
}

export async function listarNotificaciones(
  params: ListarNotificacionesParams,
): Promise<{ rows: NotificacionRow[]; total: number }> {
  const pool = await getPool();
  const condiciones = ['n.ID_usuario_notificacion = @idUsuario'];
  const countRequest = pool.request();
  const dataRequest = pool.request();
  countRequest.input('idUsuario', sql.Int, params.idUsuario);
  dataRequest.input('idUsuario', sql.Int, params.idUsuario);

  if (params.estado) {
    condiciones.push('n.estado_notificacion = @estado');
    countRequest.input('estado', sql.VarChar(20), params.estado);
    dataRequest.input('estado', sql.VarChar(20), params.estado);
  }

  const where = `WHERE ${condiciones.join(' AND ')}`;
  const offset = (params.page - 1) * params.pageSize;
  dataRequest.input('offset', sql.Int, offset);
  dataRequest.input('pageSize', sql.Int, params.pageSize);

  const countResult = await countRequest.query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM dbo.Notificacion n ${where}`,
  );
  const dataResult = await dataRequest.query<NotificacionRow>(
    `SELECT n.ID_notificacion AS id,
            n.tipo_notificacion AS tipo,
            n.canal_notificacion AS canal,
            n.destinatario_notificacion AS destinatario,
            n.asunto_notificacion AS asunto,
            n.cuerpo_notificacion AS cuerpo,
            n.estado_notificacion AS estado,
            n.fecha_creacion_notificacion AS fechaCreacion,
            n.fecha_envio_notificacion AS fechaEnvio,
            n.fecha_lectura_notificacion AS fechaLectura,
            n.error_notificacion AS error
     FROM dbo.Notificacion n
     ${where}
     ORDER BY n.fecha_creacion_notificacion DESC, n.ID_notificacion DESC
     OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
  );
  return { rows: dataResult.recordset, total: countResult.recordset[0]?.total ?? 0 };
}

export async function contarNoLeidas(idUsuario: number): Promise<number> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('idUsuario', sql.Int, idUsuario)
    .query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM dbo.Notificacion
       WHERE ID_usuario_notificacion = @idUsuario
         AND estado_notificacion IN ('PENDIENTE','ENVIADA')`,
    );
  return result.recordset[0]?.total ?? 0;
}

export async function marcarLeida(idNotificacion: number, idUsuario: number): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('ID_notificacion', sql.BigInt, idNotificacion)
    .input('ID_usuario', sql.Int, idUsuario)
    .execute('u_sp_MarcarNotificacionLeida');
}

export async function crearNotificacion(params: {
  idUsuario: number;
  tipo: string;
  canal: 'EMAIL' | 'SMS' | 'PUSH';
  destinatario: string;
  asunto: string;
  cuerpo: string;
}): Promise<number | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_usuario', sql.Int, params.idUsuario)
    .input('tipo', sql.VarChar(50), params.tipo)
    .input('canal', sql.VarChar(20), params.canal)
    .input('destinatario', sql.VarChar(150), params.destinatario)
    .input('asunto', sql.NVarChar(200), params.asunto)
    .input('cuerpo', sql.NVarChar(sql.MAX), params.cuerpo)
    .execute<{ ID_notificacion: number }>('u_sp_RegistrarNotificacion');
  return result.recordset[0]?.ID_notificacion ?? null;
}

export async function marcarEnviada(
  idNotificacion: number,
  enviada: boolean,
  error?: string,
): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('ID_notificacion', sql.BigInt, idNotificacion)
    .input('enviada', sql.Bit, enviada)
    .input('error', sql.NVarChar(500), error ?? null)
    .execute('u_sp_MarcarNotificacionEnviada');
}

export async function existeNotificacionReciente(
  idUsuario: number,
  tipo: string,
  cuerpo: string,
): Promise<boolean> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('idUsuario', sql.Int, idUsuario)
    .input('tipo', sql.VarChar(50), tipo)
    .input('cuerpo', sql.NVarChar(sql.MAX), cuerpo)
    .query<{ ok: number }>(
      `SELECT TOP 1 1 AS ok FROM dbo.Notificacion
       WHERE ID_usuario_notificacion = @idUsuario
         AND tipo_notificacion = @tipo
         AND cuerpo_notificacion = @cuerpo
         AND fecha_creacion_notificacion >= DATEADD(MINUTE, -10, SYSDATETIME())`,
    );
  return result.recordset.length > 0;
}
