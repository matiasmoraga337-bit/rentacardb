import sql from 'mssql';
import { getPool } from '../config/db';
import type { CrearDisputaInput, ListarDisputasQuery, ResolverDisputaInput } from '../schemas/disputa.schema';

export type ScopeDisputas = 'cliente' | 'proveedor' | 'todos';

export interface DisputaRow {
  id: number;
  arriendoId: number;
  clienteId: number;
  cliente: string;
  proveedorId: number;
  proveedor: string;
  autorId: number;
  autor: string;
  estado: string;
  tipo: string;
  descripcion: string;
  monto: number | null;
  resolucion: string | null;
  fechaApertura: string;
  fechaCierre: string | null;
}

const DISPUTA_SELECT = `
  SELECT d.ID_disputa AS id,
         d.ID_arriendo_disputa AS arriendoId,
         r.ID_usuario_cliente_reserva AS clienteId,
         CONCAT(pc.nombres_persona, ' ', pc.apellido_paterno_persona) AS cliente,
         v.ID_proveedor_vehiculo AS proveedorId,
         pr.nombre_comercial_proveedor AS proveedor,
         d.ID_usuario_reporta_disputa AS autorId,
         CONCAT(pa.nombres_persona, ' ', pa.apellido_paterno_persona) AS autor,
         ed.nombre_estado_disputa AS estado,
         d.tipo_disputa AS tipo,
         d.descripcion_disputa AS descripcion,
         d.monto_disputado AS monto,
         d.resolucion_disputa AS resolucion,
         d.fecha_apertura_disputa AS fechaApertura,
         d.fecha_cierre_disputa AS fechaCierre
  FROM dbo.Disputa d
  INNER JOIN dbo.EstadoDisputa ed ON ed.ID_estado_disputa = d.ID_estado_disputa_disputa
  INNER JOIN dbo.Arriendo a ON a.ID_arriendo = d.ID_arriendo_disputa
  INNER JOIN dbo.Reserva r ON r.ID_reserva = a.ID_reserva_arriendo
  INNER JOIN dbo.Vehiculo v ON v.ID_vehiculo = r.ID_vehiculo_reserva
  INNER JOIN dbo.Proveedor pr ON pr.ID_proveedor = v.ID_proveedor_vehiculo
  INNER JOIN dbo.Usuario ua ON ua.ID_usuario = d.ID_usuario_reporta_disputa
  INNER JOIN dbo.Persona pa ON pa.ID_persona = ua.ID_persona_usuario
  INNER JOIN dbo.Usuario uc ON uc.ID_usuario = r.ID_usuario_cliente_reserva
  INNER JOIN dbo.Persona pc ON pc.ID_persona = uc.ID_persona_usuario
`;

export async function crearDisputa(
  idUsuario: number,
  input: CrearDisputaInput,
): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('ID_arriendo', sql.Int, input.ID_arriendo)
    .input('ID_usuario_reporta', sql.Int, idUsuario)
    .input('tipo_disputa', sql.VarChar(50), input.tipo_disputa)
    .input('descripcion', sql.NVarChar(1000), input.descripcion)
    .input('monto_disputado', sql.Decimal(12, 2), input.monto_disputado ?? null)
    .execute('u_sp_CrearDisputa');
}

export async function resolverDisputa(
  idDisputa: number,
  idUsuario: number,
  input: ResolverDisputaInput,
): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('ID_disputa', sql.Int, idDisputa)
    .input('nuevo_estado', sql.VarChar(30), input.estado)
    .input('resolucion', sql.NVarChar(1000), input.resolucion ?? null)
    .input('ID_usuario', sql.Int, idUsuario)
    .execute('u_sp_ResolverDisputa');
}

export async function obtenerDisputa(idDisputa: number): Promise<DisputaRow | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idDisputa)
    .query<DisputaRow>(`${DISPUTA_SELECT} WHERE d.ID_disputa = @id`);
  return result.recordset[0] ?? null;
}

export async function obtenerDisputaCreada(idArriendo: number, idAutor: number): Promise<DisputaRow | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('idArriendo', sql.Int, idArriendo)
    .input('idAutor', sql.Int, idAutor)
    .query<DisputaRow>(
      `${DISPUTA_SELECT}
       WHERE d.ID_arriendo_disputa = @idArriendo
         AND d.ID_usuario_reporta_disputa = @idAutor
       ORDER BY d.ID_disputa DESC`,
    );
  return result.recordset[0] ?? null;
}

export async function listarDisputas(params: {
  scope: ScopeDisputas;
  idUsuario: number;
  query: ListarDisputasQuery;
}): Promise<{ rows: DisputaRow[]; total: number }> {
  const pool = await getPool();
  const condiciones: string[] = [];
  const countRequest = pool.request();
  const dataRequest = pool.request();

  if (params.scope === 'cliente') {
    condiciones.push('r.ID_usuario_cliente_reserva = @idUsuario');
    countRequest.input('idUsuario', sql.Int, params.idUsuario);
    dataRequest.input('idUsuario', sql.Int, params.idUsuario);
  } else if (params.scope === 'proveedor') {
    condiciones.push(`EXISTS (
      SELECT 1 FROM dbo.ProveedorUsuario pu
      WHERE pu.ID_usuario_proveedor_usuario = @idUsuario
        AND pu.ID_proveedor_proveedor_usuario = v.ID_proveedor_vehiculo
    )`);
    countRequest.input('idUsuario', sql.Int, params.idUsuario);
    dataRequest.input('idUsuario', sql.Int, params.idUsuario);
  }
  if (params.query.estado) {
    condiciones.push('ed.nombre_estado_disputa = @estado');
    countRequest.input('estado', sql.VarChar(30), params.query.estado);
    dataRequest.input('estado', sql.VarChar(30), params.query.estado);
  }
  if (params.query.arriendo) {
    condiciones.push('d.ID_arriendo_disputa = @arriendo');
    countRequest.input('arriendo', sql.Int, params.query.arriendo);
    dataRequest.input('arriendo', sql.Int, params.query.arriendo);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const offset = (params.query.page - 1) * params.query.pageSize;
  dataRequest.input('offset', sql.Int, offset);
  dataRequest.input('pageSize', sql.Int, params.query.pageSize);

  const countResult = await countRequest.query<{ total: number }>(
    `SELECT COUNT(*) AS total
     FROM dbo.Disputa d
     INNER JOIN dbo.EstadoDisputa ed ON ed.ID_estado_disputa = d.ID_estado_disputa_disputa
     INNER JOIN dbo.Arriendo a ON a.ID_arriendo = d.ID_arriendo_disputa
     INNER JOIN dbo.Reserva r ON r.ID_reserva = a.ID_reserva_arriendo
     INNER JOIN dbo.Vehiculo v ON v.ID_vehiculo = r.ID_vehiculo_reserva
     ${where}`,
  );
  const dataResult = await dataRequest.query<DisputaRow>(
    `${DISPUTA_SELECT}
     ${where}
     ORDER BY d.fecha_apertura_disputa DESC, d.ID_disputa DESC
     OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
  );

  return { rows: dataResult.recordset, total: countResult.recordset[0]?.total ?? 0 };
}
