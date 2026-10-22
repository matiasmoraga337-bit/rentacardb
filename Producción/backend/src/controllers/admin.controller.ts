import { type Request, type Response } from 'express';
import * as auditoriaRepo from '../repositories/auditoria.repository';

export async function auditoria(req: Request, res: Response): Promise<void> {
  const entidad = typeof req.query.entidad === 'string' ? req.query.entidad.trim() : undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  const result = await auditoriaRepo.listarAuditoria({ entidad, page, pageSize });
  res.status(200).json({ data: result.rows, page, pageSize, total: result.total });
}
