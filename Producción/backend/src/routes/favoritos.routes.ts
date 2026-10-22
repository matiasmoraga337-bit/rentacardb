import { Router } from 'express';
import * as favoritoController from '../controllers/favorito.controller';
import { authenticate } from '../middlewares/authenticate';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', authenticate, asyncHandler(favoritoController.listarFavoritos));
router.post('/:vehiculoId', authenticate, asyncHandler(favoritoController.agregarFavorito));
router.delete('/:vehiculoId', authenticate, asyncHandler(favoritoController.quitarFavorito));

export default router;
