import sql from 'mssql';
import { getPool } from '../config/db';

export interface VehiculoPublicadoRow {
  id: number;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  precioDiario: number;
  proveedor: string;
  sede: string | null;
  comuna: string | null;
  region: string | null;
  urlFoto: string | null;
}

export interface PagoPendienteRow {
  id: number;
  reservaId: number;
  monto: number;
  moneda: string;
  estado: string;
  metodo: string;
  fecha: string | null;
  referencia: string | null;
}

export interface DocumentoVencidoRow {
  id: number;
  vehiculoId: number;
  patente: string;
  tipo: string;
  vence: string;
  diasParaVencer: number;
}

function normalizarLimite(value: number, fallback: number): number {
  if (!Number.isInteger(value) || value <= 0) return fallback;
  return Math.min(value, 100);
}

export async function listarVehiculosPublicados(
  limit = 10,
): Promise<{ total: number; rows: VehiculoPublicadoRow[] }> {
  const pool = await getPool();
  const limite = normalizarLimite(limit, 10);
  const count = await pool
    .request()
    .query<{ total: number }>('SELECT COUNT(*) AS total FROM dbo.vw_VehiculosPublicados');
  const data = await pool
    .request()
    .input('limit', sql.Int, limite)
    .query<VehiculoPublicadoRow>(
      `SELECT TOP (@limit)
              ID_vehiculo AS id,
              patente_vehiculo AS patente,
              nombre_marca AS marca,
              nombre_modelo AS modelo,
              anio_vehiculo AS anio,
              precio_diario_base_vehiculo AS precioDiario,
              nombre_comercial_proveedor AS proveedor,
              nombre_sede_proveedor AS sede,
              nombre_comuna AS comuna,
              nombre_region AS region,
              url_foto_principal AS urlFoto
       FROM dbo.vw_VehiculosPublicados
       ORDER BY nombre_marca, nombre_modelo, ID_vehiculo`,
    );
  return { total: count.recordset[0]?.total ?? 0, rows: data.recordset };
}

export async function listarPagosPendientes(
  limit = 10,
): Promise<{ total: number; rows: PagoPendienteRow[] }> {
  const pool = await getPool();
  const limite = normalizarLimite(limit, 10);
  const count = await pool
    .request()
    .query<{ total: number }>('SELECT COUNT(*) AS total FROM dbo.vw_PagosPendientes');
  const data = await pool
    .request()
    .input('limit', sql.Int, limite)
    .query<PagoPendienteRow>(
      `SELECT TOP (@limit)
              ID_pago AS id,
              ID_reserva_pago AS reservaId,
              monto_pago AS monto,
              moneda_pago AS moneda,
              nombre_estado_pago AS estado,
              nombre_metodo_pago AS metodo,
              fecha_pago AS fecha,
              referencia_proveedor_pago AS referencia
       FROM dbo.vw_PagosPendientes
       ORDER BY fecha_pago DESC, ID_pago DESC`,
    );
  return { total: count.recordset[0]?.total ?? 0, rows: data.recordset };
}

export async function listarDocumentosVencidos(
  idProveedor?: number,
): Promise<{ total: number; rows: DocumentoVencidoRow[] }> {
  const pool = await getPool();
  const request = pool
    .request()
    .input('idProveedor', sql.Int, idProveedor ?? null);
  const result = await request.query<DocumentoVencidoRow>(
    `SELECT dv.ID_documento_vehiculo AS id,
            dv.ID_vehiculo AS vehiculoId,
            dv.patente_vehiculo AS patente,
            dv.nombre_tipo_documento AS tipo,
            dv.fecha_vencimiento_documento AS vence,
            dv.dias_para_vencer AS diasParaVencer
     FROM dbo.vw_DocumentosVencidos dv
     INNER JOIN dbo.Vehiculo v ON v.ID_vehiculo = dv.ID_vehiculo
     WHERE @idProveedor IS NULL OR v.ID_proveedor_vehiculo = @idProveedor
     ORDER BY dv.dias_para_vencer, dv.patente_vehiculo, dv.ID_documento_vehiculo`,
  );
  return { total: result.recordset.length, rows: result.recordset };
}

export async function listarDocumentosVencidosProveedor(
  idUsuario: number,
): Promise<{ total: number; rows: DocumentoVencidoRow[] }> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('idUsuario', sql.Int, idUsuario)
    .query<DocumentoVencidoRow>(
      `SELECT dv.ID_documento_vehiculo AS id,
              dv.ID_vehiculo AS vehiculoId,
              dv.patente_vehiculo AS patente,
              dv.nombre_tipo_documento AS tipo,
              dv.fecha_vencimiento_documento AS vence,
              dv.dias_para_vencer AS diasParaVencer
       FROM dbo.vw_DocumentosVencidos dv
       INNER JOIN dbo.Vehiculo v ON v.ID_vehiculo = dv.ID_vehiculo
       INNER JOIN dbo.ProveedorUsuario pu
         ON pu.ID_proveedor_proveedor_usuario = v.ID_proveedor_vehiculo
       WHERE pu.ID_usuario_proveedor_usuario = @idUsuario
       ORDER BY dv.dias_para_vencer, dv.patente_vehiculo, dv.ID_documento_vehiculo`,
    );
  return { total: result.recordset.length, rows: result.recordset };
}
