import { Router } from 'express';
import * as liquidacionController from '../controllers/liquidacion.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  crearLiquidacionSchema,
  listarLiquidacionesQuerySchema,
} from '../schemas/liquidacion.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get(
  '/',
  authenticate,
  validate(listarLiquidacionesQuerySchema, 'query'),
  asyncHandler(liquidacionController.listar),
);

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(crearLiquidacionSchema),
  asyncHandler(liquidacionController.crear),
);

router.post(
  '/:id/aprobar',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(liquidacionController.aprobar),
);

router.post(
  '/:id/pagar',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(liquidacionController.pagar),
);

export default router;
