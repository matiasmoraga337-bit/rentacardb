import sql from 'mssql';
import { getPool } from '../config/db';

export interface AuditoriaRow {
  id: number;
  entidad: string;
  registroId: number | null;
  accion: string;
  usuarioId: number | null;
  usuario: string | null;
  fecha: string;
  descripcion: string | null;
  origen: string | null;
  ip: string | null;
  motivo: string | null;
}

export interface ListarAuditoriaParams {
  entidad?: string;
  page: number;
  pageSize: number;
}

export async function listarAuditoria(
  params: ListarAuditoriaParams,
): Promise<{ rows: AuditoriaRow[]; total: number }> {
  const pool = await getPool();
  const condicion = params.entidad ? 'WHERE a.entidad_auditoria = @entidad' : '';
  const offset = (params.page - 1) * params.pageSize;

  const countRequest = pool.request();
  const dataRequest = pool.request();
  if (params.entidad) {
    countRequest.input('entidad', sql.VarChar(128), params.entidad);
    dataRequest.input('entidad', sql.VarChar(128), params.entidad);
  }
  dataRequest.input('offset', sql.Int, offset);
  dataRequest.input('pageSize', sql.Int, params.pageSize);

  const countResult = await countRequest.query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM dbo.Auditoria a ${condicion}`,
  );
  const dataResult = await dataRequest.query<AuditoriaRow>(
    `SELECT a.ID_auditoria AS id,
            a.entidad_auditoria AS entidad,
            a.ID_registro_auditoria AS registroId,
            a.accion_auditoria AS accion,
            a.ID_usuario_auditoria AS usuarioId,
            CONCAT(p.nombres_persona, ' ', p.apellido_paterno_persona) AS usuario,
            a.fecha_auditoria AS fecha,
            a.descripcion_auditoria AS descripcion,
            a.origen_auditoria AS origen,
            a.ip_origen_auditoria AS ip,
            a.motivo_auditoria AS motivo
     FROM dbo.Auditoria a
     LEFT JOIN dbo.Usuario u ON u.ID_usuario = a.ID_usuario_auditoria
     LEFT JOIN dbo.Persona p ON p.ID_persona = u.ID_persona_usuario
     ${condicion}
     ORDER BY a.fecha_auditoria DESC, a.ID_auditoria DESC
     OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
  );

  return { rows: dataResult.recordset, total: countResult.recordset[0]?.total ?? 0 };
}
