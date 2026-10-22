import { Router } from 'express';
import * as notificacionController from '../controllers/notificacion.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { listarNotificacionesQuerySchema } from '../schemas/notificacion.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get(
  '/',
  authenticate,
  validate(listarNotificacionesQuerySchema, 'query'),
  asyncHandler(notificacionController.listar),
);

router.get('/no-leidas', authenticate, asyncHandler(notificacionController.noLeidas));

router.post('/:id/leer', authenticate, asyncHandler(notificacionController.leer));

export default router;
