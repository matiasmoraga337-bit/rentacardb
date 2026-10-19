import { type NextFunction, type Request, type Response } from 'express';
import { type AnyZodObject } from 'zod';
import { AppError } from '../utils/AppError';

type Source = 'body' | 'params' | 'query';

export function validate(schema: AnyZodObject, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Datos de entrada invalidos.',
        result.error.flatten(),
      );
    }
    req[source] = result.data;
    next();
  };
}
