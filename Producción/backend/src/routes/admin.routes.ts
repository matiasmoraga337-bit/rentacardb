import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import * as catalogoController from '../controllers/catalogo.controller';
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

router.get(
  '/catalogos/:tipo',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(catalogoController.adminListar),
);

router.post(
  '/catalogos/:tipo',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(catalogoController.adminCrear),
);

router.put(
  '/catalogos/:tipo/:id',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(catalogoController.adminActualizar),
);

router.delete(
  '/catalogos/:tipo/:id',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(catalogoController.adminDesactivar),
);

router.get(
  '/outbox',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(adminController.outbox),
);

router.post(
  '/outbox/:id/reintentar',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(adminController.reintentarOutbox),
);

router.post(
  '/reservas/expirar',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(reservaController.expirar),
);

export default router;
