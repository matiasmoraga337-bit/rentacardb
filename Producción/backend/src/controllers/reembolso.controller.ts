import { type Request, type Response } from 'express';
import {
  type CompletarReembolsoInput,
  type CrearReembolsoInput,
  type ListarReembolsosQuery,
} from '../schemas/reembolso.schema';
import * as reembolsoService from '../services/reembolso.service';
import { AppError } from '../utils/AppError';

const parseId = (value: string, name: string): number => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'PARAMETRO_INVALIDO', `El parametro ${name} debe ser un entero positivo.`);
  }
  return id;
};

export async function crear(req: Request, res: Response): Promise<void> {
  res
    .status(201)
    .json(
      await reembolsoService.crearReembolso(
        req.body as CrearReembolsoInput,
        req.user!.id,
        req.user!.roles,
      ),
    );
}

export async function completar(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  const body = req.body as CompletarReembolsoInput;
  res
    .status(200)
    .json(
      await reembolsoService.completarReembolso(
        id,
        req.user!.id,
        req.user!.roles,
        body.referencia_externa,
      ),
    );
}

export async function listar(req: Request, res: Response): Promise<void> {
  const { reserva } = req.query as unknown as ListarReembolsosQuery;
  res
    .status(200)
    .json(await reembolsoService.listarReembolsos(reserva, req.user!.id, req.user!.roles));
}
