import sql from 'mssql';
import { getPool } from '../config/db';
import type { CrearLiquidacionInput } from '../schemas/liquidacion.schema';

export interface LiquidacionRow {
  id: number;
  proveedorId: number;
  proveedor: string;
  periodoInicio: string;
  periodoFin: string;
  moneda: string;
  totalBruto: number;
  totalComision: number;
  totalReembolsos: number;
  totalAjustes: number;
  totalNeto: number;
  estado: string;
  fechaGeneracion: string;
  fechaPago: string | null;
}

const LIQUIDACION_SELECT = `
  SELECT l.ID_liquidacion AS id,
         l.ID_proveedor_liquidacion AS proveedorId,
         p.nombre_comercial_proveedor AS proveedor,
         CONVERT(char(10), l.periodo_inicio_liquidacion_proveedor, 23) AS periodoInicio,
         CONVERT(char(10), l.periodo_fin_liquidacion_proveedor, 23) AS periodoFin,
         l.moneda_liquidacion AS moneda,
         l.total_bruto_liquidacion_proveedor AS totalBruto,
         l.total_comision_liquidacion_proveedor AS totalComision,
         l.total_reembolsos_liquidacion_proveedor AS totalReembolsos,
         l.total_ajustes_liquidacion_proveedor AS totalAjustes,
         l.total_neto_liquidacion_proveedor AS totalNeto,
         l.estado_liquidacion AS estado,
         l.fecha_generacion_liquidacion_proveedor AS fechaGeneracion,
         l.fecha_pago_liquidacion_proveedor AS fechaPago
  FROM dbo.LiquidacionProveedor l
  INNER JOIN dbo.Proveedor p ON p.ID_proveedor = l.ID_proveedor_liquidacion
`;

export async function crearLiquidacion(
  input: CrearLiquidacionInput,
  idUsuario: number,
): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('ID_proveedor', sql.Int, input.ID_proveedor)
    .input('periodo_inicio', sql.Date, input.periodo_inicio)
    .input('periodo_fin', sql.Date, input.periodo_fin)
    .input('ID_usuario', sql.Int, idUsuario)
    .execute('u_sp_GenerarLiquidacion');
}

export async function aprobarLiquidacion(idLiquidacion: number, idUsuario: number): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('ID_liquidacion', sql.BigInt, idLiquidacion)
    .input('ID_usuario', sql.Int, idUsuario)
    .execute('u_sp_AprobarLiquidacion');
}

export async function pagarLiquidacion(idLiquidacion: number, idUsuario: number): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('ID_liquidacion', sql.BigInt, idLiquidacion)
    .input('ID_usuario', sql.Int, idUsuario)
    .execute('u_sp_MarcarLiquidacionPagada');
}

export async function obtenerLiquidacion(idLiquidacion: number): Promise<LiquidacionRow | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.BigInt, idLiquidacion)
    .query<LiquidacionRow>(`${LIQUIDACION_SELECT} WHERE l.ID_liquidacion = @id`);
  return result.recordset[0] ?? null;
}

export async function listarLiquidaciones(params: {
  proveedor?: number;
  estado?: string;
  page: number;
  pageSize: number;
}): Promise<{ rows: LiquidacionRow[]; total: number }> {
  const pool = await getPool();
  const condiciones: string[] = [];
  const countRequest = pool.request();
  const dataRequest = pool.request();

  if (params.proveedor) {
    condiciones.push('l.ID_proveedor_liquidacion = @proveedor');
    countRequest.input('proveedor', sql.Int, params.proveedor);
    dataRequest.input('proveedor', sql.Int, params.proveedor);
  }
  if (params.estado) {
    condiciones.push('l.estado_liquidacion = @estado');
    countRequest.input('estado', sql.VarChar(30), params.estado);
    dataRequest.input('estado', sql.VarChar(30), params.estado);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const offset = (params.page - 1) * params.pageSize;
  dataRequest.input('offset', sql.Int, offset);
  dataRequest.input('pageSize', sql.Int, params.pageSize);

  const countResult = await countRequest.query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM dbo.LiquidacionProveedor l ${where}`,
  );
  const dataResult = await dataRequest.query<LiquidacionRow>(
    `${LIQUIDACION_SELECT}
     ${where}
     ORDER BY l.fecha_generacion_liquidacion_proveedor DESC, l.ID_liquidacion DESC
     OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
  );

  return { rows: dataResult.recordset, total: countResult.recordset[0]?.total ?? 0 };
}
