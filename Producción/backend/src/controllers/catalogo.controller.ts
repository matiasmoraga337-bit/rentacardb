import { type Request, type Response } from 'express';
import * as catalogoRepo from '../repositories/catalogo.repository';
import { AppError } from '../utils/AppError';

const parseId = (value: string, name: string): number => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'PARAMETRO_INVALIDO', `El parametro ${name} debe ser un entero positivo.`);
  }
  return id;
};

export async function regiones(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await catalogoRepo.listarRegiones());
}

export async function provincias(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res.status(200).json(await catalogoRepo.listarProvincias(id));
}

export async function comunasPorProvincia(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res.status(200).json(await catalogoRepo.listarComunasPorProvincia(id));
}

export async function buscarComunas(req: Request, res: Response): Promise<void> {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (q.length < 2) {
    throw new AppError(400, 'PARAMETRO_INVALIDO', 'El parametro q debe tener al menos 2 caracteres.');
  }
  res.status(200).json(await catalogoRepo.buscarComunas(q));
}

export async function catalogo(req: Request, res: Response): Promise<void> {
  const tipo = req.params.tipo;
  if (!catalogoRepo.isCatalogoValido(tipo)) {
    throw new AppError(404, 'CATALOGO_NO_ENCONTRADO', `Catalogo '${tipo}' no existe.`);
  }
  let marca: number | undefined;
  if (typeof req.query.marca === 'string' && req.query.marca.length > 0) {
    marca = parseId(req.query.marca, 'marca');
  }
  res.status(200).json(await catalogoRepo.listarCatalogo(tipo, marca));
}
