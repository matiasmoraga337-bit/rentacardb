import { Router } from 'express';
import * as catalogoController from '../controllers/catalogo.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/regiones', asyncHandler(catalogoController.regiones));
router.get('/regiones/:id/provincias', asyncHandler(catalogoController.provincias));
router.get('/provincias/:id/comunas', asyncHandler(catalogoController.comunasPorProvincia));
router.get('/comunas', asyncHandler(catalogoController.buscarComunas));
router.get('/catalogos/:tipo', asyncHandler(catalogoController.catalogo));

export default router;
