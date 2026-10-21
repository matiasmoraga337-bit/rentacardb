import { Router } from 'express';
import * as reembolsoController from '../controllers/reembolso.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  completarReembolsoSchema,
  crearReembolsoSchema,
  listarReembolsosQuerySchema,
} from '../schemas/reembolso.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get(
  '/',
  authenticate,
  validate(listarReembolsosQuerySchema, 'query'),
  asyncHandler(reembolsoController.listar),
);

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(crearReembolsoSchema),
  asyncHandler(reembolsoController.crear),
);

router.post(
  '/:id/completar',
  authenticate,
  authorize('ADMIN'),
  validate(completarReembolsoSchema),
  asyncHandler(reembolsoController.completar),
);

export default router;
