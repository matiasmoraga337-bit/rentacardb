import { type Request, type Response } from 'express';
import type { CrearResenaInput } from '../schemas/resena.schema';
import * as resenaService from '../services/resena.service';
import { AppError } from '../utils/AppError';

const parseId = (value: string, name: string): number => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'PARAMETRO_INVALIDO', `El parametro ${name} debe ser un entero positivo.`);
  }
  return id;
};

export async function crear(req: Request, res: Response): Promise<void> {
  const result = await resenaService.crearResena(
    req.user!.id,
    req.user!.roles,
    req.body as CrearResenaInput,
  );
  res.status(201).json(result);
}

export async function listarVehiculo(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res.status(200).json(await resenaService.listarResenasVehiculo(id));
}

export async function listarProveedor(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res.status(200).json(await resenaService.listarResenasProveedor(id));
}
