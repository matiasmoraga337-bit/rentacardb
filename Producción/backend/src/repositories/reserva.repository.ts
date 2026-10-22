import sql from 'mssql';
import { getPool } from '../config/db';

export interface CrearReservaParams {
  ID_usuario_cliente: number;
  ID_vehiculo: number;
  ID_sede_retiro: number;
  ID_sede_devolucion: number;
  fecha_inicio: string;
  fecha_fin: string;
  observaciones?: string | null;
  ID_politica_cancelacion?: number | null;
  politica_combustible?: string;
  km_incluidos_dia?: number | null;
  cargo_km_excedido?: number | null;
  idempotency_key: string;
}

export interface CancelarReservaParams {
  ID_reserva: number;
  ID_usuario: number;
  motivo: string;
  monto_reembolso: number | null;
  motivo_reembolso: string | null;
  idempotency_key: string | null;
  referencia_externa: string | null;
}

export interface ReservaViewRow {
  ID_reserva: number;
  ID_usuario_cliente_reserva: number;
  ID_sede_retiro_reserva: number;
  ID_sede_devolucion_reserva: number;
  fecha_inicio_reserva: string;
  fecha_fin_reserva: string;
  precio_diario_aplicado_reserva: number;
  porcentaje_impuesto_aplicado_reserva: number;
  monto_subtotal_reserva: number;
  monto_descuento_reserva: number;
  monto_impuesto_reserva: number;
  monto_total_reserva: number;
  nombre_cliente: string;
  email_usuario: string;
  ID_vehiculo: number;
  patente_vehiculo: string;
  nombre_modelo: string;
  nombre_marca: string;
  ID_proveedor: number;
  nombre_comercial_proveedor: string;
  sede_retiro: string;
  sede_devolucion: string;
  nombre_estado_reserva: string;
  ID_arriendo: number | null;
  estado_arriendo: string | null;
  resenado: number;
  nombre_estado_pago: string | null;
  nombre_metodo_pago: string | null;
  nombre_tipo_operacion_pago: string | null;
  monto_pago: number | null;
  fecha_pago: string | null;
  fecha_reserva: string;
  fecha_expiracion_reserva: string | null;
  observaciones_reserva: string | null;
}

export interface ReservaAcceso {
  idCliente: number;
  idProveedor: number;
  estado: string;
  total: number;
  fechaInicio: string;
  fechaFin: string;
  fechaExpiracion: string | null;
  expirada: boolean;
  idPolitica: number | null;
}

export interface CancelacionInfo {
  idCliente: number;
  idProveedor: number;
  estado: string;
  total: number;
  fechaInicio: string;
  diasHastaInicio: number;
  politica: string | null;
  descripcionPolitica: string | null;
  diasAnticipacion: number | null;
  porcentajeReembolso: number | null;
  pagado: number;
  reembolsado: number;
}

export type ScopeReservas = 'cliente' | 'proveedor' | 'todos';

export interface ListarReservasParams {
  scope: ScopeReservas;
  idUsuario: number;
  estado?: string;
  page: number;
  pageSize: number;
}

const RESERVA_VIEW_SELECT = `
  SELECT vd.*,
         r.ID_usuario_cliente_reserva,
         r.ID_sede_retiro_reserva,
         r.ID_sede_devolucion_reserva,
         r.fecha_reserva,
         r.fecha_expiracion_reserva,
         r.observaciones_reserva
  FROM dbo.vw_ReservasDetalle vd
  INNER JOIN dbo.Reserva r ON r.ID_reserva = vd.ID_reserva
`;

/**
 * Los SP orquestadores (crear/cancelar) devuelven varios recordsets:
 * snapshots, reembolsos y filas de Reserva. La vista de detalle es la unica
 * que incluye patente + nombre de estado; se selecciona explicitamente.
 */
function extraerReservaView(recordsets: unknown[][]): ReservaViewRow | null {
  for (const recordset of recordsets) {
    const row = recordset.find(
      (item) =>
        item !== null &&
        typeof item === 'object' &&
        'ID_reserva' in item &&
        'patente_vehiculo' in item &&
        'nombre_estado_reserva' in item,
    );
    if (row) return row as ReservaViewRow;
  }
  return null;
}

export async function crearReserva(params: CrearReservaParams): Promise<ReservaViewRow | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_usuario_cliente', sql.Int, params.ID_usuario_cliente)
    .input('ID_vehiculo', sql.Int, params.ID_vehiculo)
    .input('ID_sede_retiro', sql.Int, params.ID_sede_retiro)
    .input('ID_sede_devolucion', sql.Int, params.ID_sede_devolucion)
    .input('fecha_inicio', sql.Date, params.fecha_inicio)
    .input('fecha_fin', sql.Date, params.fecha_fin)
    .input('observaciones', sql.NVarChar(500), params.observaciones ?? null)
    .input('ID_politica_cancelacion', sql.Int, params.ID_politica_cancelacion ?? null)
    .input('politica_combustible', sql.VarChar(30), params.politica_combustible ?? 'MISMO_NIVEL')
    .input('km_incluidos_dia', sql.Int, params.km_incluidos_dia ?? null)
    .input('cargo_km_excedido', sql.Decimal(12, 2), params.cargo_km_excedido ?? null)
    .input('idempotency_key', sql.VarChar(100), params.idempotency_key)
    .execute<ReservaViewRow>('u_sp_CrearReserva');
  return extraerReservaView(result.recordsets as unknown[][]);
}

function construirFiltros(params: ListarReservasParams): { where: string; inputs: Record<string, unknown> } {
  const condiciones: string[] = [];
  const inputs: Record<string, unknown> = {};

  if (params.scope === 'cliente') {
    condiciones.push('r.ID_usuario_cliente_reserva = @idUsuario');
    inputs.idUsuario = params.idUsuario;
  } else if (params.scope === 'proveedor') {
    condiciones.push(`EXISTS (
      SELECT 1 FROM dbo.ProveedorUsuario pu
      WHERE pu.ID_usuario_proveedor_usuario = @idUsuario
        AND pu.ID_proveedor_proveedor_usuario = vd.ID_proveedor
    )`);
    inputs.idUsuario = params.idUsuario;
  }

  if (params.estado) {
    condiciones.push('vd.nombre_estado_reserva = @estado');
    inputs.estado = params.estado;
  }

  return {
    where: condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '',
    inputs,
  };
}

export async function listarReservas(
  params: ListarReservasParams,
): Promise<{ rows: ReservaViewRow[]; total: number }> {
  const pool = await getPool();
  const { where, inputs } = construirFiltros(params);
  const offset = (params.page - 1) * params.pageSize;

  const countRequest = pool.request();
  const dataRequest = pool.request();
  for (const [name, value] of Object.entries(inputs)) {
    const type = name === 'idUsuario' ? sql.Int : sql.VarChar(50);
    countRequest.input(name, type, value);
    dataRequest.input(name, type, value);
  }
  dataRequest.input('offset', sql.Int, offset);
  dataRequest.input('pageSize', sql.Int, params.pageSize);

  const countResult = await countRequest.query<{ total: number }>(
    `SELECT COUNT(*) AS total
     FROM dbo.vw_ReservasDetalle vd
     INNER JOIN dbo.Reserva r ON r.ID_reserva = vd.ID_reserva
     ${where}`,
  );

  const dataResult = await dataRequest.query<ReservaViewRow>(
    `${RESERVA_VIEW_SELECT}
     ${where}
     ORDER BY vd.fecha_inicio_reserva DESC, vd.ID_reserva DESC
     OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
  );

  return { rows: dataResult.recordset, total: countResult.recordset[0]?.total ?? 0 };
}

export async function obtenerReservaView(idReserva: number): Promise<ReservaViewRow | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idReserva)
    .query<ReservaViewRow>(`${RESERVA_VIEW_SELECT} WHERE vd.ID_reserva = @id`);
  return result.recordset[0] ?? null;
}

export async function obtenerAccesoReserva(idReserva: number): Promise<ReservaAcceso | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idReserva)
    .query<ReservaAcceso>(
      `SELECT r.ID_usuario_cliente_reserva AS idCliente,
              v.ID_proveedor_vehiculo AS idProveedor,
              er.nombre_estado_reserva AS estado,
              r.monto_total_reserva AS total,
              CONVERT(char(10), r.fecha_inicio_reserva, 23) AS fechaInicio,
              CONVERT(char(10), r.fecha_fin_reserva, 23) AS fechaFin,
              r.fecha_expiracion_reserva AS fechaExpiracion,
              CAST(CASE WHEN r.fecha_expiracion_reserva IS NOT NULL
                         AND r.fecha_expiracion_reserva <= SYSDATETIME()
                        THEN 1 ELSE 0 END AS BIT) AS expirada,
              r.ID_politica_cancelacion_reserva AS idPolitica
       FROM dbo.Reserva r
       INNER JOIN dbo.Vehiculo v ON v.ID_vehiculo = r.ID_vehiculo_reserva
       INNER JOIN dbo.EstadoReserva er ON er.ID_estado_reserva = r.ID_estado_reserva_reserva
       WHERE r.ID_reserva = @id`,
    );
  return result.recordset[0] ?? null;
}

export async function obtenerCancelacionInfo(idReserva: number): Promise<CancelacionInfo | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idReserva)
    .query<CancelacionInfo>(
      `SELECT r.ID_usuario_cliente_reserva AS idCliente,
              v.ID_proveedor_vehiculo AS idProveedor,
              er.nombre_estado_reserva AS estado,
              r.monto_total_reserva AS total,
              CONVERT(char(10), r.fecha_inicio_reserva, 23) AS fechaInicio,
              DATEDIFF(DAY, CAST(GETDATE() AS DATE), r.fecha_inicio_reserva) AS diasHastaInicio,
              pc.nombre_politica_cancelacion AS politica,
              pc.descripcion_politica_cancelacion AS descripcionPolitica,
              pc.dias_anticipacion_reembolso AS diasAnticipacion,
              pc.porcentaje_reembolso AS porcentajeReembolso,
              (SELECT ISNULL(SUM(p.monto_pago), 0)
               FROM dbo.Pago p
               INNER JOIN dbo.EstadoPago ep ON ep.ID_estado_pago = p.ID_estado_pago_pago
               WHERE p.ID_reserva_pago = r.ID_reserva
                 AND ep.nombre_estado_pago = 'APROBADO') AS pagado,
              (SELECT ISNULL(SUM(rb.monto_reembolso), 0)
               FROM dbo.Reembolso rb
               WHERE rb.ID_reserva_reembolso = r.ID_reserva
                 AND rb.estado_reembolso IN ('PENDIENTE','PROCESANDO','COMPLETADO')) AS reembolsado
       FROM dbo.Reserva r
       INNER JOIN dbo.Vehiculo v ON v.ID_vehiculo = r.ID_vehiculo_reserva
       INNER JOIN dbo.EstadoReserva er ON er.ID_estado_reserva = r.ID_estado_reserva_reserva
       LEFT JOIN dbo.PoliticaCancelacion pc
         ON pc.ID_politica_cancelacion = r.ID_politica_cancelacion_reserva
       WHERE r.ID_reserva = @id`,
    );
  return result.recordset[0] ?? null;
}

export async function existePagoAprobadoReserva(idReserva: number): Promise<boolean> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idReserva)
    .query<{ ok: number }>(
      `SELECT TOP 1 1 AS ok
       FROM dbo.Pago p
       INNER JOIN dbo.EstadoPago ep ON ep.ID_estado_pago = p.ID_estado_pago_pago
       WHERE p.ID_reserva_pago = @id AND ep.nombre_estado_pago = 'APROBADO'`,
    );
  return result.recordset.length > 0;
}

export async function esProveedorDeUsuario(idUsuario: number): Promise<boolean> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idUsuario)
    .query<{ ok: number }>(
      `SELECT TOP 1 1 AS ok FROM dbo.ProveedorUsuario
       WHERE ID_usuario_proveedor_usuario = @id`,
    );
  return result.recordset.length > 0;
}

export async function esProveedorDelVehiculo(
  idProveedor: number,
  idUsuario: number,
): Promise<boolean> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('idProveedor', sql.Int, idProveedor)
    .input('idUsuario', sql.Int, idUsuario)
    .query<{ ok: number }>(
      `SELECT TOP 1 1 AS ok FROM dbo.ProveedorUsuario
       WHERE ID_proveedor_proveedor_usuario = @idProveedor
         AND ID_usuario_proveedor_usuario = @idUsuario`,
    );
  return result.recordset.length > 0;
}

export async function cancelarReserva(
  params: CancelarReservaParams,
): Promise<{ row: ReservaViewRow | null; fueIdempotente: boolean }> {
  const pool = await getPool();
  const request = pool
    .request()
    .input('ID_reserva', sql.Int, params.ID_reserva)
    .input('ID_usuario', sql.Int, params.ID_usuario)
    .input('motivo', sql.NVarChar(500), params.motivo)
    .input('monto_reembolso', sql.Decimal(14, 2), params.monto_reembolso)
    .input('motivo_reembolso', sql.NVarChar(500), params.motivo_reembolso)
    .input('idempotency_key', sql.VarChar(100), params.idempotency_key)
    .input('referencia_externa', sql.VarChar(150), params.referencia_externa)
    .output('fue_idempotente', sql.Bit);
  const result = await request.execute<ReservaViewRow>('u_sp_CancelarReserva');
  return {
    row: extraerReservaView(result.recordsets as unknown[][]),
    fueIdempotente: Boolean(result.output.fue_idempotente),
  };
}

export async function cambiarEstadoReserva(
  idReserva: number,
  nuevoEstado: string,
  evento: string,
  idUsuario: number,
  motivo: string | null,
): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('ID_reserva', sql.Int, idReserva)
    .input('nuevo_estado', sql.VarChar(50), nuevoEstado)
    .input('evento', sql.VarChar(60), evento)
    .input('ID_usuario', sql.Int, idUsuario)
    .input('motivo', sql.NVarChar(500), motivo)
    .input('gestionar_transaccion', sql.Bit, 1)
    .execute('u_sp_CambiarEstadoReserva');
}

export async function expirarReservas(): Promise<void> {
  const pool = await getPool();
  await pool.request().execute('u_sp_ExpirarReservas');
}

export interface HistorialRow {
  id: number;
  estadoAnterior: string | null;
  estadoNuevo: string;
  evento: string | null;
  motivo: string | null;
  fecha: string;
  idUsuario: number | null;
  usuario: string | null;
}

export async function listarHistorial(idReserva: number): Promise<HistorialRow[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idReserva)
    .query<HistorialRow>(
      `SELECT h.ID_historial AS id,
              ea.nombre_estado_reserva AS estadoAnterior,
              en.nombre_estado_reserva AS estadoNuevo,
              h.evento_historial_estado_reserva AS evento,
              h.motivo_historial_estado_reserva AS motivo,
              h.fecha_historial AS fecha,
              h.ID_usuario_historial AS idUsuario,
              CONCAT(p.nombres_persona, ' ', p.apellido_paterno_persona) AS usuario
       FROM dbo.HistorialEstadoReserva h
       LEFT JOIN dbo.EstadoReserva ea
         ON ea.ID_estado_reserva = h.ID_estado_anterior_historial_estado_reserva
       INNER JOIN dbo.EstadoReserva en
         ON en.ID_estado_reserva = h.ID_estado_nuevo_historial_estado_reserva
       LEFT JOIN dbo.Usuario u ON u.ID_usuario = h.ID_usuario_historial
       LEFT JOIN dbo.Persona p ON p.ID_persona = u.ID_persona_usuario
       WHERE h.ID_reserva_historial = @id
       ORDER BY h.fecha_historial, h.ID_historial`,
    );
  return result.recordset;
}

export interface SnapshotRow {
  ID_snapshot: number;
  version_snapshot: number;
  precio_dia_reserva_snapshot: number;
  cantidad_dias_reserva_snapshot: number;
  subtotal_reserva_snapshot: number;
  descuento_reserva_snapshot: number;
  impuesto_reserva_snapshot: number;
  total_reserva_snapshot: number;
  porcentaje_impuesto_reserva_snapshot: number;
  porcentaje_comision_reserva_snapshot: number | null;
  nombre_tarifa_reserva_snapshot: string | null;
  politica_cancelacion_reserva_snapshot: string | null;
  hash_snapshot: string | null;
  fecha_snapshot: string;
}

export async function listarSnapshots(idReserva: number): Promise<SnapshotRow[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idReserva)
    .query<SnapshotRow>(
      `SELECT ID_snapshot,
              version_snapshot,
              precio_dia_reserva_snapshot,
              cantidad_dias_reserva_snapshot,
              subtotal_reserva_snapshot,
              descuento_reserva_snapshot,
              impuesto_reserva_snapshot,
              total_reserva_snapshot,
              porcentaje_impuesto_reserva_snapshot,
              porcentaje_comision_reserva_snapshot,
              nombre_tarifa_reserva_snapshot,
              politica_cancelacion_reserva_snapshot,
              hash_snapshot,
              fecha_snapshot
       FROM dbo.ReservaSnapshot
       WHERE ID_reserva_snapshot = @id
       ORDER BY version_snapshot DESC`,
    );
  return result.recordset;
}

export interface ReembolsoRow {
  id: number;
  monto: number;
  moneda: string;
  estado: string;
  motivo: string | null;
  referenciaExterna: string | null;
  fechaSolicitud: string;
  fechaProcesamiento: string | null;
}

export async function listarReembolsosReserva(idReserva: number): Promise<ReembolsoRow[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, idReserva)
    .query<ReembolsoRow>(
      `SELECT ID_reembolso AS id,
              monto_reembolso AS monto,
              moneda_reembolso AS moneda,
              estado_reembolso AS estado,
              motivo_reembolso AS motivo,
              referencia_externa_reembolso AS referenciaExterna,
              fecha_solicitud_reembolso AS fechaSolicitud,
              fecha_procesamiento_reembolso AS fechaProcesamiento
       FROM dbo.Reembolso
       WHERE ID_reserva_reembolso = @id
       ORDER BY ID_reembolso DESC`,
    );
  return result.recordset;
}
