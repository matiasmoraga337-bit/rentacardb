import { type Request, type Response } from 'express';
import {
  type ConductorAdicionalInput,
  type DanoInspeccionInput,
  type DevolucionArriendoInput,
  type IniciarArriendoInput,
  type ListarArriendosQuery,
} from '../schemas/arriendo.schema';
import * as arriendoService from '../services/arriendo.service';
import { AppError } from '../utils/AppError';

const parseId = (value: string, name: string): number => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'PARAMETRO_INVALIDO', `El parametro ${name} debe ser un entero positivo.`);
  }
  return id;
};

export async function listar(req: Request, res: Response): Promise<void> {
  const result = await arriendoService.listarArriendos(
    req.user!.id,
    req.user!.roles,
    req.query as unknown as ListarArriendosQuery,
  );
  res.status(200).json(result);
}

export async function detalle(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res.status(200).json(await arriendoService.obtenerArriendo(id, req.user!.id, req.user!.roles));
}

export async function iniciar(req: Request, res: Response): Promise<void> {
  const result = await arriendoService.iniciarArriendo(
    req.user!.id,
    req.user!.roles,
    req.body as IniciarArriendoInput,
  );
  res.status(201).json(result);
}

export async function devolucion(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  const result = await arriendoService.registrarDevolucion(
    id,
    req.user!.id,
    req.user!.roles,
    req.body as DevolucionArriendoInput,
  );
  res.status(200).json(result);
}

export async function dano(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  const idInspeccion = parseId(req.params.inspeccionId, 'inspeccionId');
  res
    .status(201)
    .json(
      await arriendoService.registrarDano(
        id,
        idInspeccion,
        req.user!.id,
        req.user!.roles,
        req.body as DanoInspeccionInput,
      ),
    );
}

export async function conductor(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res
    .status(201)
    .json(
      await arriendoService.registrarConductor(
        id,
        req.user!.id,
        req.user!.roles,
        req.body as ConductorAdicionalInput,
      ),
    );
}

export async function obtenerContrato(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res
    .status(200)
    .json(await arriendoService.obtenerContrato(id, req.user!.id, req.user!.roles));
}

export async function aceptarContrato(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res
    .status(201)
    .json(
      await arriendoService.aceptarContrato(
        id,
        req.user!.id,
        req.user!.roles,
        req.ip,
        req.get('user-agent') ?? undefined,
      ),
    );
}
