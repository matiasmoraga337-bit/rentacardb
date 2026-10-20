import { Router } from 'express';
import * as vehiculoController from '../controllers/vehiculo.controller';
import { authenticate } from '../middlewares/authenticate';
import { documentUpload, imageUpload } from '../middlewares/upload';
import { validate } from '../middlewares/validate';
import {
  actualizarVehiculoSchema,
  registrarVehiculoSchema,
  tarifaCreateSchema,
  tarifaUpdateSchema,
} from '../schemas/vehiculo.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/mios', authenticate, asyncHandler(vehiculoController.listarMios));
router.get('/buscar', asyncHandler(vehiculoController.buscar));
router.post(
  '/',
  authenticate,
  validate(registrarVehiculoSchema),
  asyncHandler(vehiculoController.registrar),
);
router.get('/:id', asyncHandler(vehiculoController.detalle));
router.put(
  '/:id',
  authenticate,
  validate(actualizarVehiculoSchema),
  asyncHandler(vehiculoController.actualizar),
);
router.post('/:id/publicar', authenticate, asyncHandler(vehiculoController.publicar));
router.post(
  '/:id/fotos',
  authenticate,
  imageUpload.array('fotos', 8),
  asyncHandler(vehiculoController.subirFotos),
);
router.delete('/:id/fotos/:fotoId', authenticate, asyncHandler(vehiculoController.eliminarFoto));
router.post(
  '/:id/caracteristicas',
  authenticate,
  asyncHandler(vehiculoController.agregarCaracteristica),
);
router.delete(
  '/:id/caracteristicas/:caracteristicaId',
  authenticate,
  asyncHandler(vehiculoController.quitarCaracteristica),
);
router.post(
  '/:id/tarifas',
  authenticate,
  validate(tarifaCreateSchema),
  asyncHandler(vehiculoController.crearTarifa),
);
router.put(
  '/:id/tarifas/:tarifaId',
  authenticate,
  validate(tarifaUpdateSchema),
  asyncHandler(vehiculoController.actualizarTarifa),
);
router.delete(
  '/:id/tarifas/:tarifaId',
  authenticate,
  asyncHandler(vehiculoController.eliminarTarifa),
);
router.post(
  '/:id/documentos',
  authenticate,
  documentUpload.single('documento'),
  asyncHandler(vehiculoController.subirDocumento),
);
router.get(
  '/:id/documentos',
  authenticate,
  asyncHandler(vehiculoController.listarDocumentos),
);

export default router;
