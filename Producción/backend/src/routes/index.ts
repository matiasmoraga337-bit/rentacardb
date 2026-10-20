import { Router } from 'express';
import authRoutes from './auth.routes';
import catalogoRoutes from './catalogo.routes';
import healthRoutes from './health.routes';

const router = Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/', catalogoRoutes);

export default router;
