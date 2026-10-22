import { Router } from 'express';
import * as arriendoController from '../controllers/arriendo.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { imageUpload } from '../middlewares/upload';
import { validate } from '../middlewares/validate';
import {
  aceptarContratoSchema,
  cargoExtraSchema,
  conductorAdicionalSchema,
  danoInspeccionSchema,
  devolucionArriendoSchema,
  iniciarArriendoSchema,
  listarArriendosQuerySchema,
  multaSchema,
} from '../schemas/arriendo.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get(
  '/',
  authenticate,
  validate(listarArriendosQuerySchema, 'query'),
  asyncHandler(arriendoController.listar),
);

router.post(
  '/iniciar',
  authenticate,
  authorize('PROVEEDOR', 'OPERADOR', 'ADMIN'),
  validate(iniciarArriendoSchema),
  asyncHandler(arriendoController.iniciar),
);

router.get('/:id/contrato', authenticate, asyncHandler(arriendoController.obtenerContrato));

router.post(
  '/:id/contrato',
  authenticate,
  authorize('CLIENTE'),
  validate(aceptarContratoSchema),
  asyncHandler(arriendoController.aceptarContrato),
);

router.post(
  '/:id/conductores',
  authenticate,
  authorize('CLIENTE'),
  validate(conductorAdicionalSchema),
  asyncHandler(arriendoController.conductor),
);

router.post(
  '/:id/inspecciones/:inspeccionId/danos',
  authenticate,
  authorize('PROVEEDOR', 'OPERADOR', 'ADMIN'),
  validate(danoInspeccionSchema),
  asyncHandler(arriendoController.dano),
);

router.post(
  '/:id/inspecciones/:inspeccionId/fotos',
  authenticate,
  authorize('PROVEEDOR', 'OPERADOR', 'ADMIN'),
  imageUpload.array('fotos', 8),
  asyncHandler(arriendoController.fotoInspeccion),
);

router.post(
  '/:id/cargos-extra',
  authenticate,
  authorize('PROVEEDOR', 'OPERADOR', 'ADMIN'),
  validate(cargoExtraSchema),
  asyncHandler(arriendoController.cargoExtra),
);

router.post(
  '/:id/multas',
  authenticate,
  authorize('PROVEEDOR', 'OPERADOR', 'ADMIN'),
  validate(multaSchema),
  asyncHandler(arriendoController.multa),
);

router.post(
  '/:id/devolucion',
  authenticate,
  authorize('PROVEEDOR', 'OPERADOR', 'ADMIN'),
  validate(devolucionArriendoSchema),
  asyncHandler(arriendoController.devolucion),
);

router.get('/:id', authenticate, asyncHandler(arriendoController.detalle));

export default router;
