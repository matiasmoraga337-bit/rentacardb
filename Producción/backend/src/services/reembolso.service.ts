import * as reembolsoRepo from '../repositories/reembolso.repository';
import * as reservaRepo from '../repositories/reserva.repository';
import { type CrearReembolsoInput } from '../schemas/reembolso.schema';
import { AppError } from '../utils/AppError';
import { assertAccesoReserva } from './reserva.service';

const esAdmin = (roles: string[]): boolean => roles.includes('ADMIN');

export async function crearReembolso(
  input: CrearReembolsoInput,
  idUsuario: number,
  roles: string[],
): Promise<reembolsoRepo.ReembolsoCompleto | null> {
  if (!esAdmin(roles)) {
    throw new AppError(403, 'FORBIDDEN', 'Solo un ADMIN puede crear reembolsos manuales.');
  }

  const acceso = await assertAccesoReserva(input.ID_reserva, idUsuario, roles);
  return reembolsoRepo.crearReembolso({
    ID_reserva: input.ID_reserva,
    monto: input.monto,
    motivo: input.motivo,
    idempotency_key: input.idempotency_key,
    ID_usuario: acceso.idCliente,
  });
}

export async function completarReembolso(
  idReembolso: number,
  idUsuario: number,
  roles: string[],
  referenciaExterna?: string | null,
): Promise<reembolsoRepo.ReembolsoCompleto | null> {
  if (!esAdmin(roles)) {
    throw new AppError(403, 'FORBIDDEN', 'Solo un ADMIN puede completar reembolsos manuales.');
  }

  const acceso = await reembolsoRepo.obtenerAccesoReembolso(idReembolso);
  if (!acceso) {
    throw new AppError(404, 'REEMBOLSO_NO_ENCONTRADO', 'Reembolso no encontrado.');
  }

  return reembolsoRepo.completarReembolso(
    idReembolso,
    acceso.idCliente,
    referenciaExterna ?? null,
  );
}

export async function listarReembolsos(
  idReserva: number,
  idUsuario: number,
  roles: string[],
): Promise<reservaRepo.ReembolsoRow[]> {
  await assertAccesoReserva(idReserva, idUsuario, roles);
  return reservaRepo.listarReembolsosReserva(idReserva);
}
