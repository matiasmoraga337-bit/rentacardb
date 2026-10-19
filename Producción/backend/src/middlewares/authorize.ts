import { type NextFunction, type Request, type Response } from 'express';
import { AppError } from '../utils/AppError';

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'No autenticado.');
    }
    if (roles.length > 0 && !roles.some((role) => req.user!.roles.includes(role))) {
      throw new AppError(403, 'FORBIDDEN', 'No tiene permisos para esta accion.');
    }
    next();
  };
}
