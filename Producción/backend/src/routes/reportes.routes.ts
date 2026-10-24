import { Router } from 'express';
import * as pagoController from '../controllers/pago.controller';
import * as reporteController from '../controllers/reporte.controller';
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

router.get(
  '/liquidaciones',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(reporteController.liquidaciones),
);

router.get(
  '/proveedores',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(reporteController.proveedores),
);

router.get(
  '/tipos-proveedor',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(reporteController.tiposProveedor),
);

router.get(
  '/integridad',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(reporteController.integridad),
);

export default router;
