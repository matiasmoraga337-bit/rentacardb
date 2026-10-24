import { type Request, type Response } from 'express';
import {
  type ConfiguracionInput,
  type RegistrarProveedorInput,
  type SedeCreateInput,
  type SedeUpdateInput,
} from '../schemas/proveedor.schema';
import * as adminRepo from '../repositories/admin.repository';
import * as proveedorService from '../services/proveedor.service';
import { AppError } from '../utils/AppError';

const parseId = (value: string, name: string): number => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'PARAMETRO_INVALIDO', `El parametro ${name} debe ser un entero positivo.`);
  }
  return id;
};

export async function registrar(req: Request, res: Response): Promise<void> {
  const result = await proveedorService.registrar(req.user!.id, req.body as RegistrarProveedorInput);
  res.status(201).json(result);
}

export async function mio(req: Request, res: Response): Promise<void> {
  res.status(200).json(await proveedorService.mio(req.user!.id));
}

export async function listar(req: Request, res: Response): Promise<void> {
  const estado = typeof req.query.estado === 'string' ? req.query.estado : undefined;
  res.status(200).json(await proveedorService.listar(estado));
}

export async function obtener(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res.status(200).json(await proveedorService.obtener(id));
}

export async function aprobar(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res.status(200).json(await proveedorService.aprobar(id, req.user!.id));
}

export async function actualizarConfiguracion(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  const result = await proveedorService.actualizarConfiguracion(
    id,
    req.user!.id,
    req.body as ConfiguracionInput,
  );
  res.status(200).json(result);
}

export async function listarSedes(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res.status(200).json(await proveedorService.listarSedes(id, req.user!.id));
}

export async function crearSede(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  const result = await proveedorService.crearSede(
    id,
    req.user!.id,
    req.body as SedeCreateInput,
  );
  res.status(201).json(result);
}

export async function actualizarSede(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  const idSede = parseId(req.params.sedeId, 'sedeId');
  const result = await proveedorService.actualizarSede(
    id,
    idSede,
    req.user!.id,
    req.body as SedeUpdateInput,
  );
  res.status(200).json(result);
}

export async function eliminarSede(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  const idSede = parseId(req.params.sedeId, 'sedeId');
  await proveedorService.eliminarSede(id, idSede, req.user!.id);
  res.status(204).send();
}

export async function documentosVencidos(req: Request, res: Response): Promise<void> {
  res.status(200).json(await adminRepo.listarDocumentosVencidosProveedor(req.user!.id));
}
