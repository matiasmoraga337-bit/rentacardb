import sql from 'mssql';
import { getPool } from '../config/db';

export interface RegistrarPagoParams {
  ID_reserva: number;
  ID_tipo_operacion_pago: number;
  ID_metodo_pago: number;
  monto_pago: number;
  aprobado: boolean;
  referencia?: string | null;
  ID_arriendo?: number | null;
  ID_cargo_extra?: number | null;
}

export interface PagoRow {
  id: number;
  reservaId: number;
  arriendoId: number | null;
  cargoExtraId: number | null;
  tipoOperacion: string;
  metodo: string;
  estado: string;
  monto: number;
  moneda: string;
  referencia: string | null;
  fechaPago: string | null;
  fechaConfirmacion: string | null;
}

export interface TransaccionWebPayRow {
  idTransaccion: number;
  token: string;
  monto: number;
  estadoTransaccion: string;
  idPago: number;
  idReserva: number;
  idCliente: number;
  idProveedor: number;
  estadoReserva: string;
  totalReserva: number;
}

export interface IniciarWebPayResult {
  ID_pago: number;
  token_ws: string;
  url: string;
}

export async function registrarPago(params: RegistrarPagoParams): Promise<PagoRow | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_reserva', sql.Int, params.ID_reserva)
    .input('ID_tipo_operacion_pago', sql.Int, params.ID_tipo_operacion_pago)
    .input('ID_metodo_pago', sql.Int, params.ID_metodo_pago)
    .input('monto_pago', sql.Decimal(14, 2), params.monto_pago)
    .input('aprobado', sql.Bit, params.aprobado)
    .input('referencia', sql.VarChar(100), params.referencia ?? null)
    .input('ID_arriendo', sql.Int, params.ID_arriendo ?? null)
    .input('ID_cargo_extra', sql.Int, params.ID_cargo_extra ?? null)
    .execute('u_sp_RegistrarPago');
  const row = result.recordset[0] as { ID_pago: number } | undefined;
  if (!row) return null;
  return obtenerPagoPorId(row.ID_pago);
}

export async function obtenerPagoPorId(idPago: number): Promise<PagoRow | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idPago)
    .query<PagoRow>(
      `SELECT p.ID_pago AS id,
              p.ID_reserva_pago AS reservaId,
              p.ID_arriendo_pago AS arriendoId,
              p.ID_cargo_extra_pago AS cargoExtraId,
              topg.nombre_tipo_operacion_pago AS tipoOperacion,
              mp.nombre_metodo_pago AS metodo,
              ep.nombre_estado_pago AS estado,
              p.monto_pago AS monto,
              p.moneda_pago AS moneda,
              p.referencia_proveedor_pago AS referencia,
              p.fecha_pago AS fechaPago,
              p.fecha_confirmacion_pago AS fechaConfirmacion
       FROM dbo.Pago p
       INNER JOIN dbo.TipoOperacionPago topg
         ON topg.ID_tipo_operacion_pago = p.ID_tipo_operacion_pago_pago
       INNER JOIN dbo.MetodoPago mp ON mp.ID_metodo_pago = p.ID_metodo_pago_pago
       INNER JOIN dbo.EstadoPago ep ON ep.ID_estado_pago = p.ID_estado_pago_pago
       WHERE p.ID_pago = @id`,
    );
  return result.recordset[0] ?? null;
}

export async function listarPagosReserva(idReserva: number): Promise<PagoRow[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idReserva)
    .query<PagoRow>(
      `SELECT p.ID_pago AS id,
              p.ID_reserva_pago AS reservaId,
              p.ID_arriendo_pago AS arriendoId,
              p.ID_cargo_extra_pago AS cargoExtraId,
              topg.nombre_tipo_operacion_pago AS tipoOperacion,
              mp.nombre_metodo_pago AS metodo,
              ep.nombre_estado_pago AS estado,
              p.monto_pago AS monto,
              p.moneda_pago AS moneda,
              p.referencia_proveedor_pago AS referencia,
              p.fecha_pago AS fechaPago,
              p.fecha_confirmacion_pago AS fechaConfirmacion
       FROM dbo.Pago p
       INNER JOIN dbo.TipoOperacionPago topg
         ON topg.ID_tipo_operacion_pago = p.ID_tipo_operacion_pago_pago
       INNER JOIN dbo.MetodoPago mp ON mp.ID_metodo_pago = p.ID_metodo_pago_pago
       INNER JOIN dbo.EstadoPago ep ON ep.ID_estado_pago = p.ID_estado_pago_pago
       WHERE p.ID_reserva_pago = @id
       ORDER BY p.ID_pago DESC`,
    );
  return result.recordset;
}

export async function iniciarWebPay(
  idReserva: number,
  monto: number,
): Promise<IniciarWebPayResult | null> {
  const pool = await getPool();
  const request = pool
    .request()
    .input('ID_reserva', sql.Int, idReserva)
    .input('monto', sql.Decimal(12, 2), monto)
    .output('token_ws', sql.Char(64))
    .output('url_redireccion', sql.VarChar(200));
  const result = await request.execute('u_sp_WebPay_IniciarTransaccion');
  const row = result.recordset[0] as { ID_pago: number } | undefined;
  const token = result.output.token_ws as string | undefined;
  const url = result.output.url_redireccion as string | undefined;
  if (!row || !token || !url) return null;
  return { ID_pago: row.ID_pago, token_ws: token.trim(), url };
}

export async function confirmarWebPay(
  tokenWs: string,
  aprobada: boolean,
): Promise<{
  ID_transaccion_simulada: number;
  ID_pago: number;
  ID_reserva: number;
  aprobada: boolean;
} | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('token_ws', sql.Char(64), tokenWs)
    .input('aprobada', sql.Bit, aprobada)
    .execute('u_sp_WebPay_ConfirmarTransaccion');
  return (
    (result.recordset[0] as
      | {
          ID_transaccion_simulada: number;
          ID_pago: number;
          ID_reserva: number;
          aprobada: boolean;
        }
      | undefined) ?? null
  );
}

export async function obtenerTransaccionPorToken(
  tokenWs: string,
): Promise<TransaccionWebPayRow | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('token', sql.Char(64), tokenWs)
    .query<TransaccionWebPayRow>(
      `SELECT t.ID_transaccion_simulada AS idTransaccion,
              LTRIM(RTRIM(t.token_ws_transaccion_simulada)) AS token,
              t.monto_transaccion_simulada AS monto,
              t.estado_transaccion_simulada AS estadoTransaccion,
              p.ID_pago AS idPago,
              p.ID_reserva_pago AS idReserva,
              r.ID_usuario_cliente_reserva AS idCliente,
              v.ID_proveedor_vehiculo AS idProveedor,
              er.nombre_estado_reserva AS estadoReserva,
              r.monto_total_reserva AS totalReserva
       FROM dbo.PagoTransaccionSimulada t
       INNER JOIN dbo.Pago p ON p.ID_pago = t.ID_pago_transaccion_simulada
       INNER JOIN dbo.Reserva r ON r.ID_reserva = p.ID_reserva_pago
       INNER JOIN dbo.Vehiculo v ON v.ID_vehiculo = r.ID_vehiculo_reserva
       INNER JOIN dbo.EstadoReserva er ON er.ID_estado_reserva = r.ID_estado_reserva_reserva
       WHERE t.token_ws_transaccion_simulada = @token`,
    );
  return result.recordset[0] ?? null;
}

export async function reporteIngresos(
  anio: number,
  idProveedor?: number,
): Promise<unknown[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('anio', sql.Int, anio)
    .input('ID_proveedor', sql.Int, idProveedor ?? null)
    .execute('u_sp_ReporteIngresosMensuales');
  return result.recordset;
}
