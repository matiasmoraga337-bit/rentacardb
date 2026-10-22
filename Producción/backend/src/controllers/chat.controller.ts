import { type Request, type Response } from 'express';
import {
  type CrearConversacionInput,
  type EnviarMensajeInput,
} from '../schemas/chat.schema';
import * as chatService from '../services/chat.service';
import { AppError } from '../utils/AppError';

const parseId = (value: string, name: string): number => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'PARAMETRO_INVALIDO', `El parametro ${name} debe ser un entero positivo.`);
  }
  return id;
};

export async function crear(req: Request, res: Response): Promise<void> {
  const result = await chatService.crearConversacion(
    req.user!.id,
    req.body as CrearConversacionInput,
  );
  res.status(result.fueCreada === false ? 200 : 201).json(result);
}

export async function listar(req: Request, res: Response): Promise<void> {
  res.status(200).json(await chatService.listarConversaciones(req.user!.id));
}

export async function mensajes(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res.status(200).json(await chatService.listarMensajes(id, req.user!.id));
}

export async function enviar(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res
    .status(201)
    .json(await chatService.enviarMensaje(id, req.user!.id, req.body as EnviarMensajeInput));
}

export async function adjuntos(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  const idMensaje = parseId(req.params.mensajeId, 'mensajeId');
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  res
    .status(201)
    .json(await chatService.enviarAdjuntos(id, idMensaje, req.user!.id, files));
}

export async function leidos(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res.status(200).json(await chatService.marcarLeidos(id, req.user!.id));
}

export async function cerrar(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, 'id');
  res.status(200).json(await chatService.cerrarConversacion(id, req.user!.id));
}
