import { Router } from 'express';
import * as disputaController from '../controllers/disputa.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  crearDisputaSchema,
  listarDisputasQuerySchema,
  resolverDisputaSchema,
} from '../schemas/disputa.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get(
  '/',
  authenticate,
  validate(listarDisputasQuerySchema, 'query'),
  asyncHandler(disputaController.listar),
);

router.post(
  '/',
  authenticate,
  validate(crearDisputaSchema),
  asyncHandler(disputaController.crear),
);

router.get('/:id', authenticate, asyncHandler(disputaController.detalle));

router.post(
  '/:id/resolver',
  authenticate,
  authorize('ADMIN'),
  validate(resolverDisputaSchema),
  asyncHandler(disputaController.resolver),
);

export default router;
