import { type Request, type Response } from 'express';
import * as adminRepo from '../repositories/admin.repository';
import * as auditoriaRepo from '../repositories/auditoria.repository';
import * as outboxRepo from '../repositories/outbox.repository';
import { AppError } from '../utils/AppError';

function parseLimit(value: unknown): number {
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit <= 0) return 10;
  return Math.min(limit, 100);
}

export async function auditoria(req: Request, res: Response): Promise<void> {
  const entidad = typeof req.query.entidad === 'string' ? req.query.entidad.trim() : undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  const result = await auditoriaRepo.listarAuditoria({ entidad, page, pageSize });
  res.status(200).json({ data: result.rows, page, pageSize, total: result.total });
}

export async function outbox(req: Request, res: Response): Promise<void> {
  const estado = typeof req.query.estado === 'string' ? req.query.estado.trim() : undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  const result = await outboxRepo.listarOutbox({ estado, page, pageSize });
  res.status(200).json({ data: result.rows, page, pageSize, total: result.total });
}

export async function reintentarOutbox(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'PARAMETRO_INVALIDO', 'El parametro id debe ser un entero positivo.');
  }
  try {
    await outboxRepo.reintentarEvento(id);
  } catch (error) {
    const sqlError = error as { number?: number };
    if (sqlError.number === 70312) {
      throw new AppError(409, 'OUTBOX_NO_REINTENTABLE', 'El evento no esta disponible para reintento.');
    }
    throw error;
  }
  res.status(200).json({ message: 'Evento reenviado a PENDIENTE.' });
}

export async function vehiculosPublicados(req: Request, res: Response): Promise<void> {
  res.status(200).json(
    await adminRepo.listarVehiculosPublicados(parseLimit(req.query.limit)),
  );
}

export async function pagosPendientes(req: Request, res: Response): Promise<void> {
  res.status(200).json(await adminRepo.listarPagosPendientes(parseLimit(req.query.limit)));
}

export async function documentosVencidos(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await adminRepo.listarDocumentosVencidos());
}
