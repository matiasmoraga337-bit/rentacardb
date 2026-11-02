import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as proveedorController from '../controllers/proveedor.controller';
import * as resenaController from '../controllers/resena.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  cambiarEstadoProveedorSchema,
  configuracionSchema,
  registrarProveedorSchema,
  registroProveedorPublicoSchema,
  sedeCreateSchema,
  sedeUpdateSchema,
} from '../schemas/proveedor.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

const registroPublicoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Demasiados intentos.', details: [] } },
});

router.post(
  '/registro-publico',
  registroPublicoLimiter,
  validate(registroProveedorPublicoSchema),
  asyncHandler(proveedorController.registrarPublico),
);
router.post(
  '/',
  authenticate,
  validate(registrarProveedorSchema),
  asyncHandler(proveedorController.registrar),
);
router.get('/mio', authenticate, asyncHandler(proveedorController.mio));
router.get(
  '/documentos-vencidos',
  authenticate,
  asyncHandler(proveedorController.documentosVencidos),
);
router.get('/:id/resenas', asyncHandler(resenaController.listarProveedor));
router.get('/', authenticate, authorize('ADMIN'), asyncHandler(proveedorController.listar));
router.get('/:id', authenticate, asyncHandler(proveedorController.obtener));
router.patch(
  '/:id/aprobar',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(proveedorController.aprobar),
);
router.patch(
  '/:id/estado',
  authenticate,
  authorize('ADMIN'),
  validate(cambiarEstadoProveedorSchema),
  asyncHandler(proveedorController.cambiarEstado),
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
