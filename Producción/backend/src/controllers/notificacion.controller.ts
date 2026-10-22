import { type Request, type Response } from 'express';
import type { ListarNotificacionesQuery } from '../schemas/notificacion.schema';
import * as notificacionService from '../services/notificacion.service';
import { AppError } from '../utils/AppError';

const parseId = (value: string, name: string): number => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'PARAMETRO_INVALIDO', `El parametro ${name} debe ser un entero positivo.`);
  }
  return id;
};

export async function listar(req: Request, res: Response): Promise<void> {
  res
    .status(200)
    .json(
      await notificacionService.listarNotificaciones(
        req.user!.id,
        req.query as unknown as ListarNotificacionesQuery,
      ),
    );
}

export async function noLeidas(req: Request, res: Response): Promise<void> {
  res.status(200).json(await notificacionService.contarNoLeidas(req.user!.id));
}

export async function leer(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  await notificacionService.marcarLeida(id, req.user!.id);
  res.status(204).send();
}
