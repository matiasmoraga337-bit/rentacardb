import { type Request, type Response } from 'express';
import type {
  CrearDisputaInput,
  ListarDisputasQuery,
  ResolverDisputaInput,
} from '../schemas/disputa.schema';
import * as disputaService from '../services/disputa.service';
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
      await disputaService.crearDisputa(
        req.user!.id,
        req.user!.roles,
        req.body as CrearDisputaInput,
      ),
    );
}

export async function listar(req: Request, res: Response): Promise<void> {
  res
    .status(200)
    .json(
      await disputaService.listarDisputas(
        req.user!.id,
        req.user!.roles,
        req.query as unknown as ListarDisputasQuery,
      ),
    );
}

export async function detalle(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res.status(200).json(await disputaService.obtenerDisputa(id, req.user!.id, req.user!.roles));
}

export async function resolver(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res
    .status(200)
    .json(
      await disputaService.resolverDisputa(id, req.user!.id, req.body as ResolverDisputaInput),
    );
}
