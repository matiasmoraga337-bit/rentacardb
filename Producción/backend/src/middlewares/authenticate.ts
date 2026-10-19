import { type NextFunction, type Request, type Response } from 'express';
import { AppError } from '../utils/AppError';
import { verifyToken } from '../utils/jwt';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Falta el token de autenticacion.');
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email, roles: payload.roles ?? [] };
    next();
  } catch {
    throw new AppError(401, 'INVALID_TOKEN', 'Token invalido o expirado.');
  }
}
