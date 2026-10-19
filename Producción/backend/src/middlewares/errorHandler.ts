import { type NextFunction, type Request, type Response } from 'express';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

const SQL_ERROR_MAP: Record<number, { status: number; code: string }> = {
  51101: { status: 400, code: 'RUT_INVALIDO' },
  51102: { status: 400, code: 'NOMBRES_VACIOS' },
  51103: { status: 400, code: 'EMAIL_INVALIDO' },
  51104: { status: 400, code: 'PASSWORD_INVALIDO' },
  51105: { status: 409, code: 'RUT_DUPLICADO' },
  51106: { status: 409, code: 'EMAIL_DUPLICADO' },
  51107: { status: 400, code: 'ROL_INVALIDO' },
  51130: { status: 401, code: 'CREDENCIALES_INVALIDAS' },
};

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  const sqlErr = err as { number?: number; message?: string };
  if (sqlErr?.number && SQL_ERROR_MAP[sqlErr.number]) {
    const mapped = SQL_ERROR_MAP[sqlErr.number];
    res.status(mapped.status).json({
      error: { code: mapped.code, message: sqlErr.message ?? 'Error de negocio.', details: [] },
    });
    return;
  }

  console.error('Error no controlado:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Error interno del servidor.',
      details: env.NODE_ENV === 'development' ? [sqlErr?.message ?? String(err)] : [],
    },
  });
}
