import { type Request, type Response } from 'express';
import type {
  CrearLiquidacionInput,
  ListarLiquidacionesQuery,
} from '../schemas/liquidacion.schema';
import * as liquidacionService from '../services/liquidacion.service';
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
      await liquidacionService.crearLiquidacion(
        req.user!.id,
        req.body as CrearLiquidacionInput,
      ),
    );
}

export async function listar(req: Request, res: Response): Promise<void> {
  res
    .status(200)
    .json(
      await liquidacionService.listarLiquidaciones(
        req.user!.id,
        req.user!.roles,
        req.query as unknown as ListarLiquidacionesQuery,
      ),
    );
}

export async function aprobar(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res
    .status(200)
    .json(await liquidacionService.aprobarLiquidacion(id, req.user!.id));
}

export async function pagar(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res.status(200).json(await liquidacionService.pagarLiquidacion(id, req.user!.id));
}
