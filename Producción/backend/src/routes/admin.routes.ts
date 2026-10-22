import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import * as reservaController from '../controllers/reserva.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get(
  '/auditoria',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(adminController.auditoria),
);

router.post(
  '/reservas/expirar',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(reservaController.expirar),
);

export default router;
