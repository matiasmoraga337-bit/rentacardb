import { type Request, type Response } from 'express';
import type { GuardarBusquedaInput } from '../schemas/busqueda.schema';
import * as favoritoService from '../services/favorito.service';
import { AppError } from '../utils/AppError';

const parseId = (value: string, name: string): number => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'PARAMETRO_INVALIDO', `El parametro ${name} debe ser un entero positivo.`);
  }
  return id;
};

export async function listarFavoritos(req: Request, res: Response): Promise<void> {
  res.status(200).json(await favoritoService.listarFavoritos(req.user!.id));
}

export async function agregarFavorito(req: Request, res: Response): Promise<void> {
  const idVehiculo = parseId(req.params.vehiculoId, 'vehiculoId');
  await favoritoService.agregarFavorito(req.user!.id, idVehiculo);
  res.status(201).json({ message: 'Vehiculo agregado a favoritos.' });
}

export async function quitarFavorito(req: Request, res: Response): Promise<void> {
  const idVehiculo = parseId(req.params.vehiculoId, 'vehiculoId');
  await favoritoService.quitarFavorito(req.user!.id, idVehiculo);
  res.status(204).send();
}

export async function listarBusquedas(req: Request, res: Response): Promise<void> {
  res.status(200).json(await favoritoService.listarBusquedas(req.user!.id));
}

export async function crearBusqueda(req: Request, res: Response): Promise<void> {
  res
    .status(201)
    .json(
      await favoritoService.crearBusqueda(req.user!.id, req.body as GuardarBusquedaInput),
    );
}

export async function eliminarBusqueda(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  await favoritoService.eliminarBusqueda(id, req.user!.id);
  res.status(204).send();
}
