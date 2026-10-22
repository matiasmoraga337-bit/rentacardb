import { Router } from 'express';
import * as favoritoController from '../controllers/favorito.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { guardarBusquedaSchema } from '../schemas/busqueda.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', authenticate, asyncHandler(favoritoController.listarBusquedas));
router.post(
  '/',
  authenticate,
  validate(guardarBusquedaSchema),
  asyncHandler(favoritoController.crearBusqueda),
);
router.delete('/:id', authenticate, asyncHandler(favoritoController.eliminarBusqueda));

export default router;
