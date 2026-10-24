import { type Request, type Response } from 'express';
import * as reporteRepo from '../repositories/reporte.repository';

export async function liquidaciones(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await reporteRepo.reporteLiquidaciones());
}

export async function proveedores(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await reporteRepo.reporteProveedores());
}

export async function tiposProveedor(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await reporteRepo.reporteTiposProveedor());
}

export async function integridad(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await reporteRepo.validarIntegridad());
}
