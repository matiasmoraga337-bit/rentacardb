import sql from 'mssql';
import { getPool } from '../config/db';

export interface CrearReembolsoParams {
  ID_reserva: number;
  monto: number;
  motivo: string;
  idempotency_key: string;
  ID_usuario: number;
}

export interface ReembolsoCompleto {
  id: number;
  reservaId: number;
  monto: number;
  moneda: string;
  estado: string;
  motivo: string | null;
  referenciaExterna: string | null;
  idempotencyKey: string;
  fechaSolicitud: string;
  fechaProcesamiento: string | null;
}

interface ReembolsoRaw {
  ID_reembolso: number;
  ID_reserva_reembolso: number;
  monto_reembolso: number;
  moneda_reembolso: string;
  estado_reembolso: string;
  motivo_reembolso: string | null;
  referencia_externa_reembolso: string | null;
  idempotency_key_reembolso: string;
  fecha_solicitud_reembolso: string;
  fecha_procesamiento_reembolso: string | null;
}

function mapReembolso(row: ReembolsoRaw): ReembolsoCompleto {
  return {
    id: row.ID_reembolso,
    reservaId: row.ID_reserva_reembolso,
    monto: row.monto_reembolso,
    moneda: row.moneda_reembolso,
    estado: row.estado_reembolso,
    motivo: row.motivo_reembolso,
    referenciaExterna: row.referencia_externa_reembolso,
    idempotencyKey: row.idempotency_key_reembolso,
    fechaSolicitud: row.fecha_solicitud_reembolso,
    fechaProcesamiento: row.fecha_procesamiento_reembolso,
  };
}

export async function crearReembolso(
  params: CrearReembolsoParams,
): Promise<ReembolsoCompleto | null> {
  const pool = await getPool();
  const request = pool
    .request()
    .input('ID_reserva', sql.Int, params.ID_reserva)
    .input('monto', sql.Decimal(14, 2), params.monto)
    .input('motivo', sql.NVarChar(500), params.motivo)
    .input('idempotency_key', sql.VarChar(100), params.idempotency_key)
    .input('ID_usuario', sql.Int, params.ID_usuario)
    .input('gestionar_transaccion', sql.Bit, 1)
    .output('ID_reembolso_creado', sql.BigInt);
  const result = await request.execute('u_sp_CrearReembolso');
  const row = result.recordset[0] as ReembolsoRaw | undefined;
  return row ? mapReembolso(row) : null;
}

export async function completarReembolso(
  idReembolso: number,
  idUsuario: number,
  referenciaExterna?: string | null,
): Promise<ReembolsoCompleto | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ID_reembolso', sql.BigInt, idReembolso)
    .input('referencia_externa', sql.VarChar(150), referenciaExterna ?? null)
    .input('ID_usuario', sql.Int, idUsuario)
    .input('gestionar_transaccion', sql.Bit, 1)
    .execute('u_sp_MarcarReembolsoCompletado');
  const row = result.recordset[0] as ReembolsoRaw | undefined;
  return row ? mapReembolso(row) : null;
}

export interface AccesoReembolso {
  idCliente: number;
  idReserva: number;
}

export async function obtenerAccesoReembolso(
  idReembolso: number,
): Promise<AccesoReembolso | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.BigInt, idReembolso)
    .query<AccesoReembolso>(
      `SELECT r.ID_usuario_cliente_reserva AS idCliente,
              rb.ID_reserva_reembolso AS idReserva
       FROM dbo.Reembolso rb
       INNER JOIN dbo.Reserva r ON r.ID_reserva = rb.ID_reserva_reembolso
       WHERE rb.ID_reembolso = @id`,
    );
  return result.recordset[0] ?? null;
}
