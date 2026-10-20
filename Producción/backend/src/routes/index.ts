import { Router } from 'express';
import authRoutes from './auth.routes';
import catalogoRoutes from './catalogo.routes';
import healthRoutes from './health.routes';
import usuariosRoutes from './usuarios.routes';

const router = Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/', catalogoRoutes);

export default router;
