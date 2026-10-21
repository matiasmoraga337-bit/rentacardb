import { type Request, type Response } from 'express';
import {
  type CambiarEstadoReservaInput,
  type CancelarReservaInput,
  type CrearReservaInput,
  type ListarReservasQuery,
} from '../schemas/reserva.schema';
import * as reservaService from '../services/reserva.service';
import { AppError } from '../utils/AppError';

const parseId = (value: string, name: string): number => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'PARAMETRO_INVALIDO', `El parametro ${name} debe ser un entero positivo.`);
  }
  return id;
};

function extraerIdempotencyKey(req: Request, obligatoria: boolean): string | null {
  const header = req.get('Idempotency-Key');
  const body = req.body as { idempotency_key?: string } | undefined;
  const key = (header ?? body?.idempotency_key ?? '').trim();
  if (!key) {
    if (obligatoria) {
      throw new AppError(
        400,
        'IDEMPOTENCY_KEY_REQUIRED',
        'Se requiere la cabecera Idempotency-Key para esta operacion.',
      );
    }
    return null;
  }
  if (key.length > 100) {
    throw new AppError(400, 'IDEMPOTENCY_KEY_INVALIDA', 'Idempotency-Key supera 100 caracteres.');
  }
  return key;
}

export async function crear(req: Request, res: Response): Promise<void> {
  const key = extraerIdempotencyKey(req, true) as string;
  const result = await reservaService.crearReserva(
    req.user!.id,
    req.body as CrearReservaInput,
    key,
  );
  res.status(201).json(result);
}

export async function listar(req: Request, res: Response): Promise<void> {
  const result = await reservaService.listarReservas(
    req.user!.id,
    req.user!.roles,
    req.query as unknown as ListarReservasQuery,
  );
  res.status(200).json(result);
}

export async function detalle(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res.status(200).json(await reservaService.obtenerReserva(id, req.user!.id, req.user!.roles));
}

export async function historial(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res.status(200).json(await reservaService.historialReserva(id, req.user!.id, req.user!.roles));
}

export async function snapshot(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res.status(200).json(await reservaService.snapshotReserva(id, req.user!.id, req.user!.roles));
}

export async function previsualizarCancelacion(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res
    .status(200)
    .json(await reservaService.previsualizarCancelacion(id, req.user!.id, req.user!.roles));
}

export async function cancelar(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  const input = req.body as CancelarReservaInput;
  const key = extraerIdempotencyKey(req, input.solicitar_reembolso);
  res
    .status(200)
    .json(await reservaService.cancelarReserva(id, req.user!.id, req.user!.roles, input, key));
}

export async function cambiarEstado(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res
    .status(200)
    .json(
      await reservaService.cambiarEstadoReserva(
        id,
        req.user!.id,
        req.body as CambiarEstadoReservaInput,
      ),
    );
}

export async function expirar(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await reservaService.expirarReservas());
}
