import { Router } from 'express';
import * as pagoController from '../controllers/pago.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get(
  '/ingresos',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(pagoController.reporteIngresos),
);

export default router;
