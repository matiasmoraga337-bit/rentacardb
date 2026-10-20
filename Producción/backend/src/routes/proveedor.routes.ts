import { Router } from 'express';
import * as proveedorController from '../controllers/proveedor.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  configuracionSchema,
  registrarProveedorSchema,
  sedeCreateSchema,
  sedeUpdateSchema,
} from '../schemas/proveedor.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post(
  '/',
  authenticate,
  validate(registrarProveedorSchema),
  asyncHandler(proveedorController.registrar),
);
router.get('/mio', authenticate, asyncHandler(proveedorController.mio));
router.get('/', authenticate, authorize('ADMIN'), asyncHandler(proveedorController.listar));
router.get('/:id', authenticate, asyncHandler(proveedorController.obtener));
router.patch(
  '/:id/aprobar',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(proveedorController.aprobar),
);
router.put(
  '/:id/configuracion',
  authenticate,
  validate(configuracionSchema),
  asyncHandler(proveedorController.actualizarConfiguracion),
);
router.get('/:id/sedes', authenticate, asyncHandler(proveedorController.listarSedes));
router.post(
  '/:id/sedes',
  authenticate,
  validate(sedeCreateSchema),
  asyncHandler(proveedorController.crearSede),
);
router.put(
  '/:id/sedes/:sedeId',
  authenticate,
  validate(sedeUpdateSchema),
  asyncHandler(proveedorController.actualizarSede),
);
router.delete('/:id/sedes/:sedeId', authenticate, asyncHandler(proveedorController.eliminarSede));

export default router;
