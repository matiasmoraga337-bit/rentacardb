import { type Request, type Response } from 'express';
import {
  type ActualizarVehiculoInput,
  type RegistrarVehiculoInput,
  type TarifaCreateInput,
  type TarifaUpdateInput,
  caracteristicaSchema,
  documentoCreateSchema,
} from '../schemas/vehiculo.schema';
import * as vehiculoService from '../services/vehiculo.service';
import { AppError } from '../utils/AppError';
import { esFechaValida } from '../utils/dates';

const parseId = (value: string, name: string): number => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'PARAMETRO_INVALIDO', `El parametro ${name} debe ser un entero positivo.`);
  }
  return id;
};

export async function registrar(req: Request, res: Response): Promise<void> {
  const result = await vehiculoService.registrar(req.user!.id, req.body as RegistrarVehiculoInput);
  res.status(201).json(result);
}

export async function actualizar(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  const result = await vehiculoService.actualizar(
    req.user!.id,
    id,
    req.body as ActualizarVehiculoInput,
  );
  res.status(200).json(result);
}

export async function listarMios(req: Request, res: Response): Promise<void> {
  res.status(200).json(await vehiculoService.listar(req.user!.id));
}

export async function detalle(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res.status(200).json(await vehiculoService.detalle(id));
}

export async function publicar(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  await vehiculoService.publicar(req.user!.id, id);
  res.status(200).json({ message: 'Vehiculo publicado.' });
}

export async function subirFotos(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  res.status(201).json(await vehiculoService.subirFotos(req.user!.id, id, files));
}

export async function eliminarFoto(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  const idFoto = parseId(req.params.fotoId, 'fotoId');
  await vehiculoService.eliminarFoto(req.user!.id, id, idFoto);
  res.status(204).send();
}

export async function agregarCaracteristica(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  const parsed = caracteristicaSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Datos invalidos.', parsed.error.flatten());
  }
  const result = await vehiculoService.agregarCaracteristica(
    req.user!.id,
    id,
    parsed.data.ID_caracteristica,
    parsed.data.disponible ?? true,
  );
  res.status(201).json(result);
}

export async function quitarCaracteristica(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  const idCaracteristica = parseId(req.params.caracteristicaId, 'caracteristicaId');
  await vehiculoService.quitarCaracteristica(req.user!.id, id, idCaracteristica);
  res.status(204).send();
}

export async function crearTarifa(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  const result = await vehiculoService.crearTarifa(
    req.user!.id,
    id,
    req.body as TarifaCreateInput,
  );
  res.status(201).json(result);
}

export async function actualizarTarifa(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  const idTarifa = parseId(req.params.tarifaId, 'tarifaId');
  const result = await vehiculoService.actualizarTarifa(
    req.user!.id,
    id,
    idTarifa,
    req.body as TarifaUpdateInput,
  );
  res.status(200).json(result);
}

export async function eliminarTarifa(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  const idTarifa = parseId(req.params.tarifaId, 'tarifaId');
  await vehiculoService.eliminarTarifa(req.user!.id, id, idTarifa);
  res.status(204).send();
}

export async function subirDocumento(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  const parsed = documentoCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Datos invalidos.', parsed.error.flatten());
  }
  const result = await vehiculoService.subirDocumento(req.user!.id, id, req.file, parsed.data);
  res.status(201).json(result);
}

export async function listarDocumentos(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res.status(200).json(await vehiculoService.listarDocumentos(req.user!.id, id));
}

const parseOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const parseOptionalDate = (value: unknown): string | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || !esFechaValida(value)) {
    throw new AppError(400, 'FECHA_INVALIDA', 'El parametro de fecha no es valido (YYYY-MM-DD).');
  }
  return value;
};

export async function buscar(req: Request, res: Response): Promise<void> {
  const fechaInicio = parseOptionalDate(req.query.fecha_inicio);
  const fechaFin = parseOptionalDate(req.query.fecha_fin);
  if (fechaInicio && fechaFin && fechaFin <= fechaInicio) {
    throw new AppError(
      400,
      'FECHAS_INVALIDAS',
      'La fecha de fin debe ser posterior a la fecha de inicio.',
    );
  }
  res.status(200).json(
    await vehiculoService.buscar({
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      ID_comuna: parseOptionalNumber(req.query.ID_comuna),
      ID_region: parseOptionalNumber(req.query.ID_region),
      ID_tipo_vehiculo: parseOptionalNumber(req.query.ID_tipo_vehiculo),
      precio_maximo: parseOptionalNumber(req.query.precio_maximo),
      ID_caracteristica: parseOptionalNumber(req.query.ID_caracteristica),
    }),
  );
}

export async function disponibilidad(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  const desde = req.query.desde;
  const hasta = req.query.hasta;
  if (typeof desde !== 'string' || typeof hasta !== 'string') {
    throw new AppError(400, 'FECHAS_REQUERIDAS', 'Debe indicar desde y hasta (YYYY-MM-DD).');
  }
  res.status(200).json(await vehiculoService.disponibilidad(id, desde, hasta));
}
