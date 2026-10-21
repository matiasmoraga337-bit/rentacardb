import { Router } from 'express';
import * as reservaController from '../controllers/reserva.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  cambiarEstadoReservaSchema,
  cancelarReservaSchema,
  crearReservaSchema,
  listarReservasQuerySchema,
} from '../schemas/reserva.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get(
  '/',
  authenticate,
  validate(listarReservasQuerySchema, 'query'),
  asyncHandler(reservaController.listar),
);

router.post(
  '/',
  authenticate,
  authorize('CLIENTE'),
  validate(crearReservaSchema),
  asyncHandler(reservaController.crear),
);

router.get(
  '/:id/cancelacion',
  authenticate,
  asyncHandler(reservaController.previsualizarCancelacion),
);

router.get('/:id/historial', authenticate, asyncHandler(reservaController.historial));

router.get('/:id/snapshot', authenticate, asyncHandler(reservaController.snapshot));

router.post(
  '/:id/cancelar',
  authenticate,
  authorize('CLIENTE', 'ADMIN'),
  validate(cancelarReservaSchema),
  asyncHandler(reservaController.cancelar),
);

router.post(
  '/:id/estado',
  authenticate,
  authorize('ADMIN'),
  validate(cambiarEstadoReservaSchema),
  asyncHandler(reservaController.cambiarEstado),
);

router.get('/:id', authenticate, asyncHandler(reservaController.detalle));

export default router;
