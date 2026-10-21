import { type Request, type Response } from 'express';
import {
  type ConfirmarWebPayInput,
  type IniciarWebPayInput,
  type ListarPagosQuery,
  type RegistrarPagoInput,
} from '../schemas/pago.schema';
import * as pagoService from '../services/pago.service';
import { AppError } from '../utils/AppError';

const TOKEN_RE = /^[0-9A-Fa-f]{64}$/;

function parseToken(value: string): string {
  if (!TOKEN_RE.test(value)) {
    throw new AppError(400, 'TOKEN_INVALIDO', 'Token WebPay invalido.');
  }
  return value;
}

export async function registrar(req: Request, res: Response): Promise<void> {
  res.status(201).json(await pagoService.registrarPago(req.body as RegistrarPagoInput));
}

export async function listar(req: Request, res: Response): Promise<void> {
  const { reserva } = req.query as unknown as ListarPagosQuery;
  res
    .status(200)
    .json(await pagoService.listarPagos(reserva, req.user!.id, req.user!.roles));
}

export async function iniciarWebPay(req: Request, res: Response): Promise<void> {
  const { ID_reserva } = req.body as IniciarWebPayInput;
  res
    .status(201)
    .json(await pagoService.iniciarWebPay(ID_reserva, req.user!.id, req.user!.roles));
}

export async function transaccion(req: Request, res: Response): Promise<void> {
  const token = parseToken(req.params.token);
  res
    .status(200)
    .json(await pagoService.obtenerTransaccion(token, req.user!.id, req.user!.roles));
}

export async function confirmarWebPay(req: Request, res: Response): Promise<void> {
  res
    .status(200)
    .json(
      await pagoService.confirmarWebPay(
        req.body as ConfirmarWebPayInput,
        req.user!.id,
        req.user!.roles,
      ),
    );
}

export async function reporteIngresos(req: Request, res: Response): Promise<void> {
  const anio = Number(req.query.anio);
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
    throw new AppError(400, 'ANIO_INVALIDO', 'El parametro anio debe ser un año valido.');
  }
  let idProveedor: number | undefined;
  if (typeof req.query.ID_proveedor === 'string' && req.query.ID_proveedor.length > 0) {
    idProveedor = Number(req.query.ID_proveedor);
    if (!Number.isInteger(idProveedor) || idProveedor <= 0) {
      throw new AppError(400, 'PARAMETRO_INVALIDO', 'ID_proveedor invalido.');
    }
  }
  res.status(200).json(await pagoService.reporteIngresos(anio, idProveedor));
}
