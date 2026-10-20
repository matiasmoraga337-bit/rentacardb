import { Router } from 'express';
import authRoutes from './auth.routes';
import catalogoRoutes from './catalogo.routes';
import healthRoutes from './health.routes';
import proveedorRoutes from './proveedor.routes';
import usuariosRoutes from './usuarios.routes';
import vehiculoRoutes from './vehiculo.routes';

const router = Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/proveedores', proveedorRoutes);
router.use('/vehiculos', vehiculoRoutes);
router.use('/', catalogoRoutes);

export default router;
