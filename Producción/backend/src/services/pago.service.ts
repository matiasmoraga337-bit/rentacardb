import * as pagoRepo from '../repositories/pago.repository';
import { type ConfirmarWebPayInput, type RegistrarPagoInput } from '../schemas/pago.schema';
import { AppError } from '../utils/AppError';
import { assertAccesoReserva } from './reserva.service';

const esAdmin = (roles: string[]): boolean => roles.includes('ADMIN');

function assertClientePropietario(idCliente: number, idUsuario: number, roles: string[]): void {
  if (esAdmin(roles)) return;
  if (idCliente !== idUsuario) {
    throw new AppError(403, 'FORBIDDEN', 'No tiene acceso a esta reserva.');
  }
}

export async function registrarPago(input: RegistrarPagoInput): Promise<pagoRepo.PagoRow | null> {
  return pagoRepo.registrarPago({
    ID_reserva: input.ID_reserva,
    ID_tipo_operacion_pago: input.ID_tipo_operacion_pago,
    ID_metodo_pago: input.ID_metodo_pago,
    monto_pago: input.monto_pago,
    aprobado: input.aprobado,
    referencia: input.referencia ?? null,
    ID_arriendo: input.ID_arriendo ?? null,
    ID_cargo_extra: input.ID_cargo_extra ?? null,
  });
}

export async function listarPagos(
  idReserva: number,
  idUsuario: number,
  roles: string[],
): Promise<pagoRepo.PagoRow[]> {
  await assertAccesoReserva(idReserva, idUsuario, roles);
  return pagoRepo.listarPagosReserva(idReserva);
}

export async function iniciarWebPay(
  idReserva: number,
  idUsuario: number,
  roles: string[],
): Promise<{
  ID_pago: number;
  token_ws: string;
  url: string;
  monto: number;
  ID_reserva: number;
}> {
  const acceso = await assertAccesoReserva(idReserva, idUsuario, roles);
  assertClientePropietario(acceso.idCliente, idUsuario, roles);

  if (acceso.estado !== 'PENDIENTE') {
    throw new AppError(
      409,
      'RESERVA_NO_PENDIENTE',
      `La reserva esta en estado ${acceso.estado}; no se puede iniciar el pago.`,
    );
  }
  if (acceso.expirada) {
    throw new AppError(
      409,
      'RESERVA_EXPIRADA',
      'La reserva expiro; crea una nueva reserva para continuar.',
    );
  }
  if (!(acceso.total > 0)) {
    throw new AppError(409, 'MONTO_INVALIDO', 'La reserva no tiene un monto valido.');
  }

  const result = await pagoRepo.iniciarWebPay(idReserva, acceso.total);
  if (!result) {
    throw new AppError(500, 'WEBPAY_NO_INICIADO', 'No se pudo iniciar la transaccion WebPay.');
  }
  return { ...result, monto: acceso.total, ID_reserva: idReserva };
}

export async function obtenerTransaccion(
  tokenWs: string,
  idUsuario: number,
  roles: string[],
): Promise<pagoRepo.TransaccionWebPayRow> {
  const tx = await pagoRepo.obtenerTransaccionPorToken(tokenWs);
  if (!tx) {
    throw new AppError(404, 'TRANSACCION_NO_ENCONTRADA', 'Transaccion WebPay no encontrada.');
  }
  assertClientePropietario(tx.idCliente, idUsuario, roles);
  return tx;
}

export async function confirmarWebPay(
  input: ConfirmarWebPayInput,
  idUsuario: number,
  roles: string[],
): Promise<{
  ID_transaccion_simulada: number;
  ID_pago: number;
  ID_reserva: number;
  aprobada: boolean;
}> {
  const tx = await pagoRepo.obtenerTransaccionPorToken(input.token_ws);
  if (!tx) {
    throw new AppError(404, 'TRANSACCION_NO_ENCONTRADA', 'Transaccion WebPay no encontrada.');
  }
  assertClientePropietario(tx.idCliente, idUsuario, roles);
  if (tx.estadoTransaccion !== 'CREADA') {
    throw new AppError(409, 'TRANSACCION_YA_RESUELTA', 'La transaccion ya fue resuelta.');
  }

  const result = await pagoRepo.confirmarWebPay(input.token_ws, input.aprobada);
  if (!result) {
    throw new AppError(500, 'WEBPAY_NO_CONFIRMADO', 'No se pudo confirmar la transaccion WebPay.');
  }
  return result;
}

export async function reporteIngresos(anio: number, idProveedor?: number): Promise<unknown[]> {
  return pagoRepo.reporteIngresos(anio, idProveedor);
}
